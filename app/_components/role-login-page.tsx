import Image from "next/image";
import Link from "next/link";
import { BrandHeader, PublicHeader } from "./public-header";
import { loginAction } from "../_lib/auth-actions";

export const loginRoles = [
  {
    slug: "manajer-klinik",
    label: "Manajer Klinik",
    initials: "MK",
    avatar: "/figma/manager-login-circle.svg",
  },
  {
    slug: "dokter",
    label: "Dokter",
    initials: "DR",
    avatar: "/figma/doctor-login-circle.svg",
  },
  {
    slug: "perawat",
    label: "Perawat",
    initials: "PR",
    avatar: "/figma/nurse-login-circle.svg",
  },
  {
    slug: "owner",
    label: "Owner",
    initials: "OW",
    avatar: "/figma/owner-login-circle.svg",
  },
  {
    slug: "pasien",
    label: "Pasien",
    initials: "PS",
    avatar: "/figma/patient-login-circle.svg",
  },
] as const;

export type LoginRole = (typeof loginRoles)[number];

export function RoleLoginPage({
  role,
  error,
}: {
  role: LoginRole;
  error?: string;
}) {
  const isPatient = role.slug === "pasien";
  const errorMessage =
    error === "database"
      ? "Layanan login tidak dapat terhubung ke database. Silakan coba kembali."
      : error === "configuration"
        ? "Autentikasi belum dikonfigurasi. Hubungi pengelola aplikasi."
        : error === "inactive"
          ? "Akun belum aktif atau tidak memiliki akses untuk peran ini."
          : error === "credentials"
            ? "Username atau kata sandi tidak sesuai dengan peran yang dipilih."
            : null;

  return (
    <main className={`login-page${isPatient ? " patient-login-page" : ""}`}>
      {isPatient ? (
        <PublicHeader activePath="/masuk/pasien" />
      ) : (
        <BrandHeader />
      )}

      <section aria-labelledby="login-title" className="login-panel">
        <div className="login-avatar">
          <Image
            alt=""
            height={64}
            src={role.avatar}
            width={64}
          />
          <span aria-hidden="true">{role.initials}</span>
        </div>
        <h1 id="login-title">Masuk sebagai {role.label}</h1>

        <form action={loginAction.bind(null, role.slug)} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">
              {isPatient ? "Username atau Email" : "Username"}
            </label>
            <input
              autoComplete="username"
              id="login-username"
              maxLength={50}
              name="username"
              placeholder={
                isPatient
                  ? "Masukkan username atau email"
                  : "Masukkan username"
              }
              required
              type="text"
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Kata Sandi</label>
            <input
              autoComplete="current-password"
              id="login-password"
              maxLength={255}
              name="password"
              placeholder="Masukkan kata sandi"
              required
              type="password"
            />
          </div>
          <div className="login-actions">
            <button className="button-primary" type="submit">
              Masuk
            </button>
            {isPatient ? null : (
              <Link className="button-secondary" href="/masuk-staf">
                Ganti Peran
              </Link>
            )}
          </div>
          {errorMessage ? (
            <p className="login-auth-note" role="alert">
              {errorMessage}
            </p>
          ) : null}
          {isPatient ? (
            <div className="patient-registration">
              <p>Belum memiliki akun?</p>
              <Link className="button-secondary" href="/registrasi-pasien">
                Daftar Akun Pasien
              </Link>
            </div>
          ) : null}
        </form>
      </section>
    </main>
  );
}
