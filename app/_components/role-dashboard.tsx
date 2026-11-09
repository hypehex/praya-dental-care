import { ReviewForm } from "./review-form";
import { BookingScheduleFields } from "./booking-schedule-fields";
import { DoctorTreatmentFields } from "./doctor-treatment-fields";
import { NurseStatusFields } from "./nurse-status-fields";
import { saveCatalogAction, deleteWorkflowAction, updateClinicalAction, submitPaymentAction, verifyPaymentAction } from "../_lib/module4-actions";
import Image from "next/image";
import Link from "next/link";
import type { PortalRole, PortalScreen } from "../_lib/portal-config";
import { portalHref } from "../_lib/portal-config";
import type { UserSession } from "../_lib/auth";
import { logoutAction } from "../_lib/auth-actions";
import {
  confirmArrivalAction,
  reviewBookingAction,
  reviewPatientRegistrationAction,
  savePortalFormAction,
  submitFeedbackAction,
  updateFeedbackAction,
  bookVisitAction,
  cancelBookingAction,
  deletePortalRecordAction,
  updateBookingAction,
} from "../_lib/portal-actions";
import type { PortalFormOption, PortalRow } from "../_lib/portal-data";

type RoleDashboardProps = {
  role: PortalRole;
  screen: PortalScreen;
  identity: UserSession;
  rows: PortalRow[];
  dataError?: string;
  error?: string;
  formOptions: Record<string, PortalFormOption[]>;
  recordId?: string;
};

type PortalPageContentProps = Pick<
  RoleDashboardProps,
  | "role"
  | "screen"
  | "rows"
  | "dataError"
  | "error"
  | "formOptions"
  | "recordId"
>;

function isActive(section: string, activeSection: string) {
  return section === ""
    ? activeSection === ""
    : activeSection === section || activeSection.startsWith(`${section}/`);
}

function fieldType(label: string) {
  if (label.toLowerCase().includes("tanggal")) return "date";
  if (label === "Bukti Pembayaran") return "file";
  if (label === "Biaya") return "number";
  if (label.toLowerCase().includes("jam") || label.toLowerCase().includes("waktu")) return "time";
  if (label.toLowerCase().includes("password")) return "password";
  if (label.toLowerCase().includes("isi") || label.toLowerCase().includes("catatan") || label.toLowerCase().includes("keluhan") || label.toLowerCase().includes("deskripsi") || label.toLowerCase().includes("alamat")) {
    return "textarea";
  }
  return "text";
}

function PortalPageContent({
  role,
  screen,
  rows,
  dataError,
  error,
  formOptions,
  recordId,
}: PortalPageContentProps) {
  const parentHref = portalHref(role.slug, screen.parent);
  const bookingSchedules = formOptions["Jadwal Praktik"] ?? [];
  const presetSchedule = bookingSchedules.find((option) => option.value === recordId);
  const presetDoctorId = presetSchedule?.doctorId ??
    (formOptions.Dokter?.some((option) => option.value === recordId) ? recordId : undefined);
  const presetServiceId = formOptions["Jenis Layanan"]?.some((option) => option.value === recordId)
    ? recordId
    : undefined;
  const formScreen = role.screens.find(
    (candidate) =>
      candidate.kind === "form" &&
      candidate.parent === screen.parent &&
      candidate.section.startsWith(`${screen.parent}/`),
  );
  const inlineEditScreen = role.slug === "manajer-klinik" && screen.kind === "list"
    ? role.screens.find((candidate) => candidate.section === `${screen.parent}/edit`)
    : undefined;
  const formAction =
    role.slug === "manajer-klinik" && /^(informasi-klinik|data-pelayanan)\/(tambah|edit)$/.test(screen.section)
      ? saveCatalogAction.bind(null, screen.section)
      : role.slug === "dokter" && ["rekam-medis/edit", "resep/edit"].includes(screen.section)
        ? updateClinicalAction.bind(null, screen.section)
        : role.slug === "pasien" && screen.section === "pembayaran/transfer"
          ? submitPaymentAction
          : role.slug === "pasien" && screen.section === "profil/edit"
            ? savePortalFormAction.bind(null, role.slug, screen.section)
          :
    screen.section === "booking-kunjungan/tambah"
      ? bookVisitAction
      : screen.section === "booking-kunjungan/ubah"
        ? updateBookingAction
      : screen.section === "kritik-saran"
        ? submitFeedbackAction
        : screen.section === "informasi-operasional/kritik-pasien/detail"
          ? updateFeedbackAction
          : role.slug === "manajer-klinik" &&
              [
                "data-pasien/tambah",
                "data-pasien/edit",
                "data-dokter/tambah",
                "data-dokter/edit",
                "jadwal-dokter/tambah",
                "jadwal-dokter/edit",
              ].includes(screen.section)
            ? savePortalFormAction.bind(null, role.slug, screen.section)
            : role.slug === "dokter" &&
                ["rekam-medis/tambah", "resep/tambah", "rekam-medis/tambah/resep"].includes(screen.section)
              ? savePortalFormAction.bind(null, role.slug, screen.section === "rekam-medis/tambah/resep" ? "resep/tambah" : screen.section)
              : role.slug === "perawat" &&
                  ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section)
                ? savePortalFormAction.bind(null, role.slug, screen.section)
                : undefined;
  const errorMessage =
    error === "in-use" ? "Data masih digunakan atau statusnya tidak mengizinkan penghapusan."
      : error === "file" ? "Pilih bukti PNG, JPG, atau PDF yang valid, maksimum 3 MB."
      : error === "slot-unavailable" ? "Waktu kunjungan tersebut sudah digunakan. Pilih waktu lain yang masih tersedia."
      : error === "database"
      ? "Database tidak tersedia. Perubahan belum disimpan."
      : error === "duplicate"
        ? "Data dengan identitas tersebut sudah terdaftar."
        : error === "invalid-data"
          ? "Data tidak valid atau tidak lagi dapat diperbarui."
          : error === "stale"
            ? "Data sudah berubah. Muat ulang daftar sebelum mencoba lagi."
            : error === "clinic-unavailable"
              ? "Data owner klinik belum tersedia untuk mengaitkan masukan."
              : error === "unsupported"
                ? "Tindakan ini belum terhubung ke data yang tersedia."
                : null;
  const formSubmitLabel =
    screen.section === "booking-kunjungan/tambah"
      ? "Periksa Jadwal"
      : screen.section === "kritik-saran"
        ? "Kirim Masukan"
        : screen.section === "rekam-medis/tambah"
          ? "Simpan Rekam Medis"
          : screen.section === "resep/tambah"
            ? "Simpan Resep"
            : screen.section === "status-kunjungan/ubah"
              ? "Simpan Status"
              : screen.section === "status-kunjungan/tambah"
                ? "Tambah Status"
                : screen.section === "booking-kunjungan/ubah"
                  ? "Simpan Perubahan Booking"
              : screen.section === "jadwal-dokter/tambah"
                ? "Simpan Jadwal"
                : screen.section === "data-pasien/tambah"
                  ? "Simpan Data Pasien"
                  : screen.section === "data-dokter/tambah"
                    ? "Simpan Data Dokter"
                    : [
                        "data-pasien/edit",
                        "data-dokter/edit",
                        "jadwal-dokter/edit",
                      ].includes(screen.section)
                      ? "Simpan Perubahan"
                      : screen.section === "informasi-operasional/kritik-pasien/detail" ? "Simpan tindak lanjut" : "Simpan";
  const actionHref = (section: string) => {
    const href = portalHref(role.slug, section);
    const needsRecordId = /\/(edit|hapus|transfer)$/.test(section) ||
      (role.slug === "perawat" && section === "status-kunjungan/ubah") ||
      (role.slug === "perawat" && section === "status-kunjungan/tambah") ||
      (role.slug === "dokter" &&
        (section === "rekam-medis/tambah" ||
          (section === "resep/tambah" && screen.section === "rekam-medis/detail"))) ||
      (role.slug === "pasien" &&
        ["booking-kunjungan/ubah", "booking-kunjungan/dibatalkan"].includes(section)) ||
      (role.slug === "pasien" &&
        section === "booking-kunjungan/tambah" &&
        ["data-dokter/detail", "jadwal-dokter/detail", "layanan/detail"].includes(screen.section)) ||
      (role.slug === "pasien" &&
        section === "jadwal-dokter" &&
        screen.section === "data-dokter/detail") ||
      (role.slug === "manajer-klinik" &&
        ["data-pasien/edit", "data-dokter/edit", "jadwal-dokter/edit",
          "data-pasien/hapus", "data-dokter/hapus", "jadwal-dokter/hapus"].includes(section));
    return needsRecordId && recordId
      ? `${href}?id=${encodeURIComponent(recordId)}`
      : href;
  };
  const formNeedsRecordId = (screen.section !== "profil/edit" && /\/(edit|transfer)$/.test(screen.section)) ||
    (role.slug === "manajer-klinik" &&
      ["data-pasien/edit", "data-dokter/edit", "jadwal-dokter/edit"].includes(screen.section)) ||
    (role.slug === "pasien" && screen.section === "booking-kunjungan/ubah") ||
    (role.slug === "dokter" && screen.section === "rekam-medis/tambah") ||
    (role.slug === "perawat" && screen.section === "status-kunjungan/ubah") ||
    (role.slug === "owner" &&
      screen.section === "informasi-operasional/kritik-pasien/detail");
  const visibleActions = screen.actions?.filter((item) => {
    if (role.slug === "dokter" && screen.section === "kunjungan-pasien/detail") {
      return rows[0]?.values?.["Status Saat Ini"] === "Pemeriksaan" &&
        rows[0]?.values?.["Rekam Medis"] === "-";
    }
    if (role.slug === "perawat" && screen.section === "status-kunjungan/detail") {
      const status = rows[0]?.values?.["Status Saat Ini"] ?? "";
      if (item.section === "status-kunjungan/hapus") return status === "Dikonfirmasi";
      if (item.section === "status-kunjungan/ubah") return ["Menunggu", "Dikonfirmasi", "Pemeriksaan"].includes(status);
    }
    if (role.slug !== "pasien" || screen.section !== "booking-kunjungan/detail") {
      if (role.slug !== "pasien" || screen.section !== "pembayaran/detail") {
        return true;
      }
      return ["0", "3"].includes(rows[0]?.values?.status ?? "");
    }
    const status = rows[0]?.values?.["Status Saat Ini"] ?? "";
    if (item.section === "booking-kunjungan/hapus") {
      return ["Menunggu", "Dibatalkan"].includes(status);
    }
    return ["Menunggu", "Dikonfirmasi"].includes(status);
  });

  if (screen.kind === "dashboard") {
    if (role.slug === "pasien") {
      const dashboard = rows[0]?.patientDashboard;
      const currency = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      });
      const paymentStatus = dashboard?.paymentReminder
        ? dashboard.paymentReminder.status === 3
          ? "Ditolak"
          : dashboard.paymentReminder.status === 2
            ? "Menunggu verifikasi"
            : "Belum dibayar"
        : "";
      return (
        <section className="portal-overview patient-dashboard-overview" aria-label="Ringkasan pasien">
          {errorMessage || dataError ? <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p> : null}
          <div className="patient-dashboard-actions">
            <Link className="portal-button portal-button-primary" href={portalHref(role.slug, "booking-kunjungan/tambah")}>
              Booking Baru
            </Link>
          </div>
          <article className="patient-next-visit">
            <div className="patient-next-visit-heading">
              <p className="patient-eyebrow">Kunjungan Berikutnya</p>
              {dashboard?.nextVisit ? (
                <span className="patient-status-pill">{dashboard.nextVisit.status}</span>
              ) : null}
            </div>
            {dashboard?.nextVisit ? (
              <>
                <div className="patient-next-visit-details">
                  <span className="patient-avatar" aria-hidden="true">
                    {dashboard.nextVisit.doctor.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                  </span>
                  <div>
                    <h2>{dashboard.nextVisit.doctor}</h2>
                    <p>{dashboard.nextVisit.service} <span aria-hidden="true">•</span> {dashboard.nextVisit.date}</p>
                    <p className="patient-next-visit-time">{dashboard.nextVisit.time}</p>
                  </div>
                </div>
                <Link
                  className="portal-button portal-button-secondary"
                  href={`${portalHref(role.slug, "booking-kunjungan/detail")}?id=${encodeURIComponent(dashboard.nextVisit.id)}`}
                >
                  Lihat Detail
                </Link>
              </>
            ) : (
              <div className="patient-dashboard-empty">
                <h2>Belum ada jadwal kunjungan</h2>
                <p>Buat booking untuk memilih layanan dan jadwal dokter yang tersedia.</p>
                <Link className="portal-button portal-button-secondary" href={portalHref(role.slug, "booking-kunjungan/tambah")}>
                  Buat Booking
                </Link>
              </div>
            )}
          </article>
          <div className="patient-metric-grid">
            {[
              ["Booking aktif", dashboard?.activeBookingCount ?? 0, "booking-kunjungan"],
              ["Tagihan menunggu", dashboard?.pendingPaymentCount ?? 0, "pembayaran"],
              ["Kunjungan selesai", dashboard?.completedVisitCount ?? 0, "booking-kunjungan/riwayat"],
            ].map(([label, count, section]) => (
              <Link className="patient-metric-card" href={portalHref(role.slug, String(section))} key={String(label)}>
                <strong>{count}</strong>
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <div className="patient-dashboard-lower">
            <section className="patient-schedule-panel">
              <div className="patient-panel-heading">
                <h2>Jadwal Dokter</h2>
                <Link href={portalHref(role.slug, "jadwal-dokter")}>Lihat semua <span aria-hidden="true">→</span></Link>
              </div>
              {dashboard?.doctorSchedules.length ? (
                <ul className="patient-schedule-list">
                  {dashboard.doctorSchedules.map((schedule) => (
                    <li key={schedule.id}>
                      <span className="patient-avatar" aria-hidden="true">
                        {schedule.doctor.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase()}
                      </span>
                      <div className="patient-schedule-copy">
                        <strong>{schedule.doctor}</strong>
                        <span>{schedule.specialty} · {schedule.day}</span>
                      </div>
                      <span className="patient-schedule-time">{schedule.start}–{schedule.end}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="patient-dashboard-empty-copy">Belum ada jadwal dokter aktif.</p>
              )}
            </section>
            <aside className={`patient-payment-reminder${dashboard?.paymentReminder?.status === 3 ? " is-rejected" : ""}`}>
              <h2>Pengingat pembayaran</h2>
              {dashboard?.paymentReminder ? (
                <>
                  <p className="patient-payment-amount">{currency.format(dashboard.paymentReminder.amount)}</p>
                  <p>
                    {dashboard.paymentReminder.status === 3
                      ? "Bukti pembayaran ditolak. Periksa tagihan untuk melihat status dan mengunggah ulang bukti."
                      : `${paymentStatus} · ${dashboard.pendingPaymentCount} tagihan perlu ditindaklanjuti.`}
                  </p>
                  <Link
                    className="portal-button portal-button-secondary"
                    href={`${portalHref(role.slug, "pembayaran/detail")}?id=${encodeURIComponent(dashboard.paymentReminder.id)}`}
                  >
                    {dashboard.paymentReminder.status === 3 ? "Periksa & Unggah Ulang" : "Lihat Tagihan"}
                  </Link>
                </>
              ) : (
                <>
                  <p>Tidak ada tagihan yang perlu ditindaklanjuti.</p>
                  <Link className="portal-button portal-button-secondary" href={portalHref(role.slug, "pembayaran")}>
                    Lihat Tagihan
                  </Link>
                </>
              )}
            </aside>
          </div>
        </section>
      );
    }
    if (role.slug === "perawat") {
      const dashboard = rows[0]?.nurseDashboard;
      const metrics = [
        ["Total Kunjungan", dashboard?.totalVisitCount ?? 0, "Terdaftar di klinik"],
        ["Menunggu", dashboard?.waitingCount ?? 0, "Menanti ditangani"],
        ["Pemeriksaan", dashboard?.examinationCount ?? 0, "Sedang ditangani"],
        ["Selesai", dashboard?.completedCount ?? 0, "Kunjungan selesai"],
      ] as const;
      return (
        <section className="nurse-dashboard" aria-label="Ringkasan Perawat">
          {errorMessage || dataError ? <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p> : null}
          <div className="nurse-dashboard-metrics">
            {metrics.map(([label, count, description]) => (
              <Link className="nurse-dashboard-metric" href={portalHref(role.slug, "status-kunjungan")} key={label}>
                <span>{label}</span>
                <strong>{count}</strong>
                <small>{description}</small>
              </Link>
            ))}
          </div>
          <div className="nurse-dashboard-panels">
            <section className="nurse-dashboard-panel nurse-today-panel">
              <div className="nurse-panel-heading">
                <h2>Kunjungan Hari Ini</h2>
                <Link href={portalHref(role.slug, "status-kunjungan")}>Lihat Daftar <span aria-hidden="true">→</span></Link>
              </div>
              {dashboard?.todayVisits.length ? (
                <div className="nurse-today-list">
                  <div className="nurse-today-header"><span>Pasien</span><span>Waktu</span><span>Status</span><span>Aksi</span></div>
                  {dashboard.todayVisits.map((visit) => (
                    <div className="nurse-today-row" key={visit.id}>
                      <span>{visit.patient}</span><span>{visit.time}</span><span className="nurse-status-pill">{visit.status}</span>
                      <Link href={`${portalHref(role.slug, "status-kunjungan/detail")}?id=${encodeURIComponent(visit.id)}`}>Detail</Link>
                    </div>
                  ))}
                </div>
              ) : <p className="nurse-dashboard-empty">Belum ada kunjungan terjadwal hari ini.</p>}
            </section>
            <section className="nurse-dashboard-panel nurse-status-panel">
              <div className="nurse-panel-heading"><h2>Status Kunjungan</h2><Link href={portalHref(role.slug, "status-kunjungan")}>Lihat Semua <span aria-hidden="true">→</span></Link></div>
              <div className="nurse-status-summary">
                <span>{dashboard?.waitingCount ?? 0} Menunggu</span>
                <span>{dashboard?.examinationCount ?? 0} Pemeriksaan</span>
                <span>{dashboard?.completedCount ?? 0} Selesai</span>
              </div>
            </section>
          </div>
        </section>
      );
    }
    if (role.slug === "manajer-klinik") {
      const dashboard = rows[0]?.managerDashboard;
      const metrics = [
        ["Total Pasien", dashboard?.patientCount ?? 0, "data-pasien"],
        ["Dokter Terdaftar", dashboard?.doctorCount ?? 0, "data-dokter"],
        ["Jadwal Dokter", dashboard?.scheduleCount ?? 0, "jadwal-dokter"],
        ["Pembayaran", dashboard?.paymentCount ?? 0, "pembayaran"],
      ] as const;
      return (
        <section className="manager-dashboard" aria-label="Ringkasan Manajer Klinik">
          {errorMessage || dataError ? <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p> : null}
          <div className="manager-dashboard-metrics">
            {metrics.map(([label, count, section]) => (
              <Link className="manager-dashboard-metric" href={portalHref(role.slug, section)} key={label}>
                <span>{label}</span>
                <strong>{count}</strong>
              </Link>
            ))}
          </div>
          <section className="manager-dashboard-panel">
            <h2>Ringkasan Aktivitas</h2>
            <div className="manager-dashboard-activity">
              {dashboard?.latestVisit ? (
                <Link href={`${portalHref(role.slug, "kunjungan-pasien/detail")}?id=${encodeURIComponent(dashboard.latestVisit.id)}`}>
                  <span>{dashboard.latestVisit.id} - {dashboard.latestVisit.patient}</span>
                  <span>{dashboard.latestVisit.date} - {dashboard.latestVisit.time}</span>
                  <strong>{dashboard.latestVisit.status}</strong>
                </Link>
              ) : <p>Belum ada aktivitas kunjungan.</p>}
            </div>
            <div className="manager-dashboard-legacy">
              <p className="manager-detail-eyebrow">Akses cepat</p>
              <h2>Kelola operasional klinik</h2>
              <p>Pilih data yang akan dikelola. Setiap perubahan tersimpan dan langsung tersedia untuk role terkait.</p>
            </div>
            <div className="manager-dashboard-shortcuts">
              {role.menu.filter((item) => item.section).map((item) => (
                <Link href={portalHref(role.slug, item.section)} key={item.section}>{item.label}<span aria-hidden="true">→</span></Link>
              ))}
            </div>
            <Link className="portal-button portal-button-primary manager-dashboard-submission" href={portalHref(role.slug, "pengajuan-registrasi")}>Lihat pengajuan</Link>
          </section>
        </section>
      );
    }
    if (role.slug === "owner") {
      const dashboard = rows[0]?.ownerDashboard;
      return (
        <section className="owner-dashboard" aria-label="Ringkasan Owner">
          {errorMessage || dataError ? <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p> : null}
          <section className="owner-dashboard-banner">
            <h2>Pantau kinerja klinik lebih mudah</h2>
            <Link className="portal-button portal-button-primary" href={portalHref(role.slug, "rekap-pelayanan")}>Lihat Rekap Pelayanan</Link>
          </section>
          <div className="owner-dashboard-metrics">
            {[
              ["Rekap Pelayanan", dashboard?.visitCount ?? 0, "kunjungan", "rekap-pelayanan"],
              ["Informasi Pelayanan", dashboard?.pendingFeedbackCount ?? 0, "perlu ditinjau", "informasi-operasional"],
              ["Laporan Klinik", dashboard?.examinationCount ?? 0, "pemeriksaan", "laporan-klinik"],
            ].map(([label, count, unit, section]) => (
              <Link className="patient-metric-card owner-dashboard-metric" href={portalHref(role.slug, String(section))} key={String(label)}>
                <span>{label}</span><strong>{count}</strong><small>{unit}</small>
              </Link>
            ))}
          </div>
          <div className="owner-dashboard-panels">
            <section className="owner-dashboard-panel">
              <h2>Ringkasan</h2>
              <div className="owner-mini-row owner-mini-header"><span>Menu</span><span>Keterangan</span><span>Kondisi</span></div>
              <div className="owner-mini-row"><span>Pasien</span><span>{dashboard?.patientCount ?? 0} terdaftar</span><strong>Terverifikasi</strong></div>
              <div className="owner-mini-row"><span>Kunjungan</span><span>{dashboard?.completedVisitCount ?? 0} selesai</span><strong>Selesai</strong></div>
              <div className="owner-mini-row"><span>Kritik &amp; Saran</span><span>{dashboard?.pendingFeedbackCount ?? 0} menunggu</span><strong>{dashboard?.completedFeedbackCount ?? 0} selesai</strong></div>
            </section>
            <section className="owner-dashboard-panel">
              <div className="owner-panel-heading"><h2>Laporan klinik</h2><Link href={portalHref(role.slug, "laporan-klinik")}>Buka Laporan</Link></div>
              <div className="owner-mini-row owner-report-row owner-mini-header"><span>Jenis</span><span>Periode</span><span>Ringkasan</span></div>
              <div className="owner-mini-row owner-report-row"><span>Pelayanan</span><span>Bulan ini</span><strong>{dashboard?.examinationCount ?? 0} tindakan</strong></div>
              <div className="owner-mini-row owner-report-row"><span>Kunjungan</span><span>Bulan ini</span><strong>{dashboard?.completedVisitCount ?? 0} selesai</strong></div>
            </section>
          </div>
        </section>
      );
    }
    if (role.slug === "dokter") {
      const dashboard = rows[0]?.doctorDashboard;
      return (
        <section className="doctor-dashboard" aria-label="Ringkasan Dokter">
          {errorMessage || dataError ? <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p> : null}
          <div className="doctor-dashboard-banner">Pelayanan Klinis Lebih Terarah</div>
          <div className="doctor-dashboard-metrics">
            {[
              ["Kunjungan Hari Ini", dashboard?.todayVisitCount ?? 0, "kunjungan-pasien"],
              ["Menunggu Pemeriksaan", dashboard?.waitingExaminationCount ?? 0, "kunjungan-pasien"],
              ["Draft Rekam Medis", dashboard?.draftRecordCount ?? 0, "rekam-medis"],
              ["Resep Tercatat", dashboard?.prescriptionCount ?? 0, "resep"],
            ].map(([label, count, section]) => (
              <Link className="doctor-dashboard-metric" href={portalHref(role.slug, String(section))} key={String(label)}>
                <span>{label}</span>
                <strong>{count}</strong>
              </Link>
            ))}
          </div>
          <div className="doctor-dashboard-tables">
            <section className="doctor-dashboard-list">
              <div className="doctor-dashboard-list-heading"><h2>Kunjungan Hari Ini</h2><Link href={portalHref(role.slug, "kunjungan-pasien")}>Lihat Semua</Link></div>
              <div className="doctor-mini-row doctor-mini-header"><span>Pasien</span><span>Waktu</span><span>Status</span><span>Aksi</span></div>
              {dashboard?.visits.length ? dashboard.visits.map((visit) => (
                <div className="doctor-mini-row" key={visit.id}>
                  <strong>{visit.patient}</strong><span>{visit.time}</span><span className="doctor-status-pill">{visit.status}</span>
                  <Link href={`${portalHref(role.slug, "kunjungan-pasien/detail")}?id=${encodeURIComponent(visit.id)}`}>Detail</Link>
                </div>
              )) : <p className="doctor-dashboard-empty">Belum ada kunjungan hari ini.</p>}
            </section>
            <section className="doctor-dashboard-list">
              <div className="doctor-dashboard-list-heading"><h2>Jadwal Praktik Saya</h2><Link href={portalHref(role.slug, "jadwal-saya")}>Lihat Semua</Link></div>
              <div className="doctor-mini-row doctor-schedule-row doctor-mini-header"><span>Hari</span><span>Waktu</span><span>Status</span></div>
              {dashboard?.schedules.length ? dashboard.schedules.map((schedule) => (
                <Link className="doctor-mini-row doctor-schedule-row" href={`${portalHref(role.slug, "jadwal-saya/detail")}?id=${encodeURIComponent(schedule.id)}`} key={schedule.id}>
                  <strong>{schedule.day}</strong><span>{schedule.time}</span><span className="doctor-status-pill">{schedule.status}</span>
                </Link>
              )) : <p className="doctor-dashboard-empty">Belum ada jadwal praktik.</p>}
            </section>
          </div>
        </section>
      );
    }
    return (
      <section className="portal-overview" aria-label="Navigasi fitur">
        {errorMessage ? <p className="portal-notice" role="alert">{errorMessage}</p> : null}
        <p className="portal-notice">Selamat datang di Praya Dental Care, {role.label}.</p>
        {rows[0]?.summaryDashboard?.length ? (
          <div className="patient-metric-grid">
            {rows[0].summaryDashboard.map((metric) => (
              <Link className="patient-metric-card" href={portalHref(role.slug, metric.section)} key={metric.label}>
                <strong>{metric.count}</strong>
                <span>{metric.label}</span>
              </Link>
            ))}
          </div>
        ) : null}
        {visibleActions?.length ? (
          <div className="portal-action-row">
            {visibleActions.map((item) => (
              <Link
                className={`portal-button portal-button-${item.variant ?? "secondary"}`}
                href={actionHref(item.section)}
                key={`${item.section}-${item.label}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="portal-shortcut-grid">
          {role.menu
            .filter((item) => item.section !== "")
            .map((item) => (
              <Link
                className="portal-shortcut"
                href={portalHref(role.slug, item.section)}
                key={item.section}
              >
                <span>{item.label}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
        </div>
      </section>
    );
  }

  return (
    <section className="portal-content" aria-label={screen.title}>
      {errorMessage || dataError ? (
        <p className="portal-notice" role="alert">{errorMessage ?? dataError}</p>
      ) : null}
      {role.slug === "owner" ||
      role.slug === "pasien" && screen.kind === "detail" ||
      role.slug === "manajer-klinik" && screen.kind === "detail" ||
      role.slug === "dokter" && screen.kind === "detail" ||
      role.slug === "perawat" && screen.kind === "detail" ? null : <div className="portal-action-row">
        {visibleActions?.map((item) => (
          <Link
            className={`portal-button portal-button-${item.variant ?? "secondary"}`}
            href={actionHref(item.section)}
            key={`${item.section}-${item.label}`}
          >
            {item.label}
          </Link>
        ))}
        {screen.kind === "list" && !screen.actions?.length && formScreen ? (
          <Link
            className="portal-button portal-button-primary"
            href={portalHref(role.slug, formScreen.section)}
          >
            Tambah
          </Link>
        ) : null}
      </div>}

      {screen.kind === "list" && role.slug !== "owner" ? (
        <form method="get" className="portal-form">
          <label className="portal-field">Cari Data<input name="q" type="search" placeholder="Nama, nomor, atau identitas" /></label>
          <button className="portal-button portal-button-secondary">Cari</button>
        </form>
      ) : null}

      {screen.kind === "list" ? (
        role.slug === "owner" && screen.section === "rekap-pelayanan" ? (
          <div className="portal-table-wrap owner-setup-card">
            <h2 className="owner-table-title">Daftar status kunjungan</h2>
            <form method="get" action={portalHref(role.slug, "rekap-pelayanan/hasil")}>
              <table className="portal-table owner-portal-table">
                <thead>
                  <tr>
                    <th scope="col">Data Rekap</th>
                    <th scope="col">Cakupan</th>
                    <th scope="col">Keterangan</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data kunjungan</td>
                    <td>
                      <div className="owner-inline-date-picker">
                        <input type="date" name="from" defaultValue={rows[0]?.values?.from} required aria-label="Tanggal Awal" />
                        <span>–</span>
                        <input type="date" name="to" defaultValue={rows[0]?.values?.to} required aria-label="Tanggal Akhir" />
                      </div>
                    </td>
                    <td>Jumlah seluruh kunjungan pasien pada periode tersebut</td>
                    <td>
                      <button type="submit" className="portal-button portal-button-primary">Tampilkan rekap</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
          </div>
        ) : role.slug === "owner" && screen.section === "laporan-klinik" ? (
          <div className="portal-table-wrap owner-setup-card">
            <h2 className="owner-table-title">Informasi laporan</h2>
            <form method="get" action={portalHref(role.slug, "laporan-klinik/hasil")}>
              <table className="portal-table owner-portal-table">
                <thead>
                  <tr>
                    <th scope="col">Pilihan</th>
                    <th scope="col">Cakupan</th>
                    <th scope="col">Keterangan</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <select name="category" defaultValue="Rekap pelayanan" aria-label="Pilihan">
                        <option value="Rekap pelayanan">Rekap pelayanan</option>
                        <option value="Kunjungan">Kunjungan</option>
                        <option value="Pemeriksaan">Pemeriksaan</option>
                        <option value="Pembayaran">Pembayaran</option>
                      </select>
                    </td>
                    <td>
                      <div className="owner-inline-date-picker">
                        <input type="date" name="from" defaultValue={rows[0]?.values?.from} required aria-label="Tanggal Awal" />
                        <span>–</span>
                        <input type="date" name="to" defaultValue={rows[0]?.values?.to} required aria-label="Tanggal Akhir" />
                      </div>
                    </td>
                    <td>Ringkasan jumlah dan status kunjungan pasien</td>
                    <td>
                      <button type="submit" className="portal-button portal-button-primary">Tampilkan laporan</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </form>
          </div>
        ) : (
          <>
          {role.slug === "owner" && screen.section === "rekap-pelayanan/hasil" ? (
            <div className="owner-result-summary">
              <div className="owner-metric-card-summary">
                <span>JUMLAH PASIEN</span>
                <strong>{rows[0]?.ownerRekapSummary?.patientCount ?? 0}</strong>
              </div>
              <div className="owner-metric-card-summary">
                <span>JUMLAH KUNJUNGAN</span>
                <strong>{rows[0]?.ownerRekapSummary?.visitCount ?? 0}</strong>
              </div>
              <div className="owner-metric-card-summary">
                <span>DATA PELAYANAN</span>
                <strong>{rows[0]?.ownerRekapSummary?.serviceCount ?? 0} jenis pelayanan</strong>
              </div>
              <div className="owner-metric-card-summary">
                <span>RINGKASAN KEUANGAN</span>
                <strong>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(rows[0]?.ownerRekapSummary?.totalRevenue ?? 0)}</strong>
              </div>
            </div>
          ) : null}
          {role.slug === "owner" && screen.section === "laporan-klinik/hasil" ? (
            <div className="owner-laporan-summary-3">
              <div className="owner-metric-card-summary">
                <span>JENIS LAPORAN</span>
                <strong>{rows[0]?.ownerLaporanSummary?.category ?? "Rekap pelayanan"}</strong>
              </div>
              <div className="owner-metric-card-summary">
                <span>Periode</span>
                <strong>{rows[0]?.ownerLaporanSummary?.periodLabel ?? "-"}</strong>
              </div>
              <div className="owner-metric-card-summary">
                <span>Ringkasan hasil</span>
                <strong>{rows[0]?.ownerLaporanSummary?.summaryText ?? "-"}</strong>
              </div>
            </div>
          ) : null}
          <div className="portal-table-wrap">
            {role.slug === "dokter" ? (
              <h2 className="doctor-table-title">
                {screen.parent === "kunjungan-pasien" ? "Kunjungan Yang Ditugaskan" : screen.parent === "jadwal-saya" ? "Jadwal Praktik Saya" : screen.parent === "rekam-medis" ? "Rekam Medis Pasien" : screen.parent === "resep" ? "Daftar Resep" : screen.title}
              </h2>
            ) : null}
            {role.slug === "perawat" && screen.parent === "status-kunjungan" ? <h2 className="nurse-table-title">Daftar status kunjungan</h2> : null}
            {role.slug === "owner" ? <h2 className="owner-table-title">{
              screen.section === "informasi-operasional" ? "Kategori informasi operasional"
              : screen.section === "informasi-operasional/kritik-pasien" ? "Daftar kritik"
              : screen.section === "rekap-pelayanan/hasil" ? "Rincian rekap status kunjungan"
              : screen.section === "laporan-klinik/hasil" ? "Rincian laporan klinik"
              : screen.title
            }</h2> : null}
            <table className={`portal-table${role.slug === "pasien" ? " patient-portal-table" : ""}${role.slug === "manajer-klinik" ? " manager-portal-table" : ""}${role.slug === "dokter" ? " doctor-portal-table" : ""}${role.slug === "perawat" ? " nurse-portal-table" : ""}${role.slug === "owner" ? " owner-portal-table" : ""}${role.slug === "manajer-klinik" && screen.parent === "data-pelayanan" ? " manager-service-table" : ""}`}>
              <thead>
                <tr>
                  {(screen.columns ?? []).map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataError ? (
                  <tr>
                    <td colSpan={screen.columns?.length ?? 1} role="alert">
                      {dataError}
                    </td>
                  </tr>
                ) : rows.length ? (
                  rows.map((item) => {
                    const columns = screen.columns ?? [];
                    const hasActionColumn = columns.at(-1)?.toLowerCase().includes("aksi") ?? false;
                    const valueColumns = hasActionColumn ? columns.length - 1 : columns.length;
                    const cells = item.cells.slice(0, valueColumns);
                    while (cells.length < valueColumns) cells.push("-");
                    return (
                      <tr key={item.id}>
                        {cells.map((cell, index) => (
                          <td key={`${item.id}-${index}`}>
                            {["dokter", "perawat"].includes(role.slug) && columns[index]?.toLowerCase().includes("status")
                              ? <span className={role.slug === "perawat" ? "nurse-status-pill" : "doctor-status-pill"}>{cell}</span>
                              : role.slug === "owner" && columns[index]?.toLowerCase().includes("status")
                                ? <span className={`status-pill status-${cell.toLowerCase().replaceAll(" ", "-")}`}>{cell}</span>
                                : cell}
                          </td>
                        ))}
                        {hasActionColumn ? (
                          <td>
                            {role.slug === "pasien" &&
                            screen.section === "konfirmasi-kedatangan" ? (
                              <form action={confirmArrivalAction}>
                                <input name="visitId" type="hidden" value={item.id} />
                                <button className="portal-button portal-button-primary" type="submit">
                                  Konfirmasi
                                </button>
                              </form>
                            ) : item.detailHref ? (
                              <div className="manager-table-actions">
                                <Link className="portal-button portal-button-secondary" href={item.detailHref}>
                                  {role.slug === "owner" && screen.section === "informasi-operasional" ? "Pilih" : "Detail"}
                                </Link>
                                {inlineEditScreen ? (
                                  <Link className="portal-button portal-button-secondary" href={`${portalHref(role.slug, inlineEditScreen.section)}?id=${encodeURIComponent(item.id)}`}>Edit</Link>
                                ) : null}
                              </div>
                            ) : "-" }
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={screen.columns?.length ?? 1}>
                      Belum ada data untuk ditampilkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {role.slug === "owner" && screen.section === "informasi-operasional" ? (
              <p className="owner-table-note">Pilih kategori untuk melihat informasi operasional yang tersedia, termasuk kritik dan saran pasien.</p>
            ) : null}
            {role.slug === "owner" && screen.section === "informasi-operasional/kritik-pasien" ? (
              <p className="owner-table-note">Tindak dan catat perbaikan sesuai masukan kritik dan saran yang masuk.</p>
            ) : null}
          </div>
          {role.slug === "owner" && visibleActions?.length ? (
            <div className="owner-bottom-actions">
              {visibleActions.map((item) => (
                <Link
                  className="portal-button portal-button-secondary"
                  href={actionHref(item.section)}
                  key={`${item.section}-${item.label}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
          </>
        )
      ) : null}

      {screen.kind === "form" ? (
        <ReviewForm
          action={formAction}
          className={`portal-form${screen.section === "booking-kunjungan/tambah" || screen.section === "booking-kunjungan/ubah" ? " booking-form" : ""}${role.slug === "manajer-klinik" ? " manager-portal-form" : ""}${role.slug === "dokter" ? " doctor-portal-form" : ""}`}
          saveLabel={screen.section === "booking-kunjungan/tambah" ? "Simpan Booking" : formSubmitLabel}
        >
          <input name="recordId" type="hidden" value={recordId ?? ""} />
          {screen.section === "rekam-medis/tambah" ? (
            <input name="visitId" type="hidden" value={recordId ?? ""} />
          ) : null}
          {screen.section === "rekam-medis/tambah/resep" ? (
            <input name="Rekam Medis" type="hidden" value={recordId ?? ""} />
          ) : null}
          {screen.section === "informasi-operasional/kritik-pasien/detail" ? (
            <input name="feedbackId" type="hidden" value={recordId ?? rows[0]?.id ?? ""} />
          ) : null}
          {screen.section === "status-kunjungan/ubah" ? (
            <input name="visitId" type="hidden" value={recordId ?? rows[0]?.id ?? ""} />
          ) : null}
          {screen.section === "booking-kunjungan/ubah" ? (
            <input name="visitId" type="hidden" value={recordId ?? ""} />
          ) : null}
          {role.slug === "dokter" && ["resep/tambah", "rekam-medis/tambah/resep"].includes(screen.section) ? (
            <p className="doctor-auto-number-note">Nomor resep dibuat otomatis dan berurutan saat resep disimpan.</p>
          ) : null}
          {role.slug === "dokter" && screen.section === "rekam-medis/tambah" && rows[0] ? (
            <section className="doctor-patient-context" aria-label="Pasien yang diperiksa">
              <div><span>Nama Pasien</span><strong>{rows[0].values?.["Nama Pasien"]}</strong></div>
              <div><span>ID Kunjungan</span><strong>{rows[0].id}</strong></div>
              <div><span>Layanan Booking</span><strong>{rows[0].values?.Layanan ?? "Belum dipilih"}</strong></div>
            </section>
          ) : null}
          {screen.section === "informasi-operasional/kritik-pasien/detail" && rows[0] ? (
            <div className="owner-feedback-summary">
              <div>
                <span>MASUKAN PASIEN</span>
                <strong>{rows[0].values?.["Masukan Pasien"] ?? rows[0].cells[1] ?? "-"}</strong>
              </div>
              <div>
                <span>TANGGAL PENGIRIMAN</span>
                <strong>{rows[0].values?.["Tanggal Pengiriman"] ?? rows[0].cells[0] ?? "-"}</strong>
              </div>
              <div>
                <span>STATUS TINDAK LANJUT</span>
                <strong>
                  <span className={`status-pill status-${(rows[0].values?.["Status Tindak Lanjut"] ?? "menunggu").toLowerCase().replaceAll(" ", "-")}`}>
                    {rows[0].values?.["Status Tindak Lanjut"] ?? "Menunggu"}
                  </span>
                </strong>
              </div>
            </div>
          ) : null}
          {role.slug === "owner" && screen.section === "informasi-operasional/kritik-pasien/detail" ? (
            <h2 className="owner-form-title">Catatan tindak lanjut</h2>
          ) : null}
          {role.slug === "perawat" &&
          screen.section === "status-kunjungan/ubah" &&
          rows[0] ? (
            <div className="portal-state-card">
              <p>Nama pasien: {rows[0].values?.["Nama Pasien"]}</p>
              <p>Nomor rekam medis: {rows[0].values?.["Nomor Rekam Medis"]}</p>
              <p>Waktu kunjungan: {rows[0].values?.["Waktu Kunjungan"]}</p>
              <p>Layanan: {rows[0].values?.Layanan}</p>
            </div>
          ) : null}
          {role.slug === "perawat" && screen.section === "status-kunjungan/tambah" ? (
            <NurseStatusFields visits={formOptions.Kunjungan ?? []} />
          ) : null}
          {(screen.fields ?? []).map((field) => {
            if (role.slug === "perawat" && screen.section === "status-kunjungan/tambah") return null;
            if (role.slug === "dokter" && screen.section === "rekam-medis/tambah" && field === "Tindakan") {
              return <DoctorTreatmentFields initialValue={rows[0]?.values?.Tindakan} key={field} options={formOptions.Tindakan ?? []} />;
            }
            if (
              role.slug === "pasien" &&
              ["booking-kunjungan/tambah", "booking-kunjungan/ubah"].includes(screen.section) &&
              (field === "Dokter" || field === "Jadwal Baru")
            ) {
              return (
                <BookingScheduleFields
                  doctors={field === "Dokter" ? formOptions.Dokter ?? [] : undefined}
                  initialDate={rows[0]?.values?.["Tanggal Kunjungan"]}
                  initialDoctorId={field === "Dokter" ? presetDoctorId : undefined}
                  initialScheduleId={
                    screen.section === "booking-kunjungan/ubah"
                      ? rows[0]?.values?.["Jadwal Baru"]
                      : presetSchedule?.value
                  }
                  initialTime={rows[0]?.values?.["Waktu Kunjungan"]}
                  key={field}
                  schedules={
                    formOptions[
                      screen.section === "booking-kunjungan/ubah"
                        ? "Jadwal Baru"
                        : "Jadwal Praktik"
                    ] ?? []
                  }
                  scheduleField={
                    screen.section === "booking-kunjungan/ubah"
                      ? "Jadwal Baru"
                      : "Jadwal Praktik"
                  }
                />
              );
            }
            if (
              role.slug === "pasien" &&
              ["booking-kunjungan/tambah", "booking-kunjungan/ubah"].includes(screen.section) &&
              ["Tanggal Kunjungan", "Waktu Kunjungan", "Jadwal Praktik"].includes(field)
            ) {
              return null;
            }
            const type = fieldType(field);
            const options = formOptions[field] ?? [];
            if (
              role.slug === "owner" &&
              screen.section === "informasi-operasional/kritik-pasien/detail" &&
              field === "Status Tindak Lanjut"
            ) {
              return (
                <label className="portal-field" key={field}>
                  <span>{field}</span>
                  <select
                    aria-label={field}
                    defaultValue={rows[0]?.values?.[field] ?? "Menunggu"}
                    name={field}
                    required
                  >
                    {["Menunggu", "Dalam Proses", "Belum ditindaklanjuti", "Selesai"].map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              );
            }
            if (
              role.slug === "pasien" &&
              ["booking-kunjungan/tambah", "booking-kunjungan/ubah"].includes(screen.section) &&
              field === "Jenis Layanan"
            ) {
              const selectedService = rows[0]?.values?.[field] ?? presetServiceId ?? "";
              const hasOtherService = options.some((option) => option.value === "__other__");
              return (
                <fieldset className="portal-service-options" key={field}>
                  <legend>Jenis Layanan</legend>
                  <div className="portal-service-option-grid">
                    {options.map((option) => (
                      <label className="portal-service-option" key={option.value}>
                        <input
                          defaultChecked={
                            option.value === "__other__"
                              ? selectedService === "__other__" || (!selectedService && hasOtherService)
                              : selectedService === option.value
                          }
                          name={field}
                          required
                          type="radio"
                          value={option.value}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                    {!hasOtherService ? (
                      <label className="portal-service-option">
                        <input
                          defaultChecked={!selectedService}
                          name={field}
                          required
                          type="radio"
                          value="__other__"
                        />
                        <span>Lainnya (jelaskan pada keluhan awal; tarif ditentukan setelah pemeriksaan)</span>
                      </label>
                    ) : null}
                  </div>
                  {!options.length ? (
                    <p className="portal-notice">Belum ada jenis pelayanan terdaftar; pilih “Lainnya” dan jelaskan pada keluhan awal.</p>
                  ) : null}
                </fieldset>
              );
            }
            return (
              <label className="portal-field" key={field}>
                <span>{field}</span>
                {options.length ? (
                  <select
                    defaultValue={
                      screen.section === "resep/tambah" && field === "Rekam Medis"
                        ? recordId ?? rows[0]?.values?.[field] ?? ""
                        : rows[0]?.values?.[field] ?? ""
                    }
                    name={field}
                    aria-label={field}
                    required
                  >
                    <option disabled value="">
                      Pilih {field.toLowerCase()}
                    </option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : type === "textarea" ? (
                  <textarea
                    defaultValue={rows[0]?.values?.[field]}
                    name={field}
                    aria-label={field}
                    required={!["Catatan", "Catatan Pemeriksaan", "Bukti Pembayaran"].includes(field)}
                    rows={3}
                  />
                ) : type === "time" ? (
                  <input
                    autoComplete="off"
                    defaultValue={rows[0]?.values?.[field]}
                    inputMode="numeric"
                    maxLength={5}
                    name={field}
                    pattern="(?:[01][0-9]|2[0-3]):[0-5][0-9]"
                    placeholder="JJ:MM (24 jam)"
                    aria-label={field}
                    required
                    title="Gunakan format 24 jam, contoh 09:30."
                    type="text"
                  />
                ) : (
                  <input
                    autoComplete="off"
                    defaultValue={
                      ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section) &&
                      field === "Status Saat Ini"
                        ? rows[0]?.values?.[field] ?? rows[0]?.cells.at(-1)
                        : rows[0]?.values?.[field]
                    }
                    name={field}
                    readOnly={
                      ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section) &&
                      field === "Status Saat Ini"
                    }
                    type={type}
                    required={!["Catatan", "Catatan Pemeriksaan", "Bukti Pembayaran"].includes(field)}
                    accept={type === "file" ? ".png,.jpg,.jpeg,.pdf" : undefined}
                  />
                )}
              </label>
            );
          })}
          {role.slug === "owner" && screen.section === "informasi-operasional/kritik-pasien/detail" ? (
            <div className="portal-form-actions owner-form-actions">
              <button
                className="portal-button portal-button-primary"
                disabled={formNeedsRecordId && !recordId}
                type="submit"
              >
                Simpan tindak lanjut
              </button>
              <Link className="portal-button portal-button-secondary" href={portalHref(role.slug, "informasi-operasional/kritik-pasien")}>Kembali ke daftar</Link>
              <Link className="portal-button portal-button-secondary" href={portalHref(role.slug, "")}>Menu utama</Link>
            </div>
          ) : (
            <div className="portal-form-actions">
              <Link className="portal-button portal-button-secondary" href={parentHref}>Batal</Link>
              {formAction ? (
                <button
                  className="portal-button portal-button-primary"
                  disabled={formNeedsRecordId && !recordId}
                  type="submit"
                >
                  {formSubmitLabel}
                </button>
              ) : null}
            </div>
          )}
        </ReviewForm>
      ) : null}

      {screen.kind === "review" ? (
        <div className={`portal-state-card${role.slug === "dokter" ? " doctor-state-card" : ""}`}>
          <p>Pemeriksaan data dilakukan pada dialog konfirmasi di formulir sebelumnya.</p>
          <Link
            className="portal-button portal-button-secondary"
            href={parentHref}
          >
            Kembali
          </Link>
        </div>
      ) : null}

      {screen.kind === "detail" || screen.kind === "confirmation" || screen.kind === "status" ? (
        role.slug === "manajer-klinik" && screen.kind === "detail" ? (
          rows[0] ? (
            <div className={`manager-detail-layout${screen.section === "pembayaran/verifikasi" ? " manager-payment-detail-layout" : ""}`}>
              <article className={`manager-detail-card${screen.section === "pembayaran/verifikasi" ? " manager-payment-summary" : ""}`}>
                <p className="manager-detail-eyebrow">
                  {screen.parent === "pembayaran"
                    ? `Pembayaran · ${rows[0].id}`
                    : `ID Data · ${rows[0].id}`}
                </p>
                <h2>{screen.section === "pembayaran/verifikasi" ? "Ringkasan Pembayaran" : screen.title}</h2>
                {screen.section === "pembayaran/verifikasi" ? (
                  <>
                    <dl className="manager-detail-list">
                      {[
                        ["Nama Pasien", rows[0].values?.["Nama Pasien"]],
                        ["Nomor Telepon", rows[0].values?.["Nomor Telepon"]],
                        ["Layanan", rows[0].values?.Layanan],
                        ["Dokter", rows[0].values?.Dokter],
                        ["Tanggal Layanan", rows[0].values?.["Tanggal Layanan"]],
                        ["Tanggal Pembayaran", rows[0].values?.["Tanggal Pembayaran"]],
                        ["Metode Pembayaran", rows[0].values?.["Metode Pembayaran"]],
                        ["Status Pembayaran", rows[0].values?.["Status Pembayaran"]],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || "-"}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="manager-detail-total">
                      <strong>Total pembayaran</strong>
                      <span>{rows[0].values?.["Total Tagihan"] ?? rows[0].cells[2]}</span>
                    </div>
                  </>
                ) : screen.section === "pengajuan-registrasi/detail" ? (
                  <dl className="manager-detail-list">
                    {Object.entries(rows[0].values ?? {}).map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value || "-"}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <dl className="manager-detail-list">
                    {(screen.columns ?? []).map((label, index) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{rows[0].cells[index] || "-"}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
              <aside className={`manager-detail-actions${screen.section === "pembayaran/verifikasi" ? " manager-payment-actions" : ""}`}>
                {screen.section === "pembayaran/verifikasi" ? (
                  <>
                    <h2>Bukti Pembayaran</h2>
                    <section className="manager-proof-card">
                      {rows[0].values?.bukti === "ada" ? (
                        <>
                          <div className="manager-proof-preview manager-proof-file-preview">
                            <object
                              aria-label={`Pratinjau bukti pembayaran ${rows[0].values?.["Nama File Bukti"] ?? ""}`}
                              data={`/api/pembayaran/${encodeURIComponent(rows[0].id)}/bukti?preview=1`}
                              type={rows[0].values?.["Jenis File Bukti"]}
                            >
                              <div className="manager-proof-fallback">
                                <Image
                                  src="/figma/manager-payment-proof.svg"
                                  alt=""
                                  width={42}
                                  height={42}
                                />
                                <p>Pratinjau tidak tersedia pada browser ini.</p>
                              </div>
                            </object>
                            <span className="manager-proof-filename">{rows[0].values?.["Nama File Bukti"]}</span>
                          </div>
                          <dl>
                            <div>
                              <dt>Jenis file</dt>
                              <dd>{rows[0].values?.["Jenis File Bukti"]}</dd>
                            </div>
                            <div>
                              <dt>Diunggah</dt>
                              <dd>{rows[0].values?.["Waktu Unggah Bukti"]}</dd>
                            </div>
                          </dl>
                          <a
                            className="portal-button portal-button-secondary"
                            href={`/api/pembayaran/${encodeURIComponent(rows[0].id)}/bukti`}
                          >
                            Unduh Bukti Pembayaran
                          </a>
                        </>
                      ) : (
                        <div className="manager-proof-preview">
                          <p>Pasien belum mengunggah bukti pembayaran.</p>
                        </div>
                      )}
                    </section>
                    {rows[0].values?.status === "2" ? (
                      <form action={verifyPaymentAction} className="manager-payment-decisions">
                        <input name="recordId" type="hidden" value={rows[0].id} />
                        <button className="portal-button portal-button-primary" name="decision" type="submit" value="approve">
                          Terima Pembayaran
                        </button>
                        <button className="portal-button portal-button-danger" name="decision" type="submit" value="reject">
                          Tolak Bukti
                        </button>
                      </form>
                    ) : (
                      <p className="portal-notice">
                        Pembayaran ini berstatus {rows[0].values?.["Status Pembayaran"] ?? "tidak diketahui"} dan tidak menunggu verifikasi.
                      </p>
                    )}
                  </>
                ) : screen.section === "pengajuan-registrasi/detail" ? (
                  <form action={reviewPatientRegistrationAction} className="manager-detail-action-list">
                    <input name="accountId" type="hidden" value={rows[0].id} />
                    <button className="portal-button portal-button-primary" name="decision" type="submit" value="approve">
                      Setujui Registrasi
                    </button>
                    <button className="portal-button portal-button-secondary" name="decision" type="submit" value="improvement">
                      Minta Perbaikan
                    </button>
                    <button className="portal-button portal-button-danger" name="decision" type="submit" value="reject">
                      Tolak Registrasi
                    </button>
                  </form>
                ) : screen.section === "kunjungan-pasien/detail" && rows[0].values?.["Status Saat Ini"] === "Menunggu" ? (
                  <form action={reviewBookingAction} className="manager-detail-action-list">
                    <input name="visitId" type="hidden" value={rows[0].id} />
                    <button className="portal-button portal-button-primary" name="decision" type="submit" value="approve">
                      Konfirmasi Booking
                    </button>
                    <button className="portal-button portal-button-danger" name="decision" type="submit" value="reject">
                      Tolak Booking
                    </button>
                  </form>
                ) : (
                  visibleActions?.map((item) => (
                    <Link
                      className={`portal-button portal-button-${item.variant ?? "secondary"}`}
                      href={actionHref(item.section)}
                      key={`${item.section}-${item.label}`}
                    >
                      {item.label}
                    </Link>
                  ))
                )}
                <Link className="portal-button portal-button-secondary" href={parentHref}>
                  Kembali ke Daftar
                </Link>
              </aside>
            </div>
          ) : (
            <div className="portal-state-card">
              <p>{dataError ?? "Data tidak ditemukan atau sudah tidak tersedia."}</p>
              <Link className="portal-button portal-button-secondary" href={parentHref}>
                Kembali ke Daftar
              </Link>
            </div>
          )
        ) : role.slug === "dokter" && screen.kind === "detail" ? (
          rows[0] ? (
            <div className={`doctor-detail-layout doctor-detail-${screen.parent}`}>
              <article className="doctor-detail-card">
                <h2>{screen.parent === "kunjungan-pasien" ? "Ringkasan Pasien" : screen.parent === "resep" ? "Informasi Resep" : screen.parent === "rekam-medis" ? "Catatan Rekam Medis" : screen.title}</h2>
                <dl className="doctor-detail-list">
                  {(screen.columns ?? []).map((label, index) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{rows[0].cells[index] || "-"}</dd>
                    </div>
                  ))}
                </dl>
              </article>
              <aside className="doctor-detail-side">
                {screen.parent === "rekam-medis" ? (
                  <section className="doctor-detail-info">
                    <h2>Informasi Rekam Medis</h2>
                    <p>Catatan ini memuat hasil pemeriksaan dan tindakan. Resep disimpan terhubung dengan rekam medis.</p>
                  </section>
                ) : null}
                <div className="doctor-detail-actions">
                  {screen.parent === "kunjungan-pasien" ? (
                    <Link className="portal-button portal-button-secondary" href={`${portalHref(role.slug, "riwayat-pasien")}?q=${encodeURIComponent(rows[0].values?.["Nama Pasien"] ?? "")}`}>Lihat Riwayat</Link>
                  ) : null}
                  {visibleActions?.map((item) => (
                    <Link className={`portal-button portal-button-${item.variant ?? "secondary"}`} href={actionHref(item.section)} key={`${item.section}-${item.label}`}>{item.label}</Link>
                  ))}
                  <Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar</Link>
                </div>
              </aside>
            </div>
          ) : (
            <div className="doctor-empty-detail"><p>Data tidak ditemukan atau sudah tidak tersedia.</p><Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar</Link></div>
          )
        ) : role.slug === "perawat" && screen.kind === "detail" ? (
          rows[0] ? (
            <div className="nurse-detail-layout">
              <article className="nurse-detail-card">
                <h2>Informasi Kunjungan</h2>
                <dl className="nurse-detail-list">
                  {(screen.columns ?? []).map((label, index) => (
                    <div key={label}><dt>{label}</dt><dd>{rows[0].cells[index] || "-"}</dd></div>
                  ))}
                </dl>
              </article>
              <aside className="nurse-detail-actions">
                <h2>Tindakan Status</h2>
                <p>Periksa status kunjungan sebelum melakukan perubahan atau penghapusan.</p>
                <div>
                  {visibleActions?.map((item) => (
                    <Link className={`portal-button portal-button-${item.variant ?? "secondary"}`} href={actionHref(item.section)} key={`${item.section}-${item.label}`}>{item.label}</Link>
                  ))}
                  <Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar</Link>
                </div>
              </aside>
            </div>
          ) : (
            <div className="portal-state-card"><p>Data tidak ditemukan atau sudah tidak tersedia.</p><Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar</Link></div>
          )
        ) : role.slug === "pasien" && screen.kind === "detail" && rows[0] ? (
          screen.section === "pembayaran/detail" ? (
            <div className="patient-detail-layout">
              <article className="patient-detail-card patient-bill-detail">
                <p className="patient-eyebrow">Tagihan · {rows[0].id}</p>
                <h2>{rows[0].values?.Layanan ?? "Tagihan klinik"}</h2>
                <dl className="patient-detail-list">
                  {[
                    ["Tanggal layanan", rows[0].values?.["Tanggal Layanan"] ?? "-"],
                    ["Dokter", rows[0].values?.Dokter ?? "-"],
                    ["Status", rows[0].values?.["Status Pembayaran"] ?? "-"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="patient-bill-total">
                  <strong>Total tagihan</strong>
                  <span>{rows[0].values?.["Total Tagihan"] ?? rows[0].cells[2]}</span>
                </div>
              </article>
              <aside className="patient-detail-actions">
                <h2>{rows[0].values?.status === "3" ? "Bukti pembayaran ditolak" : "Pilih metode pembayaran"}</h2>
                {rows[0].values?.status === "3" ? (
                  <p>Periksa kembali bukti pembayaran. Unggah bukti baru yang jelas dan sesuai dengan total tagihan.</p>
                ) : rows[0].values?.status === "2" ? (
                  <p>Bukti pembayaran sedang menunggu verifikasi dari petugas klinik.</p>
                ) : rows[0].values?.status === "1" ? (
                  <p>Pembayaran telah diterima. Terima kasih.</p>
                ) : (
                  <p>Pilih pembayaran tunai di kasir atau transfer bank untuk melunasi tagihan ini.</p>
                )}
                {visibleActions?.map((item) => (
                  <Link
                    className={`portal-button portal-button-${item.variant ?? "secondary"}`}
                    href={actionHref(item.section)}
                    key={`${item.section}-${item.label}`}
                  >
                    {rows[0].values?.status === "3" ? "Unggah Ulang Bukti Pembayaran" : item.label}
                  </Link>
                ))}
                <Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar Tagihan</Link>
              </aside>
            </div>
          ) : (
            <div className="patient-detail-layout">
              <article className="patient-detail-card">
                <h2>{screen.section === "booking-kunjungan/detail" ? "Informasi kunjungan" : screen.title}</h2>
                <dl className="patient-detail-list">
                  {(screen.columns ?? []).map((label, index) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{rows[0].cells[index] ?? "-"}</dd>
                    </div>
                  ))}
                  {screen.section === "booking-kunjungan/detail" && rows[0].values?.["Keluhan Awal"] ? (
                    <div className="patient-detail-notes">
                      <dt>Keluhan awal</dt>
                      <dd>{rows[0].values["Keluhan Awal"]}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
              <aside className="patient-detail-actions">
                <h2>Tindakan</h2>
                {visibleActions?.map((item) => (
                  <Link
                    className={`portal-button portal-button-${item.variant ?? "secondary"}`}
                    href={actionHref(item.section)}
                    key={`${item.section}-${item.label}`}
                  >
                    {item.label}
                  </Link>
                ))}
                {screen.section === "booking-kunjungan/detail" &&
                rows[0].values?.["Status Saat Ini"] === "Menunggu" ? (
                  <form action={confirmArrivalAction}>
                    <input name="visitId" type="hidden" value={rows[0].id} />
                    <button className="portal-button portal-button-secondary" type="submit">
                      Konfirmasi Kedatangan
                    </button>
                  </form>
                ) : null}
                <Link className="portal-button portal-button-secondary" href={parentHref}>Kembali ke Daftar</Link>
              </aside>
            </div>
          )
        ) : role.slug === "pasien" && screen.section === "pembayaran/ditolak" ? (
          <div className="patient-rejected-state">
            <span className="patient-rejected-icon" aria-hidden="true">!</span>
            <h2>Status Pembayaran Ditolak</h2>
            <p>Periksa kembali bukti pembayaran Anda. Anda dapat melihat tagihan dan mengunggah ulang bukti pembayaran yang sesuai.</p>
            <Link className="portal-button portal-button-primary" href={parentHref}>Lihat Daftar Tagihan Terbaru</Link>
          </div>
        ) : (
        <div className="portal-state-card">
          {dataError ? <p role="alert">{dataError}</p> : null}
          {rows.length ? (
            <dl className="portal-record">
              {rows[0].cells.map((value, index) => (
                <div key={`${rows[0].id}-${index}`}>
                  <dt>{screen.columns?.[index] ?? `Data ${index + 1}`}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>
              {screen.kind === "confirmation"
                ? "Periksa kembali data sebelum mengonfirmasi tindakan."
                : screen.kind === "status"
                  ? screen.description
                : "Pilih data dari daftar untuk melihat rinciannya."}
            </p>
          )}
          <Link
            className="portal-button portal-button-secondary"
            href={parentHref}
          >
            Kembali
          </Link>
          {screen.kind === "detail" && screen.parent === "pembayaran" && rows[0] ? (
            <div className="portal-action-row">
              {rows[0].values?.bukti === "ada" ? <a className="portal-button portal-button-secondary" href={`/api/pembayaran/${encodeURIComponent(rows[0].id)}/bukti`}>Unduh Bukti Pembayaran</a> : null}
              {role.slug === "manajer-klinik" && rows[0].values?.status === "2" ? <form action={verifyPaymentAction}>
                <input type="hidden" name="recordId" value={rows[0].id} />
                <button className="portal-button portal-button-primary" name="decision" value="approve">Bukti Valid / Pembayaran Diterima</button>
                <button className="portal-button portal-button-danger" name="decision" value="reject">Bukti Tidak Valid</button>
              </form> : null}
            </div>
          ) : null}
          {screen.kind === "confirmation" && ["informasi-klinik/hapus", "data-pelayanan/hapus", "booking-kunjungan/hapus", "resep/hapus", "rekam-medis/hapus", "status-kunjungan/hapus"].includes(screen.section) ? (
            <form action={deleteWorkflowAction.bind(null, role.slug, screen.section)}>
              <input type="hidden" name="recordId" value={recordId ?? ""} />
              <button className="portal-button portal-button-danger" disabled={!recordId}>Konfirmasi Hapus</button>
            </form>
          ) : null}
          {role.slug === "manajer-klinik" &&
          screen.section === "pengajuan-registrasi/detail" &&
          rows[0] ? (
            <form action={reviewPatientRegistrationAction} className="portal-action-row">
              <input name="accountId" type="hidden" value={rows[0].id} />
              <button className="portal-button portal-button-primary" name="decision" type="submit" value="approve">
                Setujui Registrasi
              </button>
              <button className="portal-button portal-button-secondary" name="decision" type="submit" value="improvement">
                Minta Perbaikan
              </button>
              <button className="portal-button portal-button-danger" name="decision" type="submit" value="reject">
                Tolak Registrasi
              </button>
            </form>
          ) : null}
          {role.slug === "manajer-klinik" &&
          screen.kind === "confirmation" &&
          ["data-pasien/hapus", "data-dokter/hapus", "jadwal-dokter/hapus"].includes(screen.section) ? (
            <form action={deletePortalRecordAction}>
              <input name="section" type="hidden" value={screen.section} />
              <input name="recordId" type="hidden" value={recordId ?? ""} />
              <button
                className="portal-button portal-button-danger"
                disabled={!recordId}
                type="submit"
              >
                Hapus Data
              </button>
            </form>
          ) : null}
              {screen.kind === "confirmation" &&
              role.slug === "pasien" &&
              screen.section === "booking-kunjungan/dibatalkan" ? (
                <form action={cancelBookingAction}>
                  <input name="visitId" type="hidden" value={recordId ?? ""} />
                  <button
                    className="portal-button portal-button-danger"
                    disabled={!recordId}
                    type="submit"
                  >
                    Konfirmasi Pembatalan
                  </button>
                </form>
              ) : null}
        </div>
        )
      ) : null}
    </section>
  );
}

export function RoleDashboard({
  role,
  screen,
  identity,
  rows,
  dataError,
  error,
  formOptions,
  recordId,
}: RoleDashboardProps) {
  const activeSection =
    role.screens.find((candidate) => candidate.section === screen.section)
      ?.section ?? screen.section;

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <Image
          alt=""
          aria-hidden="true"
          className="sidebar-brand-decoration"
          height={125}
          src="/figma/sidebar-brand-decoration.svg"
          width={250}
        />
        <Link aria-label="Kembali ke Beranda" href="/">
          <Image
            alt="Praya Dental Care"
            className="sidebar-logo"
            height={100}
            priority
            src="/figma/praya-logo.png"
            width={110}
          />
        </Link>

        <nav aria-label="Menu utama" className="sidebar-navigation">
          <p className="navigation-label">{role.slug === "pasien" ? "MENU PASIEN" : "MENU UTAMA"}</p>
          <ul className="navigation-list">
            {role.menu.map((item) => {
              const active = isActive(item.section, activeSection);
              return (
                <li
                  className={`navigation-item${active ? " is-active" : ""}`}
                  key={item.section || "dashboard"}
                >
                  <Link
                    aria-current={active ? "page" : undefined}
                    href={portalHref(role.slug, item.section)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button type="submit">Keluar</button>
          </form>
        </div>
        <Image
          alt=""
          aria-hidden="true"
          className="sidebar-decoration"
          height={200}
          src="/figma/sidebar-decoration.svg"
          width={250}
        />
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div className={`page-heading${role.slug === "pasien" && screen.kind === "dashboard" ? " patient-dashboard-heading" : ""}`}>
            <h1>{role.slug === "pasien" && screen.kind === "dashboard" ? `Selamat datang, ${identity.displayName}` : screen.title}</h1>
            <p>{role.slug === "pasien" && screen.kind === "dashboard" ? "Berikut ringkasan jadwal dan aktivitas perawatan gigimu." : screen.description}</p>
          </div>
          <div className="account-pill">
            <Image
              alt=""
              className="account-avatar"
              height={42}
              src="/figma/user-avatar.svg"
              width={42}
            />
            <span className="account-initial" aria-hidden="true">
              {role.initials}
            </span>
            <div className="account-details">
              <span className="account-name">{identity.displayName}</span>
              <span className="account-role">{role.label}</span>
            </div>
          </div>
        </header>
        <PortalPageContent
          role={role}
          screen={screen}
          rows={rows}
          dataError={dataError}
          error={error}
          formOptions={formOptions}
          recordId={recordId}
        />
      </main>
    </div>
  );
}
