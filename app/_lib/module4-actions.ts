"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";
import { requireRoleSession, type LoginRole } from "./auth";
import { prisma } from "./prisma";
import { clinicToday, validDate } from "./workflow";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const newId = (prefix: string) => prefix + randomUUID().replaceAll("-", "").slice(0, 10 - prefix.length);

export async function saveCatalogAction(section: string, form: FormData) {
  await requireRoleSession("manajer-klinik");
  const [kind, operation] = section.split("/");
  if (!["informasi-klinik", "data-pelayanan"].includes(kind) || !["tambah", "edit"].includes(operation)) redirect("/dashboard/manajer-klinik");
  const id = value(form, "recordId");
  const destination = `/dashboard/manajer-klinik/${section}${id ? `?id=${encodeURIComponent(id)}&` : "?"}`;
  const title = value(form, kind === "informasi-klinik" ? "Judul" : "Nama Pelayanan");
  const content = value(form, kind === "informasi-klinik" ? "Isi Informasi" : "Deskripsi");
  if (!title || title.length > 100 || !content || content.length > (kind === "informasi-klinik" ? 10000 : 255) || (operation === "edit" && !id)) redirect(`${destination}error=invalid-data`);
  try {
    if (kind === "informasi-klinik") {
      const date = value(form, "Tanggal Publikasi");
      if (!validDate(date)) redirect(`${destination}error=invalid-data`);
      const data = { judul: title, isi_informasi: content, tanggal_publikasi: new Date(date) };
      if (operation === "edit") await prisma.informasi_klinik.update({ where: { id_informasi: id }, data });
      else await prisma.informasi_klinik.create({ data: { id_informasi: newId("I"), ...data } });
    } else {
      const cost = value(form, "Biaya");
      if (!/^\d{1,10}(\.\d{1,2})?$/.test(cost)) redirect(`${destination}error=invalid-data`);
      const data = { nama_pelayanan: title, deskripsi: content, biaya: new Prisma.Decimal(cost) };
      if (operation === "edit") await prisma.pelayanan.update({ where: { id_pelayanan: id }, data });
      else await prisma.pelayanan.create({ data: { id_pelayanan: newId("L"), ...data } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) redirect(`${destination}error=invalid-data`);
    throw e;
  }
  revalidatePath("/"); revalidatePath("/informasi-klinik");
  redirect(`/dashboard/manajer-klinik/${kind}`);
}

export async function deleteWorkflowAction(role: LoginRole, section: string, form: FormData) {
  const identity = await requireRoleSession(role);
  const id = value(form, "recordId");
  const destination = `/dashboard/${role}/${section.split("/")[0]}`;
  if (!id || !section.endsWith("/hapus")) redirect(`${destination}?error=invalid-data`);
  try {
    await prisma.$transaction(async (tx) => {
      if (role === "manajer-klinik" && section === "informasi-klinik/hapus") {
        await tx.informasi_klinik.delete({ where: { id_informasi: id } });
      } else if (role === "manajer-klinik" && section === "data-pelayanan/hapus") {
        await tx.pelayanan.delete({ where: { id_pelayanan: id } });
      } else if (role === "pasien" && section === "booking-kunjungan/hapus") {
        const result = await tx.kunjungan.deleteMany({ where: { id_kunjungan: id, id_pasien: identity.profileId, status_kunjungan: { in: ["Menunggu", "Dibatalkan"] }, pemeriksaan: { none: {} }, pembayaran: { none: {} } } });
        if (!result.count) throw new Error("NOT_ALLOWED");
      } else if (role === "dokter" && section === "resep/hapus") {
        const result = await tx.resep.deleteMany({ where: { id_resep: id, rekam_medis: { pemeriksaan: { id_dokter: identity.profileId } } } });
        if (!result.count) throw new Error("NOT_ALLOWED");
      } else if (role === "dokter" && section === "rekam-medis/hapus") {
        const result = await tx.rekam_medis.deleteMany({ where: { id_rekam_medis: id, pemeriksaan: { id_dokter: identity.profileId }, resep: { none: {} }, status_validasi: { not: "Valid" } } });
        if (!result.count) throw new Error("NOT_ALLOWED");
      } else if (role === "perawat" && section === "status-kunjungan/hapus") {
        // Menghapus status awal mengembalikan kunjungan ke Menunggu; bukan menghapus kunjungannya.
        const result = await tx.kunjungan.updateMany({ where: { id_kunjungan: id, status_kunjungan: "Dikonfirmasi", pemeriksaan: { none: {} } }, data: { status_kunjungan: "Menunggu" } });
        if (!result.count) throw new Error("NOT_ALLOWED");
      } else throw new Error("NOT_ALLOWED");
    });
  } catch (e) {
    if ((e instanceof Error && e.message === "NOT_ALLOWED") || e instanceof Prisma.PrismaClientKnownRequestError) redirect(`${destination}?error=in-use`);
    throw e;
  }
  revalidatePath("/"); revalidatePath("/informasi-klinik");
  redirect(destination);
}

export async function updateClinicalAction(section: string, form: FormData) {
  const identity = await requireRoleSession("dokter");
  const id = value(form, "recordId");
  const destination = `/dashboard/dokter/${section.split("/")[0]}`;
  if (!id) redirect(`${destination}?error=invalid-data`);
  if (section === "resep/edit") {
    const content = value(form, "Isi Resep");
    const number = value(form, "Nomor Resep");
    const date = value(form, "Tanggal Resep");
    if (!content || content.length > 255 || !number || number.length > 20 || !validDate(date)) redirect(`${destination}?error=invalid-data`);
    try {
      const result = await prisma.resep.updateMany({ where: { id_resep: id, rekam_medis: { pemeriksaan: { id_dokter: identity.profileId } } }, data: { isi_resep: content, no_resep: number, tanggal_resep: new Date(date) } });
      if (!result.count) redirect(`${destination}?error=invalid-data`);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) redirect(`${destination}?error=duplicate`);
      throw e;
    }
  } else if (section === "rekam-medis/edit") {
    const diagnosis = value(form, "Diagnosis");
    const note = value(form, "Catatan");
    if (!diagnosis || diagnosis.length > 255 || note.length > 255) redirect(`${destination}?error=invalid-data`);
    const result = await prisma.rekam_medis.updateMany({ where: { id_rekam_medis: id, pemeriksaan: { id_dokter: identity.profileId } }, data: { diagnosis, catatan: note || null } });
    if (!result.count) redirect(`${destination}?error=invalid-data`);
  } else redirect(`${destination}?error=invalid-data`);
  redirect(`${destination}/detail?id=${encodeURIComponent(id)}`);
}

export async function submitPaymentAction(form: FormData) {
  const identity = await requireRoleSession("pasien");
  const id = value(form, "recordId");
  const method = value(form, "Metode Pembayaran");
  const file = form.get("Bukti Pembayaran");
  const destination = `/dashboard/pasien/pembayaran/transfer?id=${encodeURIComponent(id)}`;
  if (!["Tunai", "Transfer"].includes(method)) redirect(`${destination}&error=invalid-data`);
  let bytes: Uint8Array<ArrayBuffer> | undefined;
  if (method === "Transfer") {
    if (!(file instanceof File) || file.size === 0 || file.size > 3 * 1024 * 1024 || !["image/png", "image/jpeg", "application/pdf"].includes(file.type)) redirect(`${destination}&error=file`);
    bytes = new Uint8Array(await file.arrayBuffer());
    const valid = file.type === "application/pdf" ? Buffer.from(bytes.slice(0, 5)).toString() === "%PDF-" : file.type === "image/png" ? Buffer.from(bytes.slice(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    if (!valid) redirect(`${destination}&error=file`);
  }
  let changed = false;
  await prisma.$transaction(async (tx) => {
    const result = await tx.pembayaran.updateMany({ where: { id_pembayaran: id, id_pasien: identity.profileId, status_pembayaran: { in: [0,3] } }, data: { metode_pembayaran: method, status_pembayaran: 2, tanggal_pembayaran: new Date(clinicToday()) } });
    if (!result.count) return;
    if (bytes && file instanceof File) {
      const data = { nama_file: file.name.slice(0,255), tipe_file: file.type, isi_file: bytes, tanggal_unggah: new Date() };
      await tx.bukti_pembayaran.upsert({ where: { id_pembayaran: id }, create: { id_pembayaran: id, ...data }, update: data });
    } else await tx.bukti_pembayaran.deleteMany({ where: { id_pembayaran: id } });
    changed = true;
  });
  if (!changed) redirect(`${destination}&error=stale`);
  redirect("/dashboard/pasien/pembayaran");
}

export async function verifyPaymentAction(form: FormData) {
  const identity = await requireRoleSession("manajer-klinik");
  const id = value(form, "recordId");
  const decision = value(form, "decision");
  if (!["approve", "reject"].includes(decision)) redirect("/dashboard/manajer-klinik/pembayaran?error=invalid-data");
  const result = await prisma.pembayaran.updateMany({ where: { id_pembayaran: id, status_pembayaran: 2 }, data: { status_pembayaran: decision === "approve" ? 1 : 3, id_manajer: identity.profileId } });
  if (!result.count) redirect("/dashboard/manajer-klinik/pembayaran?error=stale");
  redirect(`/dashboard/manajer-klinik/pembayaran/${decision === "approve" ? "lunas" : "ditolak"}`);
}
