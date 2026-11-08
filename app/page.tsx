import { connection } from "next/server";
import { prisma } from "./_lib/prisma";
import { clinicToday } from "./_lib/workflow";
export const instant = false;
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "./_components/public-header";

export default async function Home() {
  await connection();
  const announcements = await prisma.informasi_klinik.findMany({ where: { tanggal_publikasi: { lte: new Date(clinicToday()) } }, orderBy: { tanggal_publikasi: "desc" } });
  return (
    <main className="public-main home-page">
      <PublicHeader activePath="/" />

      <section aria-labelledby="home-title" className="home-hero">
        <h1 id="home-title">
          Senyum Sehat,
          <br />
          Hidup Lebih Bahagia
        </h1>
        <p>
          Perawatan gigi yang nyaman, ramah, dan terpercaya untuk seluruh
          keluarga.
        </p>
        <div className="home-actions">
          <Link className="button-primary" href="/jadwal-dokter">
            Lihat Jadwal Dokter
          </Link>
          <Link className="button-secondary" href="/masuk/pasien?next=/dashboard/pasien/booking-kunjungan/tambah">
            Booking Kunjungan
          </Link>
        </div>
      </section>

      <div className="home-information-grid">
        <section aria-labelledby="visit-steps-title" className="visit-steps">
          <h2 id="visit-steps-title">Langkah mudah untuk berkunjung</h2>
          <p className="section-description">
            Tiga langkah sederhana untuk memulai perawatan gigi.
          </p>
          <ol className="visit-step-list">
            <li>
              <span className="step-number">
                <Image
                  alt=""
                  height={42}
                  src="/figma/landing-step-circle.svg"
                  width={42}
                />
                <span aria-hidden="true">01</span>
              </span>
              <span className="step-copy">
                <strong>Isi data</strong>
                <span>Isi data pendaftaran dengan informasi yang benar.</span>
              </span>
            </li>
            <li>
              <span className="step-number">
                <Image
                  alt=""
                  height={42}
                  src="/figma/landing-step-circle.svg"
                  width={42}
                />
                <span aria-hidden="true">02</span>
              </span>
              <span className="step-copy">
                <strong>Tentukan Waktu</strong>
                <span>Pilih waktu kunjungan yang sesuai kebutuhan.</span>
              </span>
            </li>
            <li>
              <span className="step-number">
                <Image
                  alt=""
                  height={42}
                  src="/figma/landing-step-circle.svg"
                  width={42}
                />
                <span aria-hidden="true">03</span>
              </span>
              <span className="step-copy">
                <strong>Datang ke klinik</strong>
                <span>Datang sesuai jadwal dan ikuti arahan petugas.</span>
              </span>
            </li>
          </ol>
        </section>

        <aside aria-labelledby="latest-info-title" className="latest-info">
          <p className="eyebrow">INFORMASI TERBARU</p>
          <h2 id="latest-info-title">{announcements[0]?.judul ?? "Informasi Klinik"}</h2>
          <p>
            {announcements[0]?.isi_informasi ?? "Belum ada pengumuman terbaru dari klinik."}
          </p>
          <Link className="button-primary" href="/informasi-klinik">
            Lihat Informasi Klinik
          </Link>
        </aside>
      </div>
    </main>
  );
}
