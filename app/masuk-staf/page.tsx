import Image from "next/image";
import Link from "next/link";
import {
  loginRoles,
  type LoginRole,
} from "../_components/role-login-page";
import { PublicHeader } from "../_components/public-header";

const staffRoles = loginRoles.filter(
  (role): role is Exclude<LoginRole, { slug: "pasien" }> =>
    role.slug !== "pasien",
);

const roleDescriptions = {
  "manajer-klinik": "Kelola informasi klinik dan jadwal dokter.",
  dokter: "Lihat jadwal praktik dan akses pelayanan.",
  perawat: "Akses tugas pelayanan dan pemeriksaan.",
  owner: "Pantau informasi dan laporan klinik.",
} as const;

export default function MasukStafPage() {
  return (
    <main className="public-main staff-page">
      <PublicHeader activePath="/masuk-staf" />

      <section aria-labelledby="staff-title" className="section-banner staff-banner">
        <p className="eyebrow">AKSES STAF</p>
        <h1 id="staff-title">Masuk Staf</h1>
        <p className="staff-intro">
          Pilih peran akun terlebih dahulu untuk menuju halaman login yang
          sesuai.
        </p>
      </section>

      <section aria-label="Pilih peran staf" className="staff-role-grid">
        {staffRoles.map((role) => (
          <Link
            className="staff-role-card"
            href={`/masuk/${role.slug}`}
            key={role.slug}
          >
            <span className="staff-role-avatar">
              <Image
                alt=""
                height={54}
                src="/figma/staff-role-circle.svg"
                width={54}
              />
              <span aria-hidden="true">{role.initials}</span>
            </span>
            <span className="staff-role-copy">
              <strong>{role.label}</strong>
              <span>{roleDescriptions[role.slug]}</span>
            </span>
            <span className="button-primary">Masuk</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
