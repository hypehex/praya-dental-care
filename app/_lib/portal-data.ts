import "server-only";
import type { PortalRole, PortalScreen } from "./portal-config";
import { portalHref } from "./portal-config";
import type { UserSession } from "./auth";
import { prisma } from "./prisma";
import {
  clinicToday,
  formatTime24,
  paymentStatuses,
  visitTransitions,
} from "./workflow";

export type PortalRow = {
  id: string;
  cells: string[];
  values?: Record<string, string>;
  detailHref?: string;
  patientDashboard?: PatientDashboardData;
};

export type PatientDashboardData = {
  activeBookingCount: number;
  pendingPaymentCount: number;
  completedVisitCount: number;
  nextVisit: {
    id: string;
    doctor: string;
    service: string;
    date: string;
    time: string;
    status: string;
  } | null;
  doctorSchedules: {
    id: string;
    doctor: string;
    specialty: string;
    day: string;
    start: string;
    end: string;
  }[];
  paymentReminder: {
    id: string;
    amount: number;
    status: number;
  } | null;
};

export type PortalFormOption = {
  value: string;
  label: string;
  doctorId?: string;
  day?: string;
  startTime?: string;
  endTime?: string;
};

const dateLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);

const timeLabel = formatTime24;

const dateTimeLabel = (date: Date) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(date);

const timeValue = (date: Date) =>
  `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}`;

function row(
  role: PortalRole,
  screen: PortalScreen,
  id: string,
  cells: string[],
): PortalRow {
  const detailSection = screen.section.startsWith("pengajuan-registrasi") ? "pengajuan-registrasi/detail" : role.slug === "owner" && screen.section === "informasi-operasional/kritik-pasien" ? "informasi-operasional/kritik-pasien/detail" : screen.parent === "pembayaran" && role.slug === "manajer-klinik" ? "pembayaran/verifikasi" : screen.kind === "detail"
    ? screen.section
    : screen.kind === "form"
      ? screen.section
      : `${screen.parent}/detail`;
  return {
    id,
    cells,
    detailHref: `${portalHref(role.slug, detailSection)}?id=${encodeURIComponent(id)}`,
  };
}

export async function loadPortalRows(
  role: PortalRole,
  screen: PortalScreen,
  identity: UserSession,
  recordId?: string,
  filters: { from?: string; to?: string; category?: string } = {},
): Promise<PortalRow[]> {
  const section = screen.section;
  const parent = screen.parent;

  if (role.slug === "pasien" && screen.kind === "dashboard") {
    const today = new Date(`${clinicToday()}T00:00:00.000Z`);
    const activeVisitWhere = {
      id_pasien: identity.profileId,
      tanggal_kunjungan: { gte: today },
      status_kunjungan: { in: ["Menunggu", "Dikonfirmasi", "Pemeriksaan"] },
    };
    const outstandingPaymentWhere = {
      id_pasien: identity.profileId,
      status_pembayaran: { in: [0, 2, 3] },
    };
    const [
      activeBookingCount,
      completedVisitCount,
      nextVisit,
      schedules,
      outstandingPayments,
      pendingPaymentCount,
    ] = await Promise.all([
      prisma.kunjungan.count({ where: activeVisitWhere }),
      prisma.kunjungan.count({
        where: { id_pasien: identity.profileId, status_kunjungan: "Selesai" },
      }),
      prisma.kunjungan.findFirst({
        where: activeVisitWhere,
        select: {
          id_kunjungan: true,
          tanggal_kunjungan: true,
          waktu_kunjungan: true,
          status_kunjungan: true,
          pelayanan: { select: { nama_pelayanan: true } },
          jadwal_dokter: {
            select: { dokter: { select: { nama: true } } },
          },
        },
        orderBy: [{ tanggal_kunjungan: "asc" }, { waktu_kunjungan: "asc" }],
      }),
      prisma.jadwal_dokter.findMany({
        where: {
          status_jadwal: { equals: "Aktif", mode: "insensitive" },
        },
        select: {
          id_jadwal: true,
          hari: true,
          jam_mulai: true,
          jam_selesai: true,
          dokter: { select: { nama: true, spesialis: true } },
        },
        orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
        take: 3,
      }),
      prisma.pembayaran.findMany({
        where: outstandingPaymentWhere,
        select: {
          id_pembayaran: true,
          jumlah_pembayaran: true,
          status_pembayaran: true,
        },
        orderBy: { tanggal_pembayaran: "desc" },
        take: 1,
      }),
      prisma.pembayaran.count({ where: outstandingPaymentWhere }),
    ]);

    return [{
      id: "patient-dashboard",
      cells: [],
      patientDashboard: {
        activeBookingCount,
        pendingPaymentCount,
        completedVisitCount,
        nextVisit: nextVisit
          ? {
              id: nextVisit.id_kunjungan,
              doctor: nextVisit.jadwal_dokter.dokter.nama,
              service: nextVisit.pelayanan?.nama_pelayanan ?? "Layanan belum dipilih",
              date: dateLabel(nextVisit.tanggal_kunjungan),
              time: timeLabel(nextVisit.waktu_kunjungan),
              status: nextVisit.status_kunjungan,
            }
          : null,
        doctorSchedules: schedules.map((schedule) => ({
          id: schedule.id_jadwal,
          doctor: schedule.dokter.nama,
          specialty: schedule.dokter.spesialis,
          day: schedule.hari,
          start: timeLabel(schedule.jam_mulai),
          end: timeLabel(schedule.jam_selesai),
        })),
        paymentReminder: outstandingPayments[0]
          ? {
              id: outstandingPayments[0].id_pembayaran,
              amount: Number(outstandingPayments[0].jumlah_pembayaran),
              status: outstandingPayments[0].status_pembayaran,
            }
          : null,
      },
    }];
  }

  if (
    (screen.kind === "detail" || screen.kind === "confirmation") &&
    !recordId
  ) {
    return [];
  }
  if (
    screen.kind === "status" ||
    screen.kind === "review" ||
    (screen.kind === "form" && !recordId)
  ) {
    return [];
  }

  if (
    role.slug === "dokter" &&
    section === "rekam-medis/tambah" &&
    recordId
  ) {
    const visit = await prisma.kunjungan.findFirst({
      where: {
        id_kunjungan: recordId,
        status_kunjungan: "Pemeriksaan",
        jadwal_dokter: { is: { id_dokter: identity.profileId } },
        pemeriksaan: { none: {} },
      },
      select: {
        id_kunjungan: true,
        keluhan_awal: true,
        id_pelayanan: true,
        pelayanan: { select: { nama_pelayanan: true } },
        pasien: { select: { nama_pasien: true } },
      },
    });
    return visit
      ? [
          {
            ...row(role, screen, visit.id_kunjungan, [
              visit.pasien.nama_pasien,
              visit.pelayanan?.nama_pelayanan ?? "-",
              visit.keluhan_awal,
            ]),
            values: {
              Keluhan: visit.keluhan_awal,
              Tindakan: visit.id_pelayanan ?? "",
              "Nama Pasien": visit.pasien.nama_pasien,
            },
          },
        ]
      : [];
  }

  if (
    role.slug === "owner" &&
    [
      "rekap-pelayanan",
      "rekap-pelayanan/hasil",
      "laporan-klinik",
      "laporan-klinik/hasil",
    ].includes(section)
  ) {
    const dateRange = { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(filters.to) } : {}) };
    const [visitCount, examCount, recordCount, prescriptionCount, paymentCount] =
      await Promise.all([
        prisma.kunjungan.count({ where: { tanggal_kunjungan: dateRange } }),
        prisma.pemeriksaan.count({ where: { tanggal_pemeriksaan: dateRange } }),
        prisma.rekam_medis.count({ where: { tanggal_rekam_medis: dateRange } }),
        prisma.resep.count({ where: { tanggal_resep: dateRange } }),
        prisma.pembayaran.count({ where: { tanggal_pembayaran: dateRange } }),
      ]);
    const values = [
      ["Kunjungan", String(visitCount)],
      ["Pemeriksaan", String(examCount)],
      ["Rekam Medis", String(recordCount)],
      ["Resep", String(prescriptionCount)],
      ["Pembayaran", String(paymentCount)],
    ];
    return values.filter(([label]) => !filters.category || filters.category === "Semua" || filters.category === label).map(([label, count]) =>
      row(role, screen, `summary-${label.toLowerCase().replaceAll(" ", "-")}`, [
        label,
        `${filters.from || "Awal"} s.d. ${filters.to || "Terakhir"}`,
        `${count} record`,
      ]),
    );
  }

  if (role.slug === "owner" && section === "informasi-operasional") {
    const feedbackCount = await prisma.kritik_saran.count({
      where: { id_owner: identity.profileId },
    });
    return [
      {
        id: "feedback-summary",
        cells: [
          "Kritik dan Saran",
          `${feedbackCount} masukan`,
          "Tinjau masukan pasien",
        ],
        detailHref: portalHref(role.slug, "informasi-operasional/kritik-pasien"),
      },
    ];
  }

  if (parent === "data-pasien" && section.startsWith("pengajuan-registrasi")) {
    const accounts = await prisma.akun_pengguna.findMany({
      where: {
        status_akun: "Menunggu",
        id_pasien: { not: null },
        ...(recordId ? { id_akun: recordId } : {}),
      },
      select: {
        id_akun: true,
        username: true,
        tanggal_pengajuan: true,
        pasien: {
          select: {
            id_pasien: true,
            nama_pasien: true,
            no_hp: true,
            tanggal_lahir: true,
            alamat_jalan: true,
            kode_pos: true,
          },
        },
      },
      orderBy: { id_akun: "asc" },
    });
    return accounts.map((account) => ({
      ...row(role, screen, account.id_akun, [
        account.pasien?.nama_pasien ?? account.username,
        account.tanggal_pengajuan ? dateLabel(account.tanggal_pengajuan) : "Tidak tercatat",
        "Menunggu",
      ]),
      values: {
        "Nama Pasien": account.pasien?.nama_pasien ?? account.username,
        "ID Pasien": account.pasien?.id_pasien ?? "-",
        "Tanggal Lahir": account.pasien
          ? dateLabel(account.pasien.tanggal_lahir)
          : "-",
        "Nomor Telepon": account.pasien?.no_hp ?? "-",
        Alamat: account.pasien?.alamat_jalan ?? "-",
        "Kode Pos": account.pasien?.kode_pos ?? "-",
        Username: account.username,
        "Tanggal Pengajuan": account.tanggal_pengajuan
          ? dateTimeLabel(account.tanggal_pengajuan)
          : "Tidak tercatat",
        Status: "Menunggu",
      },
    }));
  }

  if (parent === "data-pasien") {
    const patients = await prisma.pasien.findMany({
      where: recordId ? { id_pasien: recordId } : undefined,
      select: {
        id_pasien: true,
        nama_pasien: true,
        tanggal_lahir: true,
        alamat_jalan: true,
        no_hp: true,
        kode_pos: true,
        username: true,
      },
      orderBy: { nama_pasien: "asc" },
    });
    return patients.map((patient) => ({
      ...row(role, screen, patient.id_pasien, [
        patient.id_pasien,
        patient.nama_pasien,
        dateLabel(patient.tanggal_lahir),
        patient.no_hp,
        patient.alamat_jalan,
        patient.kode_pos,
        patient.username,
      ]),
      values: {
        "Nama Pasien": patient.nama_pasien,
        "Tanggal Lahir": patient.tanggal_lahir.toISOString().slice(0, 10),
        "Alamat Jalan": patient.alamat_jalan,
        "No. HP": patient.no_hp,
        "Kode Pos": patient.kode_pos,
      },
    }));
  }

  if (parent === "data-dokter") {
    const doctors = await prisma.dokter.findMany({
      where: recordId ? { id_dokter: recordId } : undefined,
      select: {
        id_dokter: true,
        nama: true,
        no_hp: true,
        spesialis: true,
        jadwal_dokter: {
          where: { status_jadwal: { equals: "Aktif", mode: "insensitive" } },
          select: { hari: true, jam_mulai: true, jam_selesai: true },
          orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
        },
      },
      orderBy: { nama: "asc" },
    });
    return doctors.map((doctor) => ({
      ...row(
        role,
        screen,
        doctor.id_dokter,
        role.slug === "pasien" && screen.kind !== "detail"
          ? [doctor.nama, doctor.spesialis]
          : role.slug === "pasien" && screen.kind === "detail"
            ? [
              doctor.id_dokter,
              doctor.nama,
              doctor.spesialis,
              doctor.no_hp,
              doctor.jadwal_dokter.length
                ? doctor.jadwal_dokter
                    .map(
                      (schedule) =>
                        `${schedule.hari}, ${timeLabel(schedule.jam_mulai)}–${timeLabel(schedule.jam_selesai)}`,
                    )
                    .join("; ")
                : "Belum ada jadwal aktif",
              ]
            : [doctor.id_dokter, doctor.nama, doctor.spesialis, doctor.no_hp],
      ),
      values: {
        "Nama Dokter": doctor.nama,
        "No. HP": doctor.no_hp,
        Spesialisasi: doctor.spesialis,
        "Jadwal Praktik": doctor.jadwal_dokter.length
          ? doctor.jadwal_dokter
              .map(
                (schedule) =>
                  `${schedule.hari}, ${timeLabel(schedule.jam_mulai)}–${timeLabel(schedule.jam_selesai)}`,
              )
              .join("; ")
          : "Belum ada jadwal aktif",
      },
    }));
  }

  if (parent === "jadwal-dokter" || parent === "jadwal-saya") {
    const schedules = await prisma.jadwal_dokter.findMany({
      where: {
        ...(role.slug === "dokter" ? { id_dokter: identity.profileId } : {}),
        ...(recordId
          ? role.slug === "pasien" && section === "jadwal-dokter"
            ? { id_dokter: recordId }
            : { id_jadwal: recordId }
          : {}),
      },
      select: {
        id_jadwal: true,
        hari: true,
        jam_mulai: true,
        jam_selesai: true,
        status_jadwal: true,
        id_dokter: true,
        dokter: { select: { nama: true, spesialis: true } },
        _count: { select: { kunjungan: true } },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });
    return schedules.map((schedule) => {
      const cells =
        screen.kind === "detail"
          ? [
              schedule.dokter.nama,
              schedule.hari,
              timeValue(schedule.jam_mulai),
              timeValue(schedule.jam_selesai),
              String(schedule._count.kunjungan),
              schedule.status_jadwal,
            ]
          : role.slug === "pasien"
            ? [
                schedule.dokter.nama,
                schedule.dokter.spesialis,
                schedule.hari,
                `${timeLabel(schedule.jam_mulai)}–${timeLabel(schedule.jam_selesai)}`,
                schedule.status_jadwal,
              ]
            : [
                schedule.dokter.nama,
                schedule.hari,
                `${timeLabel(schedule.jam_mulai)}–${timeLabel(schedule.jam_selesai)}`,
                String(schedule._count.kunjungan),
                schedule.status_jadwal,
              ];
      return {
        ...row(
          role,
          screen,
          schedule.id_jadwal,
          cells,
        ),
        values: {
          Dokter: schedule.id_dokter,
          Hari: schedule.hari,
          "Jam Mulai": timeValue(schedule.jam_mulai),
          "Jam Selesai": timeValue(schedule.jam_selesai),
          "Jadwal Baru": schedule.id_jadwal,
          "Status Jadwal": schedule.status_jadwal,
        },
      };
    });
  }

  if (parent === "pembayaran") {
    const payments = await prisma.pembayaran.findMany({
      where: role.slug === "pasien"
        ? { id_pasien: identity.profileId, ...(recordId ? { id_pembayaran: recordId } : {}) }
        : role.slug === "manajer-klinik"
          ? { ...(recordId ? { id_pembayaran: recordId } : {}) }
          : recordId
            ? { id_pembayaran: recordId }
            : undefined,
      select: {
        id_pembayaran: true,
        jumlah_pembayaran: true,
        tanggal_pembayaran: true,
        status_pembayaran: true,
        metode_pembayaran: true,
        bukti_pembayaran: {
          select: {
            id_pembayaran: true,
            nama_file: true,
            tipe_file: true,
            tanggal_unggah: true,
          },
        },
        pasien: { select: { nama_pasien: true, no_hp: true } },
        kunjungan: {
          select: {
            tanggal_kunjungan: true,
            pelayanan: { select: { nama_pelayanan: true } },
            jadwal_dokter: {
              select: { dokter: { select: { nama: true } } },
            },
          },
        },
      },
      orderBy: { tanggal_pembayaran: "desc" },
    });
    return payments.map((payment) => ({
      values: {
        status: String(payment.status_pembayaran),
        bukti: payment.bukti_pembayaran ? "ada" : "",
        "Status Pembayaran": paymentStatuses[payment.status_pembayaran] ?? "Status tidak dikenal",
        "Metode Pembayaran": payment.metode_pembayaran,
        "Tanggal Pembayaran": dateLabel(payment.tanggal_pembayaran),
        "Tanggal Layanan": payment.kunjungan
          ? dateLabel(payment.kunjungan.tanggal_kunjungan)
          : dateLabel(payment.tanggal_pembayaran),
        Dokter: payment.kunjungan?.jadwal_dokter.dokter.nama ?? "-",
        Layanan: payment.kunjungan?.pelayanan?.nama_pelayanan ?? "Tagihan klinik",
        "Nama Pasien": payment.pasien.nama_pasien,
        "Nomor Telepon": payment.pasien.no_hp,
        "Nama File Bukti": payment.bukti_pembayaran?.nama_file ?? "",
        "Jenis File Bukti": payment.bukti_pembayaran?.tipe_file ?? "",
        "Waktu Unggah Bukti": payment.bukti_pembayaran
          ? dateTimeLabel(payment.bukti_pembayaran.tanggal_unggah)
          : "",
        "Total Tagihan": new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(Number(payment.jumlah_pembayaran)),
      },
      ...row(role, screen, payment.id_pembayaran, [
        payment.id_pembayaran,
        payment.pasien.nama_pasien,
        new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(Number(payment.jumlah_pembayaran)),
        dateLabel(payment.tanggal_pembayaran),
        paymentStatuses[payment.status_pembayaran] ?? "Status tidak dikenal",
        payment.metode_pembayaran,
      ]),
    }));
  }

  if (
    parent === "booking-kunjungan" ||
    parent === "konfirmasi-kedatangan" ||
    parent === "kunjungan-pasien" ||
    parent === "status-kunjungan"
  ) {
    const where = {
      ...(role.slug === "pasien" ? { id_pasien: identity.profileId } : {}),
      ...(role.slug === "dokter"
        ? { jadwal_dokter: { is: { id_dokter: identity.profileId } } }
        : {}),
      ...(recordId ? { id_kunjungan: recordId } : {}),
      ...(screen.section === "konfirmasi-kedatangan"
        ? { status_kunjungan: "Menunggu" }
        : {}),
    };
    const visits = await prisma.kunjungan.findMany({
      where,
      select: {
        id_kunjungan: true,
        tanggal_kunjungan: true,
        waktu_kunjungan: true,
        keluhan_awal: true,
        status_kunjungan: true,
        id_jadwal: true,
        pelayanan: { select: { id_pelayanan: true, nama_pelayanan: true } },
        pasien: { select: { nama_pasien: true } },
        jadwal_dokter: {
          select: {
            dokter: { select: { nama: true } },
          },
        },
        pemeriksaan: {
          select: {
            rekam_medis: { select: { id_rekam_medis: true } },
            tindakan: { select: { nama_tindakan: true } },
          },
        },
      },
      orderBy: [{ tanggal_kunjungan: "desc" }, { waktu_kunjungan: "asc" }],
    });
    return visits.map((visit) => {
      const date = dateLabel(visit.tanggal_kunjungan);
      const time = timeLabel(visit.waktu_kunjungan);
      const medicalRecordId =
        visit.pemeriksaan.flatMap((exam) =>
          exam.rekam_medis.map((record) => record.id_rekam_medis),
        )[0] ?? "-";
      const service =
        visit.pemeriksaan
          .flatMap((exam) => exam.tindakan.map((treatment) => treatment.nama_tindakan))
          .join(", ") || visit.pelayanan?.nama_pelayanan || visit.keluhan_awal;
      const cells =
        role.slug === "perawat"
          ? screen.kind === "detail"
            ? [
                visit.pasien.nama_pasien,
                medicalRecordId,
                `${date} ${time}`,
                service,
                visit.status_kunjungan,
              ]
            : [
                visit.id_kunjungan,
                visit.pasien.nama_pasien,
                `${date} ${time}`,
                service,
                visit.status_kunjungan,
              ]
          : role.slug === "dokter"
            ? [
                visit.pasien.nama_pasien,
                visit.pemeriksaan.flatMap((exam) =>
                  exam.rekam_medis.map((record) => record.id_rekam_medis),
                )[0] ?? "-",
                ...(screen.kind === "detail"
                  ? [
                      visit.pelayanan?.nama_pelayanan ?? "-",
                      visit.keluhan_awal,
                      `${date} ${time}`,
                      visit.status_kunjungan,
                    ]
                  : [
                      `${visit.pelayanan?.nama_pelayanan ?? "Layanan belum dipilih"} / ${visit.keluhan_awal}`,
                      `${date} ${time}`,
                      visit.status_kunjungan,
                    ]),
              ]
            : screen.section === "konfirmasi-kedatangan"
              ? [
                  visit.jadwal_dokter.dokter.nama,
                  date,
                  time,
                  visit.status_kunjungan,
                ]
              : screen.section === "booking-kunjungan/riwayat"
                ? [
                    date,
                    visit.jadwal_dokter.dokter.nama,
                    visit.keluhan_awal,
                    visit.status_kunjungan,
                  ]
                : screen.kind === "detail"
                          ? role.slug === "pasien"
                            ? [
                                visit.jadwal_dokter.dokter.nama,
                                visit.pelayanan?.nama_pelayanan ?? "Layanan belum dipilih",
                                date,
                                time,
                                visit.status_kunjungan === "Dikonfirmasi"
                                  ? "Sudah dikonfirmasi"
                                  : visit.status_kunjungan === "Menunggu"
                                    ? "Belum dikonfirmasi"
                                    : visit.status_kunjungan,
                                visit.id_kunjungan,
                              ]
                            : [
                                visit.jadwal_dokter.dokter.nama,
                                date,
                                time,
                                visit.pelayanan?.nama_pelayanan ?? "-",
                                visit.keluhan_awal,
                                visit.status_kunjungan,
                              ]
                : [
                    visit.jadwal_dokter.dokter.nama,
                  date,
                  time,
                  visit.keluhan_awal,
                  visit.status_kunjungan,
                ];
      return {
        ...row(role, screen, visit.id_kunjungan, cells),
        values: {
          "Jadwal Baru": visit.id_jadwal,
          "Tanggal Kunjungan": visit.tanggal_kunjungan.toISOString().slice(0, 10),
          "Waktu Kunjungan": timeValue(visit.waktu_kunjungan),
          "Keluhan Awal": visit.keluhan_awal,
          "Nama Pasien": visit.pasien.nama_pasien,
          "Nomor Rekam Medis": medicalRecordId,
          Layanan: service,
          "Status Saat Ini": visit.status_kunjungan,
          "Rekam Medis": medicalRecordId,
          "Jenis Layanan": visit.pelayanan?.id_pelayanan ?? "",
        },
      };
    });
  }

  if (
    parent === "kritik-saran" ||
    parent.endsWith("kritik-pasien") ||
    (role.slug === "owner" && section === "informasi-operasional/kritik-pasien")
  ) {
    const feedback = await prisma.kritik_saran.findMany({
      where: role.slug === "pasien"
        ? { id_pasien: identity.profileId, ...(recordId ? { id_kritik_saran: recordId } : {}) }
        : role.slug === "owner"
          ? { id_owner: identity.profileId, ...(recordId ? { id_kritik_saran: recordId } : {}) }
          : recordId
            ? { id_kritik_saran: recordId }
            : undefined,
      select: {
        id_kritik_saran: true,
        isi_kritik_saran: true,
        tanggal_pengiriman: true,
        status_tindak_lanjut: true,
        catatan_tindak_lanjut: true,
        pasien: { select: { nama_pasien: true } },
      },
      orderBy: { tanggal_pengiriman: "desc" },
    });
    return feedback.map((item) => {
      const cells = [
        item.pasien.nama_pasien,
        dateLabel(item.tanggal_pengiriman),
        item.isi_kritik_saran,
        item.status_tindak_lanjut ?? "Perlu peninjauan",
        item.catatan_tindak_lanjut ?? "",
      ];
      return {
        ...row(
        role,
        screen,
        item.id_kritik_saran,
        role.slug === "owner" && screen.kind === "list"
          ? cells.slice(1)
          : cells,
        ),
        values: {
          "Status Tindak Lanjut": item.status_tindak_lanjut ?? "",
          "Catatan Tindak Lanjut": item.catatan_tindak_lanjut ?? "",
        },
      };
    });
  }

  if (parent === "rekam-medis" || parent === "riwayat-pasien") {
    const records = await prisma.rekam_medis.findMany({
      where: {
        ...(role.slug === "dokter"
          ? { pemeriksaan: { is: { id_dokter: identity.profileId } } }
          : role.slug === "pasien"
            ? { pemeriksaan: { is: { kunjungan: { is: { id_pasien: identity.profileId } } } } }
            : {}),
        ...(recordId ? { id_rekam_medis: recordId } : {}),
      },
      select: {
        id_rekam_medis: true,
        tanggal_rekam_medis: true,
        diagnosis: true,
        catatan: true,
        status_validasi: true,
        pemeriksaan: {
          select: {
            dokter: { select: { nama: true } },
            kunjungan: { select: { pasien: { select: { nama_pasien: true } } } },
          },
        },
      },
      orderBy: { tanggal_rekam_medis: "desc" },
    });
    return records.map((record) => ({
      values: { Diagnosis: record.diagnosis, Catatan: record.catatan ?? "" },
      ...row(role, screen, record.id_rekam_medis, [
        record.pemeriksaan.kunjungan.pasien.nama_pasien,
        record.id_rekam_medis,
        dateLabel(record.tanggal_rekam_medis),
        record.diagnosis,
        record.status_validasi,
      ]),
    }));
  }

  if (parent === "resep") {
    const prescriptions = await prisma.resep.findMany({
      where: {
        ...(role.slug === "dokter"
          ? { rekam_medis: { pemeriksaan: { is: { id_dokter: identity.profileId } } } }
          : role.slug === "pasien"
            ? {
                rekam_medis: {
                  pemeriksaan: {
                    is: { kunjungan: { is: { id_pasien: identity.profileId } } },
                  },
                },
              }
            : {}),
        ...(recordId ? { id_resep: recordId } : {}),
      },
      select: {
        id_resep: true,
        no_resep: true,
        tanggal_resep: true,
        isi_resep: true,
      },
      orderBy: { tanggal_resep: "desc" },
    });
    return prescriptions.map((prescription) => ({
      values: { "Nomor Resep": prescription.no_resep, "Tanggal Resep": prescription.tanggal_resep.toISOString().slice(0,10), "Isi Resep": prescription.isi_resep },
      ...row(role, screen, prescription.id_resep, [
        prescription.no_resep,
        dateLabel(prescription.tanggal_resep),
        prescription.isi_resep,
      ]),
    }));
  }

  if (parent === "informasi-klinik") {
    const records = await prisma.informasi_klinik.findMany({ where: recordId ? { id_informasi: recordId } : {}, orderBy: { tanggal_publikasi: "desc" } });
    return records.map((item) => ({
      ...row(role, screen, item.id_informasi, [item.judul, dateLabel(item.tanggal_publikasi), screen.kind === "list" ? (item.tanggal_publikasi.toISOString().slice(0,10) <= clinicToday() ? "Terpublikasi" : "Terjadwal") : item.isi_informasi]),
      values: { Judul: item.judul, "Isi Informasi": item.isi_informasi, "Tanggal Publikasi": item.tanggal_publikasi.toISOString().slice(0,10) },
    }));
  }
  if (parent === "data-pelayanan") {
    const services = await prisma.pelayanan.findMany({ where: recordId ? { id_pelayanan: recordId } : {}, orderBy: { nama_pelayanan: "asc" } });
    return services.map((service) => ({
      ...row(role, screen, service.id_pelayanan, [
        service.id_pelayanan,
        service.nama_pelayanan,
        service.deskripsi,
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(service.biaya)),
      ]),
      values: {
        "Nama Pelayanan": service.nama_pelayanan,
        Deskripsi: service.deskripsi,
        Biaya: String(service.biaya),
      },
    }));
  }

  return [];
}

export async function loadPortalFormOptions(
  role: PortalRole,
  screen: PortalScreen,
  identity: UserSession,
  recordId?: string,
): Promise<Record<string, PortalFormOption[]>> {
  if (
    role.slug === "pasien" &&
    ["booking-kunjungan/tambah", "booking-kunjungan/ubah"].includes(screen.section)
  ) {
    const schedules = await prisma.jadwal_dokter.findMany({
      where: { status_jadwal: { equals: "Aktif", mode: "insensitive" } },
      select: {
        id_jadwal: true,
        id_dokter: true,
        hari: true,
        jam_mulai: true,
        jam_selesai: true,
        dokter: { select: { nama: true, spesialis: true } },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });
    const options: Record<string, PortalFormOption[]> = {
      [screen.section === "booking-kunjungan/ubah" ? "Jadwal Baru" : "Jadwal Praktik"]: schedules.map((schedule) => ({
        value: schedule.id_jadwal,
        label: `${schedule.dokter.nama} - ${schedule.hari}, ${timeLabel(schedule.jam_mulai)}–${timeLabel(schedule.jam_selesai)}`,
        doctorId: schedule.id_dokter,
        day: schedule.hari,
        startTime: timeValue(schedule.jam_mulai),
        endTime: timeValue(schedule.jam_selesai),
      })),
    };
    if (screen.section === "booking-kunjungan/tambah") {
      options.Dokter = [
        ...new Map(
          schedules.map((schedule) => [
            schedule.id_dokter,
            {
              value: schedule.id_dokter,
              label: `${schedule.dokter.nama} - ${schedule.dokter.spesialis}`,
            },
          ]),
        ).values(),
      ];
    }
    options["Jenis Layanan"] = (await prisma.pelayanan.findMany({
      select: { id_pelayanan: true, nama_pelayanan: true, biaya: true },
      orderBy: { nama_pelayanan: "asc" },
    })).map((service) => ({
      value: service.id_pelayanan,
      label: service.nama_pelayanan.replace(/^Contoh:\s*/i, ""),
    }));
    return options;
  }

  if (
    role.slug === "manajer-klinik" &&
    ["jadwal-dokter/tambah", "jadwal-dokter/edit"].includes(screen.section)
  ) {
    const doctors = await prisma.dokter.findMany({
      select: { id_dokter: true, nama: true, spesialis: true },
      orderBy: { nama: "asc" },
    });
    return {
      Dokter: doctors.map((doctor) => ({
        value: doctor.id_dokter,
        label: `${doctor.nama} - ${doctor.spesialis}`,
      })),
      Hari: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => ({
        value: day,
        label: day,
      })),
      "Status Jadwal": ["Aktif", "Tidak Aktif"].map((status) => ({
        value: status,
        label: status,
      })),
    };
  }

  if (
    role.slug === "manajer-klinik" &&
    ["data-pasien/tambah", "data-pasien/edit"].includes(screen.section)
  ) {
    const postalCodes = await prisma.kode_pos.findMany({
      select: {
        kode_pos: true,
        kelurahan: true,
        kecamatan: true,
        kota: true,
      },
      orderBy: { kode_pos: "asc" },
    });
    return {
      "Kode Pos": postalCodes.map((item) => ({
        value: item.kode_pos,
        label: `${item.kode_pos} — ${item.kelurahan}, ${item.kecamatan}, ${item.kota}`,
      })),
    };
  }

  if (
    role.slug === "dokter" &&
    screen.section === "rekam-medis/tambah"
  ) {
    const nurses = await prisma.perawat.findMany({
      select: { id_perawat: true, nama_perawat: true },
      orderBy: { nama_perawat: "asc" },
    });
    return {
      Tindakan: (await prisma.pelayanan.findMany({ orderBy: { nama_pelayanan: "asc" } })).map((service) => ({ value: service.id_pelayanan, label: `${service.nama_pelayanan} - Rp ${service.biaya}` })),
      Perawat: nurses.map((nurse) => ({
        value: nurse.id_perawat,
        label: nurse.nama_perawat,
      })),
    };
  }

  if (
    role.slug === "dokter" &&
    screen.section === "resep/tambah"
  ) {
    const records = await prisma.rekam_medis.findMany({
      where: { pemeriksaan: { is: { id_dokter: identity.profileId } } },
      select: {
        id_rekam_medis: true,
        diagnosis: true,
        tanggal_rekam_medis: true,
        pemeriksaan: {
          select: {
            kunjungan: { select: { pasien: { select: { nama_pasien: true } } } },
          },
        },
      },
      orderBy: { tanggal_rekam_medis: "desc" },
    });
    return {
      "Rekam Medis": records.map((record) => ({
        value: record.id_rekam_medis,
        label: `${record.pemeriksaan.kunjungan.pasien.nama_pasien} - ${record.diagnosis}`,
      })),
    };
  }

  if (
    role.slug === "perawat" &&
    ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section)
  ) {
    const visit = recordId
      ? await prisma.kunjungan.findUnique({
          where: { id_kunjungan: recordId },
          select: { status_kunjungan: true },
        })
      : null;
    return {
      "Status Baru": (visitTransitions[visit?.status_kunjungan ?? ""] ?? []).map(
        (status) => ({ value: status, label: status }),
      ),
    };
  }

  if (role.slug === "pasien" && screen.section === "pembayaran/transfer") return { "Metode Pembayaran": [{ value: "Tunai", label: "Tunai di kasir" }, { value: "Transfer", label: "Transfer Bank" }] };
  return {};
}
