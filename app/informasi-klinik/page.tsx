import { connection } from "next/server";
import { prisma } from "../_lib/prisma";
import { clinicToday } from "../_lib/workflow";
export const instant = false;
import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "../_components/public-header";

const clinicInformation = [
  {
    label: "Jam Operasional",
    value: "Senin–Sabtu  ·  10.00–21.00 WIB",
  },
  { label: "Telepon Klinik", value: "0823-2831-2033" },
  {
    label: "Alamat Klinik",
    value: "Jl. Pramuka No. 24, Padang, Sumatera Barat",
  },
  {
    label: "Layanan",
    value: "Pemeriksaan gigi, scaling, dan tambal gigi",
  },
];

export default async function InformasiKlinikPage() {
  await connection();
  const announcements = await prisma.informasi_klinik.findMany({ where: { tanggal_publikasi: { lte: new Date(clinicToday()) } }, orderBy: { tanggal_publikasi: "desc" } });
  return (
    <main className="public-main clinic-page">
      <PublicHeader activePath="/informasi-klinik" />

      <section aria-labelledby="clinic-title" className="section-banner clinic-banner">
        <h1 id="clinic-title">Informasi Klinik</h1>
      </section>

      <div className="clinic-content-grid">
        <section
          aria-labelledby="clinic-details-title"
          className="clinic-details"
        >
          <h2 id="clinic-details-title">Informasi Klinik</h2>
          <ol className="clinic-detail-list">
            {clinicInformation.map((item, index) => (
              <li className="clinic-detail" key={item.label}>
                <span className="clinic-number">
                  <Image
                    alt=""
                    height={36}
                    src="/figma/clinic-number-circle.svg"
                    width={36}
                  />
                  <span aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="clinic-detail-copy">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <aside aria-labelledby="clinic-announcement-title" className="clinic-announcement">
          <p className="eyebrow">PENGUMUMAN KLINIK</p>
          <h2 id="clinic-announcement-title">Pengumuman</h2>
          {announcements.length ? announcements.map((item) => <article key={item.id_informasi}><h3>{item.judul}</h3><p>{item.isi_informasi}</p></article>) : <p>Belum ada pengumuman terbaru dari klinik.</p>}
          <div aria-hidden="true" className="announcement-rules">
            <span />
            <span />
          </div>
          <Link className="button-primary" href="/jadwal-dokter">
            Lihat Jadwal Dokter
          </Link>
        </aside>
      </div>
    </main>
  );
}
