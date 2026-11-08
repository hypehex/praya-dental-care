import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "../../_components/public-header";
import { PatientRegistrationPasswordFields } from "../password-fields";
import { registerPatientAction } from "../../_lib/auth-actions";
import { isDatabaseUnavailable } from "../../_lib/auth";
import { prisma } from "../../_lib/prisma";
import { connection } from "next/server";

export const instant = false;

const states = {
  "belum-lengkap": {
    title: "Data Registrasi Belum Lengkap",
    description: "Lengkapi semua data yang diperlukan untuk melanjutkan registrasi.",
    action: "Kembali ke Registrasi",
  },
  "akun-sudah-terdaftar": {
    title: "Akun Sudah Terdaftar",
    description: "Akun dengan informasi tersebut sudah terdaftar.",
    action: "Masuk sebagai Pasien",
  },
  berhasil: {
    title: "Pendaftaran Berhasil Dikirim",
    description:
      "Akun Anda menunggu pemeriksaan dan persetujuan Manajer Klinik.",
    action: "Kembali ke Login",
  },
  database: {
    title: "Database Belum Dapat Diakses",
    description: "Registrasi belum dapat diproses. Silakan coba kembali setelah koneksi database tersedia.",
    action: "Coba Lagi",
  },
} as const;

export function generateStaticParams() {
  return [
    { state: [] },
    { state: ["belum-lengkap"] },
    { state: ["akun-sudah-terdaftar"] },
    { state: ["berhasil"] },
  ];
}

export default async function RegistrasiPasienPage({
  params,
  searchParams,
}: {
  params: Promise<{ state?: string[] }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ state = [] }, { error }] = await Promise.all([params, searchParams]);
  const selectedState = state.join("/");
  if (state.length > 1) notFound();

  if (!selectedState) {
    await connection();

    if (error === "database") {
      return (
        <main className="public-main registration-page">
          <PublicHeader activePath="/registrasi-pasien" />
          <section aria-labelledby="registration-title" className="registration-panel">
            <h1 id="registration-title">{states.database.title}</h1>
            <p className="registration-note" role="alert">{states.database.description}</p>
            <Link className="button-primary" href="/registrasi-pasien">
              {states.database.action}
            </Link>
          </section>
        </main>
      );
    }

    return (
      <main className="public-main registration-page">
        <PublicHeader activePath="/registrasi-pasien" />
        <section aria-labelledby="registration-title" className="registration-panel">
          <Image
            alt=""
            className="registration-avatar"
            height={64}
            src="/figma/patient-login-circle.svg"
            width={64}
          />
          <h1 id="registration-title">Registrasi Pasien</h1>
          <p>Buat akun untuk mengakses layanan Praya Dental Care.</p>
          <PatientRegistrationForm />
        </section>
      </main>
    );
  }

  async function PatientRegistrationForm() {
    let postalCodes: {
      kode_pos: string;
      kelurahan: string;
      kecamatan: string;
      kota: string;
    }[] = [];
    let databaseError = false;

    try {
      postalCodes = await prisma.kode_pos.findMany({
        select: {
          kode_pos: true,
          kelurahan: true,
          kecamatan: true,
          kota: true,
        },
        orderBy: { kode_pos: "asc" },
      });
    } catch (error) {
      if (!isDatabaseUnavailable(error)) throw error;
      databaseError = true;
    }

    return (
      <form action={registerPatientAction} className="registration-form">
        <label>
          <span>Nama Lengkap</span>
          <input autoComplete="name" maxLength={100} name="nama" placeholder="Masukkan nama sesuai identitas" required />
        </label>
        <label>
          <span>Nomor Telepon</span>
          <input autoComplete="tel" maxLength={15} name="telepon" placeholder="Masukkan nomor telepon aktif" required type="tel" />
        </label>
        <label>
          <span>Email</span>
          <input autoComplete="email" maxLength={50} name="email" placeholder="Email digunakan sebagai username" required type="email" />
        </label>
        <label>
          <span>Tanggal Lahir</span>
          <input autoComplete="bday" max={new Date().toISOString().slice(0, 10)} name="tanggal-lahir" required type="date" />
        </label>
        <label>
          <span>Alamat Jalan</span>
          <input autoComplete="street-address" maxLength={100} name="alamat" placeholder="Masukkan alamat jalan" required />
        </label>
        <label>
          <span>Kode Pos / Kelurahan</span>
          <select defaultValue="" name="kode-pos" required>
            <option disabled value="">Pilih kode pos</option>
            {postalCodes.map((item) => (
              <option key={item.kode_pos} value={item.kode_pos}>
                {item.kode_pos} — {item.kelurahan}, {item.kecamatan}, {item.kota}
              </option>
            ))}
          </select>
        </label>
        <PatientRegistrationPasswordFields />
        {databaseError ? (
          <p className="registration-note" role="alert">
            Database belum dapat diakses. Pendaftaran tidak dapat dikirim sekarang.
          </p>
        ) : postalCodes.length === 0 ? (
          <p className="registration-note" role="alert">
            Data kode pos belum tersedia. Hubungi pengelola klinik sebelum mendaftar.
          </p>
        ) : (
          <p className="registration-note">
            Akun baru aktif setelah disetujui Manajer Klinik.
          </p>
        )}
        <button className="button-primary" disabled={databaseError || postalCodes.length === 0} type="submit">
          Daftar
        </button>
        <Link className="button-secondary" href="/masuk/pasien">
          Sudah Punya Akun
        </Link>
      </form>
    );
  }

  const result = states[selectedState as keyof typeof states];
  if (!result) notFound();

  const destination =
    selectedState === "belum-lengkap"
      ? "/registrasi-pasien"
      : "/masuk/pasien";

  return (
    <main className="public-main registration-page">
      <PublicHeader activePath="/registrasi-pasien" />
      <section aria-labelledby="registration-state-title" className="registration-state">
        <h1 id="registration-state-title">{result.title}</h1>
        <p>{result.description}</p>
        <Link className="button-primary" href={destination}>
          {result.action}
        </Link>
      </section>
    </main>
  );
}
