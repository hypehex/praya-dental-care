import Image from "next/image";
import Link from "next/link";

type PublicPath =
  | "/"
  | "/informasi-klinik"
  | "/jadwal-dokter"
  | "/masuk/pasien"
  | "/registrasi-pasien"
  | "/masuk-staf";

const navigation = [
  { label: "Beranda", href: "/" },
  { label: "Informasi Klinik", href: "/informasi-klinik" },
  { label: "Jadwal Dokter", href: "/jadwal-dokter" },
  { label: "Masuk Pasien", href: "/masuk/pasien" },
  { label: "Masuk Staf", href: "/masuk-staf" },
] satisfies { label: string; href: PublicPath }[];

type PublicHeaderProps = {
  activePath: PublicPath;
};

export function PublicHeader({
  activePath,
}: PublicHeaderProps) {
  return (
    <header className="public-header">
      <Link
        aria-label="Praya Dental Care - Beranda"
        className="public-brand"
        href="/"
      >
        <Image
          alt="Praya Dental Care"
          height={58}
          priority
          src="/figma/praya-logo.png"
          width={58}
        />
      </Link>
      <nav aria-label="Navigasi utama" className="public-navigation">
        {navigation.map((item) => (
          <Link
            aria-current={activePath === item.href ? "page" : undefined}
            className={`public-navigation-link${activePath === item.href ? " is-active" : ""}`}
            href={item.href}
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function BrandHeader() {
  return (
    <header className="brand-header">
      <Link
        aria-label="Praya Dental Care - Beranda"
        className="brand-header-logo"
        href="/"
      >
        <Image
          alt="Praya Dental Care"
          height={58}
          priority
          src="/figma/praya-logo.png"
          width={58}
        />
      </Link>
      <div className="brand-header-copy">
        <span className="brand-header-name">PRAYA DENTAL CARE</span>
        <span className="brand-header-tagline">
          Senyum Sehat, Hidup Lebih Bahagia
        </span>
      </div>
    </header>
  );
}
