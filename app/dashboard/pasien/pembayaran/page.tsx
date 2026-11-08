import { paymentStatuses } from "../../../_lib/workflow";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "../../../_lib/auth-actions";
import { isDatabaseUnavailable, requireRoleSession } from "../../../_lib/auth";
import { prisma } from "../../../_lib/prisma";

const menuItems = [
  { label: "Dashboard", href: "/dashboard/pasien" },
  { label: "Profil Saya", href: "/dashboard/pasien/profil" },
  { label: "Informasi Klinik", href: "/dashboard/pasien/informasi-klinik" },
  { label: "Layanan", href: "/dashboard/pasien/layanan" },
  { label: "Booking & Kunjungan", href: "/dashboard/pasien/booking-kunjungan" },
  { label: "Data Dokter", href: "/dashboard/pasien/data-dokter" },
  { label: "Konfirmasi Kedatangan", href: "/dashboard/pasien/konfirmasi-kedatangan" },
  { label: "Jadwal Dokter", href: "/dashboard/pasien/jadwal-dokter" },
  { label: "Pembayaran", href: "/dashboard/pasien/pembayaran" },
  { label: "Kritik & Saran", href: "/dashboard/pasien/kritik-saran" },
];

export const instant = false;

export const metadata: Metadata = {
  title: "Pembayaran | Praya Dental Care",
  description: "Lihat tagihan dan status pembayaran Anda di Praya Dental Care.",
};

export default async function PembayaranPage() {
  const identity = await requireRoleSession("pasien");
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
            <h1>Pembayaran</h1>
            <p>Tagihan dan status pembayaran aktual akun Anda</p>
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
          <h2 id="bill-list-title">Daftar Tagihan</h2>
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
        </section>
      </main>
    </div>
  );
}
