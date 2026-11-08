import { paymentStatuses } from "../../../_lib/workflow";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "../../../_lib/auth-actions";
import { isDatabaseUnavailable, requireRoleSession } from "../../../_lib/auth";
import { prisma } from "../../../_lib/prisma";

const menuItems = [
  { label: "Dashboard", href: "/dashboard/pasien" },
  { label: "Booking & Kunjungan", href: "/dashboard/pasien/booking-kunjungan" },
  { label: "Data Dokter", href: "/dashboard/pasien/data-dokter" },
  { label: "Konfirmasi Kedatangan", href: "/dashboard/pasien/konfirmasi-kedatangan" },
  { label: "Jadwal Dokter", href: "/dashboard/pasien/jadwal-dokter" },
  { label: "Pembayaran", href: "/dashboard/pasien/pembayaran" },
  { label: "Kritik & Saran", href: "/dashboard/pasien/kritik-saran" },
];

const paymentExamples = [
  {
    key: "belum-dibayar",
    id: "CONTOH-TG-001",
    status: 0,
    amount: 300000,
    title: "Belum dibayar",
    description: "Tagihan masih perlu dibayar. Pilih pembayaran tunai di kasir atau transfer bank.",
  },
  {
    key: "menunggu-verifikasi",
    id: "CONTOH-TG-002",
    status: 2,
    amount: 300000,
    title: "Menunggu verifikasi",
    description: "Bukti transfer sudah dikirim dan sedang diperiksa oleh petugas klinik.",
  },
  {
    key: "ditolak",
    id: "CONTOH-TG-003",
    status: 3,
    amount: 300000,
    title: "Ditolak",
    description: "Bukti perlu diperiksa dan diunggah ulang pada tagihan yang sebenarnya.",
  },
  {
    key: "lunas",
    id: "CONTOH-TG-004",
    status: 1,
    amount: 300000,
    title: "Lunas",
    description: "Pembayaran sudah diterima oleh klinik.",
  },
] as const;

export const instant = false;

export const metadata: Metadata = {
  title: "Pembayaran | Praya Dental Care",
  description: "Lihat tagihan dan status pembayaran Anda di Praya Dental Care.",
};

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ contoh?: string | string[] }>;
}) {
  const identity = await requireRoleSession("pasien");
  const { contoh } = await searchParams;
  const example = typeof contoh === "string"
    ? paymentExamples.find((item) => item.key === contoh)
    : undefined;
  let payments: {
    id_pembayaran: string;
    jumlah_pembayaran: number;
    tanggal_pembayaran: Date;
    status_pembayaran: number;
  }[] = [];
  let databaseUnavailable = false;
  try {
    const records = await prisma.pembayaran.findMany({
      where: { id_pasien: identity.profileId },
      select: {
        id_pembayaran: true,
        jumlah_pembayaran: true,
        tanggal_pembayaran: true,
        status_pembayaran: true,
      },
      orderBy: { tanggal_pembayaran: "desc" },
    });
    payments = records.map((payment) => ({
      ...payment,
      jumlah_pembayaran: Number(payment.jumlah_pembayaran),
    }));
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    databaseUnavailable = true;
  }

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
        <Image
          alt="Praya Dental Care"
          className="sidebar-logo"
          height={100}
          priority
          src="/figma/praya-logo.png"
          width={110}
        />

        <nav aria-label="Menu utama" className="sidebar-navigation">
          <p className="navigation-label">MENU PASIEN</p>
          <ul className="navigation-list">
            {menuItems.map((item) => (
              <li
                className={`navigation-item${item.label === "Pembayaran" ? " is-active" : ""}`}
                key={item.label}
              >
                <Link
                  aria-current={item.label === "Pembayaran" ? "page" : undefined}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            ))}
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
          <div className="page-heading">
            <h1>{example ? "Contoh Detail Pembayaran" : "Pembayaran"}</h1>
            <p>{example ? "Simulasi tampilan status tagihan pasien" : "Tagihan dan status pembayaran"}</p>
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
              P
            </span>
            <div className="account-details">
              <span className="account-name">{identity.displayName}</span>
              <span className="account-role">Pasien</span>
            </div>
          </div>
        </header>

        <section aria-labelledby="bill-list-title" className="bill-section">
          <h2 id="bill-list-title">{example ? "Simulasi Status Tagihan" : "Daftar Tagihan"}</h2>
          {example ? (
            <div className="patient-payment-demo-detail">
              <article className="patient-demo-invoice">
                <p className="patient-demo-label">CONTOH SIMULASI · BUKAN TAGIHAN ASLI</p>
                <h2>Tambal Gigi</h2>
                <dl>
                  <div><dt>Nomor tagihan</dt><dd>{example.id}</dd></div>
                  <div><dt>Tanggal layanan</dt><dd>16 November 2026</dd></div>
                  <div><dt>Dokter</dt><dd>drg. Siti Aminah</dd></div>
                  <div><dt>Status</dt><dd><span className={`bill-status bill-status-${example.status}`}>{paymentStatuses[example.status]}</span></dd></div>
                </dl>
                <div className="patient-demo-total">
                  <strong>Total tagihan</strong>
                  <strong>{new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(example.amount)}</strong>
                </div>
              </article>
              <aside className="patient-demo-explanation">
                <h2>{example.title}</h2>
                <p>{example.description}</p>
                {example.status === 0 ? (
                  <div className="patient-demo-methods">
                    <div><strong>Tunai</strong><span>Bayar langsung di kasir klinik.</span></div>
                    <div><strong>Transfer bank</strong><span>Unggah bukti transfer pada tagihan asli.</span></div>
                  </div>
                ) : null}
                {example.status === 3 ? (
                  <p className="patient-demo-warning">Pada tagihan asli, tombol unggah ulang akan tersedia setelah bukti ditolak.</p>
                ) : null}
                <p className="patient-demo-disclaimer">Ini hanya contoh tampilan. Tidak ada pembayaran atau data yang disimpan.</p>
                <Link className="portal-button portal-button-primary" href="/dashboard/pasien/pembayaran">
                  Kembali ke Daftar Tagihan
                </Link>
              </aside>
            </div>
          ) : (
            <>
              <div aria-label="Daftar tagihan" className="bill-list patient-bill-list">
                {databaseUnavailable ? (
                  <p className="bill-empty-state" role="alert">
                    Data pembayaran tidak dapat dimuat karena koneksi database tidak tersedia.
                  </p>
                ) : payments.length ? (
                  payments.map((payment) => (
                    <div className="bill-row bill-row-featured" key={payment.id_pembayaran}>
                      <div className="bill-patient">
                        <span className="bill-record">{payment.id_pembayaran}</span>
                        <time dateTime={payment.tanggal_pembayaran.toISOString()}>
                          {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "long",
                            timeZone: "UTC",
                          }).format(payment.tanggal_pembayaran)}
                        </time>
                      </div>
                      <span className="bill-amount">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(payment.jumlah_pembayaran)}
                      </span>
                      <span className={`bill-status bill-status-${payment.status_pembayaran}`}>
                        {paymentStatuses[payment.status_pembayaran] ?? "Status tidak dikenal"}
                      </span>
                      <Link
                        className="detail-button"
                        href={`/dashboard/pasien/pembayaran/detail?id=${encodeURIComponent(payment.id_pembayaran)}`}
                      >
                        {payment.status_pembayaran === 3 ? "Periksa & Unggah Ulang" : "Lihat Detail"}
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="bill-empty-state">Belum ada tagihan untuk akun ini.</p>
                )}
              </div>
              <section aria-labelledby="payment-examples-title" className="patient-payment-examples">
                <div className="patient-examples-heading">
                  <div>
                    <h2 id="payment-examples-title">Contoh Status Tagihan</h2>
                    <p>Simulasi untuk melihat tampilan tiap status. Bukan data tagihan akun Anda.</p>
                  </div>
                  <span>SIMULASI</span>
                </div>
                <div className="patient-example-grid">
                  {paymentExamples.map((item) => (
                    <Link
                      className="patient-example-card"
                      href={`/dashboard/pasien/pembayaran?contoh=${item.key}`}
                      key={item.key}
                    >
                      <span className={`bill-status bill-status-${item.status}`}>{paymentStatuses[item.status]}</span>
                      <strong>{item.title === "Belum dibayar" ? "Contoh belum lunas" : `Contoh ${item.title.toLowerCase()}`}</strong>
                      <span>{item.id}</span>
                      <span className="patient-example-link">Lihat contoh <span aria-hidden="true">→</span></span>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
