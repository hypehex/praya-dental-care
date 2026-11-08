import Image from "next/image";
import { connection } from "next/server";
import { prisma } from "../_lib/prisma";
import { formatTime24 } from "../_lib/workflow";
import { PublicHeader } from "../_components/public-header";
import Link from "next/link";

export const instant = false;

export default async function JadwalDokterPage() {
  await connection();

  return (
    <main className="public-main schedule-page">
      <PublicHeader activePath="/jadwal-dokter" />

      <section aria-labelledby="schedule-title" className="section-banner schedule-banner">
        <p className="eyebrow">JADWAL PRAKTIK</p>
        <h1 id="schedule-title">Jadwal Dokter</h1>
      </section>

      <section aria-label="Jadwal praktik dokter" className="doctor-grid">
        <DoctorSchedules />
      </section>
    </main>
  );
}

async function DoctorSchedules() {
  const schedules = await getSchedules();

  if (!schedules) {
    return (
      <p className="schedule-empty" role="alert">
        Jadwal dokter tidak dapat dimuat karena koneksi database tidak tersedia.
      </p>
    );
  }

  if (schedules.length === 0) {
    return <p className="schedule-empty">Belum ada jadwal praktik dokter.</p>;
  }

  return schedules.map((schedule) => {
    const initials = schedule.dokter.nama
      .replace(/^(drg?\.|dokter)\s*/i, "")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase();
    const start = formatTime24(schedule.jam_mulai);
    const end = formatTime24(schedule.jam_selesai);

    return (
      <article className="doctor-card" key={schedule.id_jadwal}>
        <div className="doctor-profile">
          <span className="doctor-avatar">
            <Image
              alt=""
              height={52}
              src="/figma/doctor-initial-circle.svg"
              width={52}
            />
            <span aria-hidden="true">{initials}</span>
          </span>
          <span className="doctor-name">
            <strong>{schedule.dokter.nama}</strong>
            <span>{schedule.dokter.spesialis}</span>
          </span>
        </div>
        <div className="doctor-schedule">
          <div>
            <span>HARI PRAKTIK</span>
            <strong>{schedule.hari}</strong>
          </div>
          <div>
            <span>JAM PRAKTIK</span>
            <strong>
              {start}–{end}
            </strong>
          </div>
        </div>
        <div className="doctor-card-actions">
          <p
            className={`doctor-availability${schedule.status_jadwal.toLowerCase() === "tersedia" ? " is-available" : ""}`}
          >
            {schedule.status_jadwal}
          </p>
          {schedule.status_jadwal.trim().toLocaleLowerCase("id") === "aktif" ? (
            <Link className="doctor-booking-link" href="/masuk/pasien?next=/dashboard/pasien/booking-kunjungan/tambah">
              Masuk untuk Booking
            </Link>
          ) : null}
        </div>
      </article>
    );
  });
}

async function getSchedules() {
  try {
    return await prisma.jadwal_dokter.findMany({
      include: {
        dokter: {
          select: {
            nama: true,
            spesialis: true,
          },
        },
      },
      orderBy: [{ hari: "asc" }, { jam_mulai: "asc" }],
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) throw error;
    console.error("Doctor schedule query failed because the database is unavailable.");
    return null;
  }
}

function isDatabaseUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  if (
    message.includes("connection terminated") ||
    message.includes("can't reach database server") ||
    message.includes("connection refused") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("timed out")
  ) {
    return true;
  }

  return error.cause instanceof Error && isDatabaseUnavailable(error.cause);
}
