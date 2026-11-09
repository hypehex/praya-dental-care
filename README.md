# Praya Dental Care

Sistem informasi pelayanan klinik gigi berbasis web untuk mengelola pendaftaran pasien, booking kunjungan, pemeriksaan, rekam medis, pembayaran, dan laporan operasional klinik.

## Teknologi

- Next.js 16 dan React 19
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS 4 dan CSS global

## Role dan Fitur

### Pasien

- Registrasi, login, dan pengelolaan profil
- Informasi klinik, pelayanan, dokter, dan jadwal praktik
- Booking serta riwayat kunjungan
- Tagihan, metode pembayaran, dan unggah bukti transfer
- Kritik dan saran

### Manajer Klinik

- Persetujuan registrasi pasien
- Pengelolaan pasien, dokter, jadwal, pelayanan, dan informasi klinik
- Konfirmasi booking dan kunjungan
- Pemeriksaan serta verifikasi pembayaran

### Perawat

- Daftar dan detail kunjungan
- Pengelolaan status pelayanan pasien

### Dokter

- Jadwal dan kunjungan yang ditugaskan
- Pemeriksaan, diagnosis, hasil pemeriksaan, dan tindakan
- Rekam medis dan resep

### Owner

- Statistik operasional klinik
- Rekap pelayanan berdasarkan periode
- Laporan klinik
- Tindak lanjut kritik dan saran

## Struktur Proyek

```text
app/
├── _components/          Komponen antarmuka yang digunakan bersama
├── _lib/                 Autentikasi, akses data, dan proses bisnis
├── api/                  API aplikasi
├── dashboard/            Dashboard seluruh role
├── informasi-klinik/     Halaman informasi klinik publik
├── jadwal-dokter/        Halaman jadwal dokter publik
├── masuk/                Halaman login berdasarkan role
├── masuk-staf/           Pilihan login pegawai
└── registrasi-pasien/    Halaman pendaftaran pasien

prisma/
└── schema.prisma         Pemetaan tabel PostgreSQL

public/figma/             Logo dan aset antarmuka
database.sql              Struktur lengkap database
```

## File Utama

| File | Kegunaan |
| --- | --- |
| `app/_components/role-dashboard.tsx` | Dashboard, tabel, detail, dan form seluruh role |
| `app/_components/booking-schedule-fields.tsx` | Pilihan jadwal dan waktu booking |
| `app/_components/doctor-treatment-fields.tsx` | Pilihan tindakan pemeriksaan dokter |
| `app/_components/nurse-status-fields.tsx` | Perubahan status kunjungan oleh perawat |
| `app/_lib/auth.ts` | Sesi dan hak akses pengguna |
| `app/_lib/portal-config.ts` | Konfigurasi menu, halaman, tabel, dan form |
| `app/_lib/portal-data.ts` | Pengambilan data dari PostgreSQL |
| `app/_lib/portal-actions.ts` | Penyimpanan dan perubahan data portal |
| `app/_lib/clinical-actions.ts` | Proses pelayanan, pemeriksaan, dan pembayaran |
| `app/_lib/workflow.ts` | Aturan perubahan status proses |
| `app/globals.css` | Pengaturan tampilan aplikasi |

## Database

[`database.sql`](database.sql) berisi 19 tabel lengkap beserta relasinya. Seluruh tabel dibuat langsung dengan `CREATE TABLE` tanpa perubahan struktur tambahan.

[`prisma/schema.prisma`](prisma/schema.prisma) digunakan untuk menghubungkan tabel PostgreSQL dengan kode aplikasi.

## Menjalankan Aplikasi

1. Instal dependency:

   ```bash
   npm install
   ```

2. Atur koneksi PostgreSQL pada `.env` atau `.env.local`:

   ```env
   DATABASE_URL="postgresql://pengguna:kata_sandi@host:5432/nama_database"
   ```

3. Jalankan aplikasi:

   ```bash
   npm.cmd run dev
   ```

4. Buka `http://localhost:3000`.

## Pemeriksaan

```bash
npm.cmd run lint
npm.cmd run build
```

## Deployment

- Simpan `DATABASE_URL` pada environment hosting.
- Gunakan database PostgreSQL yang sudah memiliki struktur dan data aplikasi.
- Jangan mengunggah `.env`, `.env.local`, `.next`, `node_modules`, atau isi direktori `tmp`.
- Jalankan lint dan build sebelum deployment.
