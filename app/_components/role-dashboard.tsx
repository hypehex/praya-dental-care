import { ReviewForm } from "./review-form";
import { BookingScheduleFields } from "./booking-schedule-fields";
import { saveCatalogAction, deleteWorkflowAction, updateClinicalAction, submitPaymentAction, verifyPaymentAction } from "../_lib/module4-actions";
import Image from "next/image";
import Link from "next/link";
import type { PortalRole, PortalScreen } from "../_lib/portal-config";
import { portalHref } from "../_lib/portal-config";
import type { UserSession } from "../_lib/auth";
import { logoutAction } from "../_lib/auth-actions";
import {
  confirmArrivalAction,
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
  const reviewScreen = role.screens.find(
    (candidate) =>
      candidate.kind === "review" &&
      candidate.parent === screen.parent &&
      candidate.section.startsWith(`${screen.section}/`),
  );
  const formScreen = role.screens.find(
    (candidate) =>
      candidate.kind === "form" &&
      candidate.parent === screen.parent &&
      candidate.section.startsWith(`${screen.parent}/`),
  );
  const formAction =
    role.slug === "manajer-klinik" && /^(informasi-klinik|data-pelayanan)\/(tambah|edit)$/.test(screen.section)
      ? saveCatalogAction.bind(null, screen.section)
      : role.slug === "dokter" && ["rekam-medis/edit", "resep/edit"].includes(screen.section)
        ? updateClinicalAction.bind(null, screen.section)
        : role.slug === "pasien" && screen.section === "pembayaran/transfer"
          ? submitPaymentAction
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
                ["rekam-medis/tambah", "resep/tambah"].includes(screen.section)
              ? savePortalFormAction.bind(null, role.slug, screen.section)
              : role.slug === "perawat" &&
                  ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section)
                ? savePortalFormAction.bind(null, role.slug, screen.section)
                : undefined;
  const errorMessage =
    error === "in-use" ? "Data masih digunakan atau statusnya tidak mengizinkan penghapusan."
      : error === "file" ? "Pilih bukti PNG, JPG, atau PDF yang valid, maksimum 3 MB."
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
                      : screen.section === "informasi-operasional/kritik-pasien/detail" ? "Simpan Tindak Lanjut" : "Simpan";
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
        screen.section === "data-dokter/detail") ||
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
  const formNeedsRecordId = /\/(edit|transfer)$/.test(screen.section) ||
    (role.slug === "manajer-klinik" &&
      ["data-pasien/edit", "data-dokter/edit", "jadwal-dokter/edit"].includes(screen.section)) ||
    (role.slug === "pasien" && screen.section === "booking-kunjungan/ubah") ||
    (role.slug === "dokter" && screen.section === "rekam-medis/tambah") ||
    (role.slug === "perawat" &&
      ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section)) ||
    (role.slug === "owner" &&
      screen.section === "informasi-operasional/kritik-pasien/detail");
  const visibleActions = screen.actions?.filter(() => {
    if (role.slug !== "pasien" || screen.section !== "booking-kunjungan/detail") {
      if (role.slug !== "pasien" || screen.section !== "pembayaran/detail") {
        return true;
      }
      return ["0", "3"].includes(rows[0]?.values?.status ?? "");
    }
    return ["Menunggu", "Dikonfirmasi"].includes(
      rows[0]?.values?.["Status Saat Ini"] ?? "",
    );
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
    return (
      <section className="portal-overview" aria-label="Navigasi fitur">
        {errorMessage ? <p className="portal-notice" role="alert">{errorMessage}</p> : null}
        <p className="portal-notice">Selamat datang di Praya Dental Care, {role.label}.</p>
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
      {role.slug === "pasien" && screen.kind === "detail" ||
      role.slug === "manajer-klinik" && screen.kind === "detail" ? null : <div className="portal-action-row">
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

      {screen.kind === "list" ? <form method="get" className="portal-form">
        {role.slug === "owner" && /^(rekap-pelayanan|laporan-klinik)/.test(screen.section) ? <>
          <label className="portal-field">Tanggal Awal<input name="from" type="date" required /></label>
          <label className="portal-field">Tanggal Akhir<input name="to" type="date" required /></label>
          <label className="portal-field">Jenis Laporan<select name="category">{["Semua", "Kunjungan", "Pemeriksaan", "Rekam Medis", "Resep", "Pembayaran"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="portal-button portal-button-primary">Tampilkan</button>
        </> : <>
          <label className="portal-field">Cari Data<input name="q" type="search" placeholder="Nama, nomor, atau identitas" /></label>
          <button className="portal-button portal-button-secondary">Cari</button>
        </>}
      </form> : null}
      {screen.kind === "list" ? (
        <>
        <div className="portal-table-wrap">
          <table className={`portal-table${role.slug === "pasien" ? " patient-portal-table" : ""}${role.slug === "manajer-klinik" ? " manager-portal-table" : ""}${role.slug === "manajer-klinik" && screen.parent === "data-pelayanan" ? " manager-service-table" : ""}`}>
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
                        <td key={`${item.id}-${index}`}>{cell}</td>
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
                            <Link
                              className="portal-button portal-button-secondary"
                              href={item.detailHref}
                            >
                              Detail
                            </Link>
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
        </div>
        </>
      ) : null}

      {screen.kind === "form" ? (
        <ReviewForm
          action={formAction}
          className={`portal-form${screen.section === "booking-kunjungan/tambah" || screen.section === "booking-kunjungan/ubah" ? " booking-form" : ""}${role.slug === "manajer-klinik" ? " manager-portal-form" : ""}`}
          saveLabel={screen.section === "booking-kunjungan/tambah" ? "Simpan Booking" : "Simpan"}
        >
          <input name="recordId" type="hidden" value={recordId ?? ""} />
          {screen.section === "rekam-medis/tambah" ? (
            <input name="visitId" type="hidden" value={recordId ?? ""} />
          ) : null}
          {screen.section === "informasi-operasional/kritik-pasien/detail" ? (
            <input name="feedbackId" type="hidden" value={recordId ?? rows[0]?.id ?? ""} />
          ) : null}
          {["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section) ? (
            <input name="visitId" type="hidden" value={recordId ?? rows[0]?.id ?? ""} />
          ) : null}
          {screen.section === "booking-kunjungan/ubah" ? (
            <input name="visitId" type="hidden" value={recordId ?? ""} />
          ) : null}
          {screen.section === "informasi-operasional/kritik-pasien/detail" && rows[0] ? (
            <div className="portal-state-card">
              <p>{rows[0].cells[2]}</p>
              <p>Status tindak lanjut: {rows[0].cells[3]}</p>
              {rows[0].cells[4] ? <p>Catatan: {rows[0].cells[4]}</p> : null}
            </div>
          ) : null}
          {role.slug === "perawat" &&
          ["status-kunjungan/tambah", "status-kunjungan/ubah"].includes(screen.section) &&
          rows[0] ? (
            <div className="portal-state-card">
              <p>Nama pasien: {rows[0].values?.["Nama Pasien"]}</p>
              <p>Nomor rekam medis: {rows[0].values?.["Nomor Rekam Medis"]}</p>
              <p>Waktu kunjungan: {rows[0].values?.["Waktu Kunjungan"]}</p>
              <p>Layanan: {rows[0].values?.Layanan}</p>
            </div>
          ) : null}
          {(screen.fields ?? []).map((field) => {
            if (
              role.slug === "pasien" &&
              ["booking-kunjungan/tambah", "booking-kunjungan/ubah"].includes(screen.section) &&
              (field === "Dokter" || field === "Jadwal Baru")
            ) {
              return (
                <BookingScheduleFields
                  doctors={field === "Dokter" ? formOptions.Dokter ?? [] : undefined}
                  initialDate={rows[0]?.values?.["Tanggal Kunjungan"]}
                  initialDoctorId={field === "Dokter" ? recordId : undefined}
                  initialScheduleId={
                    screen.section === "booking-kunjungan/ubah"
                      ? rows[0]?.values?.["Jadwal Baru"]
                      : undefined
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
              const selectedService = rows[0]?.values?.[field] ?? "";
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
          {!formAction && !reviewScreen ? (
            <p className="portal-notice">
              Tindakan ini belum terhubung ke struktur data yang tersedia.
            </p>
          ) : null}
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
          ) : reviewScreen ? (
            <button className="portal-button portal-button-disabled" disabled type="button">
              Periksa Kembali
            </button>
          ) : (
            <button className="portal-button portal-button-disabled" disabled type="button">
              Simpan
            </button>
          )}
          </div>
        </ReviewForm>
      ) : null}

      {screen.kind === "review" ? (
        <div className="portal-state-card">
          <p>Data dari formulir sebelumnya tidak tersimpan pada halaman ini.</p>
          <Link
            className="portal-button portal-button-secondary"
            href={parentHref}
          >
            Kembali
          </Link>
          <button className="portal-button portal-button-disabled" disabled type="button">
            Simpan
          </button>
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
                          <div className="manager-proof-preview">
                            <Image
                              src="/figma/manager-payment-proof.svg"
                              alt=""
                              width={42}
                              height={42}
                            />
                            <span>{rows[0].values?.["Nama File Bukti"]}</span>
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
              ) : screen.kind === "confirmation" ? (
                <button className="portal-button portal-button-disabled" disabled type="button">
                  Konfirmasi
                </button>
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
