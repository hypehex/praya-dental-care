"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { redirect } from "next/navigation";
import {
  hashPasswordForStorage,
  isDatabaseUnavailable,
  requireRoleSession,
  type LoginRole,
} from "./auth";
import { portalHref } from "./portal-config";
import { prisma } from "./prisma";
import { clinicToday, validDate, visitTransitions } from "./workflow";

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function newId(prefix: string) {
  return `${prefix}${randomUUID()
    .replaceAll("-", "")
    .slice(0, 10 - prefix.length)
    .toUpperCase()}`;
}

function redirectForError(path: string, error: unknown): never {
  if (isDatabaseUnavailable(error)) {
    redirect(`${path}?error=database`);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") redirect(`${path}?error=duplicate`);
    if (error.code === "P2003" || error.code === "P2025") {
      redirect(`${path}?error=invalid-data`);
    }
  }
  throw error;
}

export async function reviewPatientRegistrationAction(formData: FormData) {
  await requireRoleSession("manajer-klinik");
  const accountId = formText(formData, "accountId");
  const decision = formText(formData, "decision");
  const status =
    decision === "approve"
      ? "Aktif"
      : decision === "improvement"
        ? "Perbaikan"
        : decision === "reject"
          ? "Ditolak"
          : null;
  if (!accountId || !status) {
    redirect("/dashboard/manajer-klinik/pengajuan-registrasi");
  }

  let updatedCount = 0;
  try {
    const result = await prisma.akun_pengguna.updateMany({
      where: {
        id_akun: accountId,
        status_akun: "Menunggu",
        id_pasien: { not: null },
      },
      data: { status_akun: status },
    });
    updatedCount = result.count;
  } catch (error) {
    redirectForError(
      "/dashboard/manajer-klinik/pengajuan-registrasi",
      error,
    );
  }
  if (!updatedCount) {
    redirect("/dashboard/manajer-klinik/pengajuan-registrasi?error=stale");
  }

  const destination =
    decision === "approve"
      ? "pengajuan-registrasi/disetujui"
      : decision === "improvement"
        ? "pengajuan-registrasi/perbaikan"
        : "pengajuan-registrasi/ditolak";
  redirect(portalHref("manajer-klinik", destination));
}

export async function reviewBookingAction(formData: FormData) {
  await requireRoleSession("manajer-klinik");
  const visitId = formText(formData, "visitId");
  const decision = formText(formData, "decision");
  const status = decision === "approve" ? "Dikonfirmasi" : decision === "reject" ? "Ditolak" : null;
  if (!visitId || !status) {
    redirect("/dashboard/manajer-klinik/kunjungan-pasien?error=invalid-data");
  }
  try {
    const updated = await prisma.kunjungan.updateMany({
      where: { id_kunjungan: visitId, status_kunjungan: "Menunggu" },
      data: { status_kunjungan: status },
    });
    if (!updated.count) {
      redirect("/dashboard/manajer-klinik/kunjungan-pasien?error=stale");
    }
  } catch (error) {
    redirectForError("/dashboard/manajer-klinik/kunjungan-pasien", error);
  }
  redirect("/dashboard/manajer-klinik/kunjungan-pasien");
}

export async function submitFeedbackAction(formData: FormData) {
  const identity = await requireRoleSession("pasien");
  const content = formText(formData, "Isi Kritik dan Saran");
  if (!content || content.length > 255) {
    redirect("/dashboard/pasien/kritik-saran/belum-lengkap");
  }

  try {
    const owner = await prisma.owner.findFirst({
      select: { id_owner: true },
      orderBy: { id_owner: "asc" },
    });
    if (!owner) {
      redirect("/dashboard/pasien/kritik-saran?error=clinic-unavailable");
    }
    await prisma.kritik_saran.create({
      data: {
        id_kritik_saran: newId("K"),
        isi_kritik_saran: content,
        tanggal_pengiriman: new Date(clinicToday()),
        status_tindak_lanjut: "Menunggu",
        id_pasien: identity.profileId,
        id_owner: owner.id_owner,
      },
    });
  } catch (error) {
    redirectForError("/dashboard/pasien/kritik-saran", error);
  }
  redirect("/dashboard/pasien/kritik-saran/terkirim");
}

export async function bookVisitAction(formData: FormData) {
  const identity = await requireRoleSession("pasien");
  const doctorId = formText(formData, "Dokter");
  const scheduleId = formText(formData, "Jadwal Praktik");
  const serviceId = formText(formData, "Jenis Layanan");
  const dateValue = formText(formData, "Tanggal Kunjungan");
  const timeValue = formText(formData, "Waktu Kunjungan");
  const complaint = formText(formData, "Keluhan Awal");
  const date = validDate(dateValue)
    ? new Date(`${dateValue}T00:00:00.000Z`)
    : new Date(Number.NaN);
  const time = new Date(`1970-01-01T${timeValue}:00.000Z`);
  const isOtherService = serviceId === "__other__";
  if (
    !doctorId ||
    !scheduleId ||
    !serviceId ||
    Number.isNaN(date.getTime()) ||
    date < new Date(clinicToday()) ||
    !/^\d{2}:\d{2}$/.test(timeValue) ||
    Number.isNaN(time.getTime()) ||
    !complaint ||
    complaint.length > 255
  ) {
    redirect("/dashboard/pasien/booking-kunjungan/tambah?error=invalid-data");
  }

  try {
    const schedule = await prisma.jadwal_dokter.findUnique({
      where: { id_jadwal: scheduleId },
      select: {
        id_jadwal: true,
        hari: true,
        jam_mulai: true,
        jam_selesai: true,
        status_jadwal: true,
        id_dokter: true,
      },
    });
    const service = isOtherService
      ? null
      : await prisma.pelayanan.findUnique({
          where: { id_pelayanan: serviceId },
          select: { id_pelayanan: true },
        });
    if (
      !schedule ||
      (!service && !isOtherService) ||
      schedule.id_dokter !== doctorId ||
      schedule.status_jadwal.trim().toLocaleLowerCase("id") !== "aktif"
    ) {
      redirect("/dashboard/pasien/booking-kunjungan/tambah?error=invalid-data");
    }

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const requestedDay = dayNames[date.getUTCDay()];
    const requestedMinutes = time.getUTCHours() * 60 + time.getUTCMinutes();
    const startMinutes = schedule.jam_mulai.getUTCHours() * 60 + schedule.jam_mulai.getUTCMinutes();
    const endMinutes = schedule.jam_selesai.getUTCHours() * 60 + schedule.jam_selesai.getUTCMinutes();
    const matchesDay =
      schedule.hari.trim().toLocaleLowerCase("id") === requestedDay.toLocaleLowerCase("id");
    if (!matchesDay || requestedMinutes < startMinutes || requestedMinutes >= endMinutes) {
      redirect("/dashboard/pasien/booking-kunjungan/tambah?error=stale");
    }

    const existingVisit = await prisma.kunjungan.findFirst({
      where: {
        id_jadwal: schedule.id_jadwal,
        tanggal_kunjungan: date,
        waktu_kunjungan: time,
        status_kunjungan: { notIn: ["Dibatalkan", "Ditolak"] },
      },
      select: { id_kunjungan: true },
    });
    if (existingVisit) {
      redirect("/dashboard/pasien/booking-kunjungan/tambah?error=slot-unavailable");
    }

    await prisma.kunjungan.create({
      data: {
        id_kunjungan: newId("V"),
        tanggal_kunjungan: date,
        waktu_kunjungan: time,
        keluhan_awal: complaint,
        status_kunjungan: "Menunggu",
        id_pasien: identity.profileId,
        id_jadwal: schedule.id_jadwal,
        id_pelayanan: service?.id_pelayanan ?? null,
      },
    });
  } catch (error) {
    redirectForError("/dashboard/pasien/booking-kunjungan/tambah", error);
  }
  redirect("/dashboard/pasien/booking-kunjungan/tersimpan");
}

export async function updateBookingAction(formData: FormData) {
  const identity = await requireRoleSession("pasien");
  const visitId = formText(formData, "visitId");
  const scheduleId = formText(formData, "Jadwal Baru");
  const serviceId = formText(formData, "Jenis Layanan");
  const dateValue = formText(formData, "Tanggal Kunjungan");
  const timeValue = formText(formData, "Waktu Kunjungan");
  const complaint = formText(formData, "Keluhan Awal");
  const date = validDate(dateValue)
    ? new Date(`${dateValue}T00:00:00.000Z`)
    : new Date(Number.NaN);
  const time = new Date(`1970-01-01T${timeValue}:00.000Z`);
  const isOtherService = serviceId === "__other__";
  if (
    !visitId ||
    !scheduleId ||
    !serviceId ||
    Number.isNaN(date.getTime()) ||
    date < new Date(clinicToday()) ||
    !/^\d{2}:\d{2}$/.test(timeValue) ||
    Number.isNaN(time.getTime()) ||
    !complaint ||
    complaint.length > 255
  ) {
    redirect("/dashboard/pasien/booking-kunjungan/ubah?error=invalid-data");
  }

  try {
    const visit = await prisma.kunjungan.findFirst({
      where: {
        id_kunjungan: visitId,
        id_pasien: identity.profileId,
        status_kunjungan: { in: ["Menunggu", "Dikonfirmasi"] },
      },
      select: { id_kunjungan: true, status_kunjungan: true },
    });
    const schedule = await prisma.jadwal_dokter.findUnique({
      where: { id_jadwal: scheduleId },
      select: {
        id_jadwal: true,
        hari: true,
        jam_mulai: true,
        jam_selesai: true,
        status_jadwal: true,
      },
    });
    const service = isOtherService
      ? null
      : await prisma.pelayanan.findUnique({
          where: { id_pelayanan: serviceId },
          select: { id_pelayanan: true },
        });
    if (!visit || !schedule || (!service && !isOtherService) || schedule.status_jadwal.trim().toLocaleLowerCase("id") !== "aktif") {
      redirect("/dashboard/pasien/booking-kunjungan/ubah?error=invalid-data");
    }

    const dayNames = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const requestedMinutes = time.getUTCHours() * 60 + time.getUTCMinutes();
    const startMinutes = schedule.jam_mulai.getUTCHours() * 60 + schedule.jam_mulai.getUTCMinutes();
    const endMinutes = schedule.jam_selesai.getUTCHours() * 60 + schedule.jam_selesai.getUTCMinutes();
    if (
      dayNames[date.getUTCDay()].toLocaleLowerCase("id") !==
        schedule.hari.trim().toLocaleLowerCase("id") ||
      requestedMinutes < startMinutes ||
      requestedMinutes >= endMinutes
    ) {
      redirect("/dashboard/pasien/booking-kunjungan/ubah?error=invalid-data");
    }

    const duplicate = await prisma.kunjungan.findFirst({
      where: {
        id_kunjungan: { not: visit.id_kunjungan },
        id_jadwal: schedule.id_jadwal,
        tanggal_kunjungan: date,
        waktu_kunjungan: time,
        status_kunjungan: { notIn: ["Dibatalkan", "Ditolak"] },
      },
      select: { id_kunjungan: true },
    });
    if (duplicate) {
      redirect(`/dashboard/pasien/booking-kunjungan/ubah?id=${encodeURIComponent(visit.id_kunjungan)}&error=slot-unavailable`);
    }

    const updated = await prisma.kunjungan.updateMany({
      where: {
        id_kunjungan: visit.id_kunjungan,
        id_pasien: identity.profileId,
        status_kunjungan: visit.status_kunjungan,
      },
      data: {
        id_jadwal: schedule.id_jadwal,
        id_pelayanan: service?.id_pelayanan ?? null,
        tanggal_kunjungan: date,
        waktu_kunjungan: time,
        keluhan_awal: complaint,
      },
    });
    if (!updated.count) redirect("/dashboard/pasien/booking-kunjungan/ubah?error=stale");
  } catch (error) {
    redirectForError("/dashboard/pasien/booking-kunjungan/ubah", error);
  }
  redirect("/dashboard/pasien/booking-kunjungan");
}

export async function cancelBookingAction(formData: FormData) {
  const identity = await requireRoleSession("pasien");
  const visitId = formText(formData, "visitId");
  if (!visitId) redirect("/dashboard/pasien/booking-kunjungan?error=invalid-data");

  try {
    const result = await prisma.kunjungan.updateMany({
      where: {
        id_kunjungan: visitId,
        id_pasien: identity.profileId,
        status_kunjungan: { in: ["Menunggu", "Dikonfirmasi"] },
      },
      data: { status_kunjungan: "Dibatalkan" },
    });
    if (!result.count) {
      redirect("/dashboard/pasien/booking-kunjungan?error=stale");
    }
  } catch (error) {
    redirectForError("/dashboard/pasien/booking-kunjungan", error);
  }
  redirect("/dashboard/pasien/booking-kunjungan/dibatalkan/selesai");
}

export async function confirmArrivalAction(formData: FormData) {
  const identity = await requireRoleSession("pasien");
  const visitId = formText(formData, "visitId");
  if (!visitId) redirect("/dashboard/pasien/konfirmasi-kedatangan");

  try {
    const result = await prisma.kunjungan.updateMany({
      where: {
        id_kunjungan: visitId,
        id_pasien: identity.profileId,
        status_kunjungan: "Menunggu",
      },
      data: { status_kunjungan: "Dikonfirmasi" },
    });
    if (!result.count) {
      redirect("/dashboard/pasien/konfirmasi-kedatangan?error=stale");
    }
  } catch (error) {
    redirectForError("/dashboard/pasien/konfirmasi-kedatangan", error);
  }
  redirect("/dashboard/pasien/konfirmasi-kedatangan/selesai");
}

export async function updateFeedbackAction(formData: FormData) {
  const identity = await requireRoleSession("owner");
  const feedbackId = formText(formData, "feedbackId");
  const status = formText(formData, "Status Tindak Lanjut");
  const note = formText(formData, "Catatan Tindak Lanjut");
  if (
    !feedbackId ||
    !["Menunggu", "Dalam Proses", "Belum ditindaklanjuti", "Selesai"].includes(status) ||
    note.length > 255
  ) {
    redirect("/dashboard/owner/informasi-operasional/kritik-pasien");
  }

  try {
    const result = await prisma.kritik_saran.updateMany({
      where: {
        id_kritik_saran: feedbackId,
        id_owner: identity.profileId,
      },
      data: {
        status_tindak_lanjut: status,
        catatan_tindak_lanjut: note || null,
      },
    });
    if (!result.count) {
      redirect("/dashboard/owner/informasi-operasional/kritik-pasien?error=stale");
    }
  } catch (error) {
    redirectForError(
      "/dashboard/owner/informasi-operasional/kritik-pasien",
      error,
    );
  }
  redirect("/dashboard/owner/informasi-operasional/kritik-pasien");
}

export async function savePortalFormAction(
  role: LoginRole,
  section: string,
  formData: FormData,
) {
  const identity = await requireRoleSession(role);

  if (role === "pasien" && section === "profil/edit") {
    const name = formText(formData, "Nama Pasien");
    const birthDateValue = formText(formData, "Tanggal Lahir");
    const address = formText(formData, "Alamat Jalan");
    const phone = formText(formData, "No. HP");
    const postalCode = formText(formData, "Kode Pos");
    const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
    if (!name || name.length > 100 || !validDate(birthDateValue) || birthDate > new Date(clinicToday()) || !address || address.length > 100 || !phone || phone.length > 15 || !postalCode || postalCode.length > 10) {
      redirect("/dashboard/pasien/profil/edit?error=invalid-data");
    }
    try {
      const updated = await prisma.pasien.updateMany({
        where: { id_pasien: identity.profileId },
        data: { nama_pasien: name, tanggal_lahir: birthDate, alamat_jalan: address, no_hp: phone, kode_pos: postalCode },
      });
      if (!updated.count) redirect("/dashboard/pasien/profil/edit?error=stale");
    } catch (error) {
      redirectForError("/dashboard/pasien/profil/edit", error);
    }
    redirect("/dashboard/pasien/profil");
  }

  if (role === "manajer-klinik" && section === "data-pasien/edit") {
    const patientId = formText(formData, "recordId");
    const name = formText(formData, "Nama Pasien");
    const birthDateValue = formText(formData, "Tanggal Lahir");
    const address = formText(formData, "Alamat Jalan");
    const phone = formText(formData, "No. HP");
    const postalCode = formText(formData, "Kode Pos");
    const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
    if (
      !patientId ||
      !name ||
      name.length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDateValue) ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate.toISOString().slice(0, 10) !== birthDateValue ||
      birthDate > new Date(clinicToday()) ||
      !address ||
      address.length > 100 ||
      !phone ||
      phone.length > 15 ||
      !postalCode
    ) {
      redirect("/dashboard/manajer-klinik/data-pasien/edit?error=invalid-data");
    }

    try {
      const updated = await prisma.pasien.updateMany({
        where: { id_pasien: patientId },
        data: {
          nama_pasien: name,
          tanggal_lahir: birthDate,
          alamat_jalan: address,
          no_hp: phone,
          kode_pos: postalCode,
        },
      });
      if (!updated.count) {
        redirect("/dashboard/manajer-klinik/data-pasien/edit?error=stale");
      }
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/data-pasien/edit", error);
    }
    redirect("/dashboard/manajer-klinik/data-pasien");
  }

  if (role === "manajer-klinik" && section === "data-dokter/edit") {
    const doctorId = formText(formData, "recordId");
    const name = formText(formData, "Nama Dokter");
    const phone = formText(formData, "No. HP");
    const specialty = formText(formData, "Spesialisasi");
    if (
      !doctorId ||
      !name ||
      name.length > 100 ||
      !phone ||
      phone.length > 15 ||
      !specialty ||
      specialty.length > 50
    ) {
      redirect("/dashboard/manajer-klinik/data-dokter/edit?error=invalid-data");
    }

    try {
      const updated = await prisma.dokter.updateMany({
        where: { id_dokter: doctorId },
        data: { nama: name, no_hp: phone, spesialis: specialty },
      });
      if (!updated.count) {
        redirect("/dashboard/manajer-klinik/data-dokter/edit?error=stale");
      }
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/data-dokter/edit", error);
    }
    redirect("/dashboard/manajer-klinik/data-dokter");
  }

  if (role === "manajer-klinik" && section === "jadwal-dokter/edit") {
    const scheduleId = formText(formData, "recordId");
    const doctorId = formText(formData, "Dokter");
    const weekday = formText(formData, "Hari");
    const startValue = formText(formData, "Jam Mulai");
    const endValue = formText(formData, "Jam Selesai");
    const status = formText(formData, "Status Jadwal");
    const startTime = new Date(`1970-01-01T${startValue}:00.000Z`);
    const endTime = new Date(`1970-01-01T${endValue}:00.000Z`);
    if (
      !scheduleId ||
      !doctorId ||
      !["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].includes(weekday) ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime >= endTime ||
      !status ||
      status.length > 20
    ) {
      redirect("/dashboard/manajer-klinik/jadwal-dokter/edit?error=invalid-data");
    }

    try {
      const conflict =
        status.toLocaleLowerCase("id") === "aktif"
          ? await prisma.jadwal_dokter.findFirst({
              where: {
                id_jadwal: { not: scheduleId },
                id_dokter: doctorId,
                hari: { equals: weekday, mode: "insensitive" },
                status_jadwal: { equals: "Aktif", mode: "insensitive" },
                jam_mulai: { lt: endTime },
                jam_selesai: { gt: startTime },
              },
              select: { id_jadwal: true },
            })
          : null;
      if (conflict) {
        redirect("/dashboard/manajer-klinik/jadwal-dokter/tambah/bentrok");
      }
      const updated = await prisma.jadwal_dokter.updateMany({
        where: { id_jadwal: scheduleId },
        data: {
          id_dokter: doctorId,
          hari: weekday,
          jam_mulai: startTime,
          jam_selesai: endTime,
          status_jadwal: status,
        },
      });
      if (!updated.count) {
        redirect("/dashboard/manajer-klinik/jadwal-dokter/edit?error=stale");
      }
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/jadwal-dokter/edit", error);
    }
    redirect("/dashboard/manajer-klinik/jadwal-dokter");
  }

  if (role === "manajer-klinik" && section === "data-pasien/tambah") {
    const patientId = formText(formData, "ID Pasien");
    const name = formText(formData, "Nama Pasien");
    const birthDateValue = formText(formData, "Tanggal Lahir");
    const address = formText(formData, "Alamat Jalan");
    const phone = formText(formData, "No. HP");
    const postalCode = formText(formData, "Kode Pos");
    const username = formText(formData, "Username");
    const password = formText(formData, "Password");
    const birthDate = new Date(`${birthDateValue}T00:00:00.000Z`);
    if (
      !patientId ||
      patientId.length > 10 ||
      !name ||
      name.length > 100 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDateValue) ||
      Number.isNaN(birthDate.getTime()) ||
      birthDate.toISOString().slice(0, 10) !== birthDateValue ||
      birthDate > new Date(clinicToday()) ||
      !address ||
      address.length > 100 ||
      !phone ||
      phone.length > 15 ||
      !postalCode ||
      !username ||
      username.length > 50 ||
      password.length < 8 ||
      password.length > 128
    ) {
      redirect("/dashboard/manajer-klinik/data-pasien/tambah?error=invalid-data");
    }

    const storedPassword = await hashPasswordForStorage(password);
    try {
      await prisma.$transaction(async (transaction) => {
        await transaction.pasien.create({
          data: {
            id_pasien: patientId,
            nama_pasien: name,
            tanggal_lahir: birthDate,
            alamat_jalan: address,
            no_hp: phone,
            kode_pos: postalCode,
            username,
            password: storedPassword,
          },
        });
        await transaction.akun_pengguna.create({
          data: {
            id_akun: newId("A"),
            username,
            password: storedPassword,
            status_akun: "Aktif",
            id_pasien: patientId,
          },
        });
      });
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/data-pasien/tambah", error);
    }
    redirect("/dashboard/manajer-klinik/data-pasien");
  }

  if (role === "manajer-klinik" && section === "data-dokter/tambah") {
    const doctorId = formText(formData, "ID Dokter");
    const name = formText(formData, "Nama Dokter");
    const phone = formText(formData, "No. HP");
    const specialty = formText(formData, "Spesialisasi");
    const username = formText(formData, "Username");
    const password = formText(formData, "Password");
    if (
      !doctorId ||
      doctorId.length > 10 ||
      !name ||
      name.length > 100 ||
      !phone ||
      phone.length > 15 ||
      !specialty ||
      specialty.length > 50 ||
      !username ||
      username.length > 50 ||
      password.length < 8 ||
      password.length > 128
    ) {
      redirect("/dashboard/manajer-klinik/data-dokter/tambah?error=invalid-data");
    }

    const storedPassword = await hashPasswordForStorage(password);
    try {
      await prisma.$transaction(async (transaction) => {
        await transaction.dokter.create({
          data: {
            id_dokter: doctorId,
            nama: name,
            no_hp: phone,
            spesialis: specialty,
          },
        });
        await transaction.akun_pengguna.create({
          data: {
            id_akun: newId("A"),
            username,
            password: storedPassword,
            status_akun: "Aktif",
            id_dokter: doctorId,
          },
        });
      });
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/data-dokter/tambah", error);
    }
    redirect("/dashboard/manajer-klinik/data-dokter");
  }

  if (role === "manajer-klinik" && section === "jadwal-dokter/tambah") {
    const doctorId = formText(formData, "Dokter");
    const weekday = formText(formData, "Hari");
    const startValue = formText(formData, "Jam Mulai");
    const endValue = formText(formData, "Jam Selesai");
    const status = formText(formData, "Status Jadwal") || "Aktif";
    const startTime = new Date(`1970-01-01T${startValue}:00.000Z`);
    const endTime = new Date(`1970-01-01T${endValue}:00.000Z`);
    if (
      !doctorId ||
      !weekday ||
      !["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].includes(weekday) ||
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime >= endTime ||
      status.length > 20
    ) {
      redirect("/dashboard/manajer-klinik/jadwal-dokter/tambah?error=invalid-data");
    }

    try {
      if (status.toLocaleLowerCase("id") === "aktif") {
        const conflict = await prisma.jadwal_dokter.findFirst({
          where: {
            id_dokter: doctorId,
            hari: { equals: weekday, mode: "insensitive" },
            status_jadwal: { equals: "Aktif", mode: "insensitive" },
            jam_mulai: { lt: endTime },
            jam_selesai: { gt: startTime },
          },
          select: { id_jadwal: true },
        });
        if (conflict) {
          redirect("/dashboard/manajer-klinik/jadwal-dokter/tambah/bentrok");
        }
      }
      await prisma.jadwal_dokter.create({
        data: {
          id_jadwal: newId("J"),
          hari: weekday,
          jam_mulai: startTime,
          jam_selesai: endTime,
          status_jadwal: status,
          id_dokter: doctorId,
        },
      });
    } catch (error) {
      redirectForError("/dashboard/manajer-klinik/jadwal-dokter/tambah", error);
    }
    redirect("/dashboard/manajer-klinik/jadwal-dokter");
  }

  if (role === "dokter" && section === "rekam-medis/tambah") {
    const visitId = formText(formData, "visitId");
    const nurseId = formText(formData, "Perawat");
    const complaint = formText(formData, "Keluhan");
    const result = formText(formData, "Hasil Pemeriksaan");
    const examNote = formText(formData, "Catatan Pemeriksaan");
    const treatmentIds = formData.getAll("Tindakan").filter((v): v is string => typeof v === "string" && !!v);
    const diagnosis = formText(formData, "Diagnosis");
    const recordNote = formText(formData, "Catatan");
    if (
      !visitId ||
      !nurseId ||
      !complaint ||
      !result ||
      !diagnosis ||
      complaint.length > 255 ||
      result.length > 255 ||
      examNote.length > 255 ||
      diagnosis.length > 255 ||
      recordNote.length > 255
    ) {
      redirect("/dashboard/dokter/kunjungan-pasien?error=invalid-data");
    }

    try {
      await prisma.$transaction(async (transaction) => {
        const visit = await transaction.kunjungan.findFirst({
          where: {
            id_kunjungan: visitId,
            status_kunjungan: "Pemeriksaan",
            jadwal_dokter: { is: { id_dokter: identity.profileId } },
            pemeriksaan: { none: {} },
          },
          select: { id_kunjungan: true, id_pasien: true },
        });
        if (!visit) throw new Error("VISIT_NOT_ASSIGNED");
        const services = await transaction.pelayanan.findMany({ where: { id_pelayanan: { in: treatmentIds } } });
        if (!services.length || services.length !== new Set(treatmentIds).size) throw new Error("VISIT_NOT_ASSIGNED");
        const manager = await transaction.manajer_klinik.findFirst({ orderBy: { id_manajer: "asc" }, select: { id_manajer: true } });
        if (!manager) throw new Error("VISIT_NOT_ASSIGNED");

        const examId = newId("E");
        const recordId = newId("R");
        const today = new Date(clinicToday());
        await transaction.pemeriksaan.create({
          data: {
            id_pemeriksaan: examId,
            tanggal_pemeriksaan: today,
            keluhan: complaint,
            hasil_pemeriksaan: result,
            catatan_pemeriksaan: examNote || null,
            id_kunjungan: visit.id_kunjungan,
            id_dokter: identity.profileId,
            id_perawat: nurseId,
          },
        });
        await transaction.tindakan.createMany({ data: services.map((service) => ({
          id_tindakan: newId("T"), nama_tindakan: service.nama_pelayanan,
          deskripsi_tindakan: service.deskripsi, biaya: service.biaya, id_pemeriksaan: examId,
        })) });
        await transaction.pembayaran.create({ data: {
          id_pembayaran: newId("B"), id_pasien: visit.id_pasien, id_kunjungan: visit.id_kunjungan,
          id_manajer: manager.id_manajer, jumlah_pembayaran: services.reduce((total, service) => total.plus(service.biaya), new Prisma.Decimal(0)),
          metode_pembayaran: "Belum dipilih", tanggal_pembayaran: today, status_pembayaran: 0,
        } });
        await transaction.rekam_medis.create({
          data: {
            id_rekam_medis: recordId,
            tanggal_rekam_medis: today,
            diagnosis,
            catatan: recordNote || null,
            status_validasi: "Menunggu",
            id_pemeriksaan: examId,
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "VISIT_NOT_ASSIGNED") {
        redirect("/dashboard/dokter/kunjungan-pasien?error=invalid-data");
      }
      redirectForError("/dashboard/dokter/kunjungan-pasien", error);
    }
    redirect("/dashboard/dokter/rekam-medis");
  }

  if (role === "dokter" && section === "resep/tambah") {
    const recordId = formText(formData, "Rekam Medis");
    const prescriptionNumber = formText(formData, "Nomor Resep");
    const dateValue = formText(formData, "Tanggal Resep");
    const content = formText(formData, "Isi Resep");
    const prescriptionDate = new Date(`${dateValue}T00:00:00.000Z`);
    if (
      !recordId ||
      !prescriptionNumber ||
      prescriptionNumber.length > 20 ||
      Number.isNaN(prescriptionDate.getTime()) ||
      !content ||
      content.length > 255
    ) {
      redirect("/dashboard/dokter/resep/tambah?error=invalid-data");
    }

    try {
      await prisma.$transaction(async (transaction) => {
        const record = await transaction.rekam_medis.findFirst({
          where: {
            id_rekam_medis: recordId,
            pemeriksaan: { is: { id_dokter: identity.profileId } },
          },
          select: { id_rekam_medis: true },
        });
        if (!record) throw new Error("MEDICAL_RECORD_NOT_ASSIGNED");

        await transaction.resep.create({
          data: {
            id_resep: newId("RX"),
            no_resep: prescriptionNumber,
            tanggal_resep: prescriptionDate,
            isi_resep: content,
            id_rekam_medis: record.id_rekam_medis,
          },
        });
      });
    } catch (error) {
      if (error instanceof Error && error.message === "MEDICAL_RECORD_NOT_ASSIGNED") {
        redirect("/dashboard/dokter/resep/tambah?error=invalid-data");
      }
      redirectForError("/dashboard/dokter/resep/tambah", error);
    }
    redirect("/dashboard/dokter/resep");
  }

  if (
    role === "perawat" &&
    ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(section)
  ) {
    const visitId = formText(formData, "visitId");
    const currentStatus = formText(formData, "Status Saat Ini");
    const newStatus = formText(formData, "Status Baru");
    const allowedTransitions = visitTransitions;
    if (
      !visitId ||
      !currentStatus ||
      !allowedTransitions[currentStatus]?.includes(newStatus)
    ) {
      redirect("/dashboard/perawat/status-kunjungan?error=invalid-data");
    }
    try {
      const updated = await prisma.kunjungan.updateMany({
        where: {
          id_kunjungan: visitId,
          status_kunjungan: currentStatus,
          ...(newStatus === "Selesai" ? { pemeriksaan: { some: {} } } : {}),
        },
        data: { status_kunjungan: newStatus },
      });
      if (!updated.count) {
        redirect("/dashboard/perawat/status-kunjungan?error=stale");
      }
    } catch (error) {
      redirectForError("/dashboard/perawat/status-kunjungan", error);
    }
    redirect("/dashboard/perawat/status-kunjungan");
  }

  redirect(`${portalHref(role, section)}?error=unsupported`);
}

export async function deletePortalRecordAction(formData: FormData) {
  await requireRoleSession("manajer-klinik");
  const section = formText(formData, "section");
  const recordId = formText(formData, "recordId");
  const listSection = section.split("/")[0];
  if (
    !recordId ||
    !["data-pasien/hapus", "data-dokter/hapus", "jadwal-dokter/hapus"].includes(section)
  ) {
    redirect("/dashboard/manajer-klinik?error=invalid-data");
  }

  const unavailablePath = {
    "data-pasien/hapus": "/dashboard/manajer-klinik/data-pasien/hapus/tidak-dapat",
    "data-dokter/hapus": "/dashboard/manajer-klinik/data-dokter/hapus/tidak-dapat",
    "jadwal-dokter/hapus": "/dashboard/manajer-klinik/jadwal-dokter/hapus/tidak-dapat",
  }[section];
  if (!unavailablePath) {
    redirect("/dashboard/manajer-klinik?error=invalid-data");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      if (section === "data-pasien/hapus") {
        const accounts = await transaction.akun_pengguna.findMany({
          where: { id_pasien: recordId },
          select: { id_akun: true },
        });
        const accountIds = accounts.map((account) => account.id_akun);
        const [visitCount, paymentCount, feedbackCount, menuCount] = await Promise.all([
          transaction.kunjungan.count({ where: { id_pasien: recordId } }),
          transaction.pembayaran.count({ where: { id_pasien: recordId } }),
          transaction.kritik_saran.count({ where: { id_pasien: recordId } }),
          accountIds.length
            ? transaction.tampilan_menu.count({ where: { id_akun: { in: accountIds } } })
            : Promise.resolve(0),
        ]);
        if (visitCount || paymentCount || feedbackCount || menuCount) {
          throw new Error("PORTAL_RECORD_IN_USE");
        }
        await transaction.akun_pengguna.deleteMany({
          where: { id_pasien: recordId },
        });
        await transaction.pasien.delete({ where: { id_pasien: recordId } });
        return;
      }

      if (section === "data-dokter/hapus") {
        const accounts = await transaction.akun_pengguna.findMany({
          where: { id_dokter: recordId },
          select: { id_akun: true },
        });
        const accountIds = accounts.map((account) => account.id_akun);
        const [scheduleCount, examCount, menuCount] = await Promise.all([
          transaction.jadwal_dokter.count({ where: { id_dokter: recordId } }),
          transaction.pemeriksaan.count({ where: { id_dokter: recordId } }),
          accountIds.length
            ? transaction.tampilan_menu.count({ where: { id_akun: { in: accountIds } } })
            : Promise.resolve(0),
        ]);
        if (scheduleCount || examCount || menuCount) {
          throw new Error("PORTAL_RECORD_IN_USE");
        }
        await transaction.akun_pengguna.deleteMany({
          where: { id_dokter: recordId },
        });
        await transaction.dokter.delete({ where: { id_dokter: recordId } });
        return;
      }

      const visitCount = await transaction.kunjungan.count({
        where: { id_jadwal: recordId },
      });
      if (visitCount) throw new Error("PORTAL_RECORD_IN_USE");
      await transaction.jadwal_dokter.delete({
        where: { id_jadwal: recordId },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PORTAL_RECORD_IN_USE") {
      redirect(unavailablePath);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      redirect(unavailablePath);
    }
    redirectForError(`/dashboard/manajer-klinik/${listSection}`, error);
  }

  redirect(`/dashboard/manajer-klinik/${listSection}`);
}
