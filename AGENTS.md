<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pedoman Proyek Praya Dental Care

## Acuan Pengembangan

- Kerjakan aplikasi berdasarkan kebutuhan sistem, struktur data, alur bisnis, dan desain Figma Praya Dental Care yang sudah ditetapkan pemilik proyek.
- Permintaan pemilik proyek menentukan pekerjaan aktif. Struktur dan alur aplikasi yang sudah disepakati menjadi batas implementasi.
- Jangan menambahkan fitur, role, alur, istilah, atau desain berdasarkan asumsi.
- Pertahankan implementasi yang sudah berfungsi. Lakukan perubahan seperlunya dan jangan membangun ulang aplikasi.

## Batasan Database dan Backend

- Gunakan PostgreSQL, Prisma Client, API, server action, dan komponen yang sudah tersedia.
- Jangan mengubah `prisma/schema.prisma`, struktur tabel, kolom, relasi, data awal, konfigurasi environment, atau konfigurasi backend kecuali pengguna memberikan izin baru secara eksplisit.
- Jangan menjalankan migrasi, introspeksi yang menulis schema, reset database, seed ulang, atau penghapusan data aplikasi.
- Semua query mutasi harus membatasi record berdasarkan role dan pemilik data. Pasien hanya boleh mengakses dan mengubah data miliknya sendiri.
- Perubahan lintas role harus langsung terbaca dari database, bukan dari data dummy atau state tampilan sementara.
- Data pengujian harus terisolasi, memiliki identitas unik, dan dibersihkan setelah pengujian tanpa menyentuh data pengguna.

## Role dan Hak Akses

### Pasien

- Registrasi pasien menghasilkan akun berstatus menunggu sampai diperiksa Manajer Klinik.
- Pasien dapat login setelah akun aktif, melihat dan mengubah profilnya, melihat informasi klinik, layanan, dokter, dan jadwal praktik.
- Pasien dapat membuat, melihat, mengubah, membatalkan, dan menghapus booking hanya sesuai status yang diizinkan.
- Form booking harus menyediakan pilihan jadwal dan waktu yang nyata dari database. Dokter, tanggal, jadwal, layanan, dan waktu harus tervalidasi sebelum disimpan.
- Pasien dapat melihat status booking dan riwayat kunjungannya sendiri.
- Pasien hanya dapat melihat tagihannya sendiri, memilih metode pembayaran, mengunggah atau mengunggah ulang bukti transfer, dan melihat hasil verifikasi.
- Pasien dapat mengirim kritik dan saran yang benar-benar tersimpan.

### Manajer Klinik

- Manajer dapat memeriksa pengajuan registrasi dan memilih setujui, minta perbaikan, atau tolak.
- Manajer mengelola data pasien, dokter, jadwal dokter, pelayanan, informasi klinik, dan kunjungan sesuai kewenangannya.
- Manajer dapat melihat detail booking lalu mengonfirmasi atau menolak booking yang masih menunggu.
- Manajer dapat melihat pembayaran dan bukti pembayaran, kemudian menerima atau menolak bukti yang menunggu verifikasi.
- Dashboard Manajer harus memakai data aktual dan menyediakan navigasi ke seluruh menu operasional.

### Perawat

- Perawat melihat daftar kunjungan dan detail pelayanan sesuai kewenangannya.
- Perawat memperbarui status kunjungan hanya mengikuti transisi status yang diizinkan.
- Perawat tidak boleh mengubah diagnosis, rekam medis, resep, atau pembayaran.

### Dokter

- Dokter hanya melihat jadwal dan kunjungan yang ditugaskan kepadanya.
- Dokter dapat membuka detail pasien, mengisi pemeriksaan, hasil pemeriksaan, diagnosis, tindakan, catatan, rekam medis, dan resep.
- Penyimpanan pemeriksaan harus menghasilkan data tindakan dan tagihan sesuai pelayanan yang dipilih.

### Owner

- Owner melihat statistik dan informasi operasional aktual.
- Rekap pelayanan dan laporan harus menggunakan periode dan kategori yang dipilih serta dihitung dari database.
- Owner dapat meninjau dan memperbarui tindak lanjut kritik dan saran sesuai kewenangannya.

## Alur Utama Sistem

1. Pendaftaran dan penjadwalan pasien: Pasien registrasi/login, melihat dokter dan jadwal, membuat booking, Manajer mengonfirmasi, lalu Pasien melihat status aktual.
2. Pemeriksaan dan rekam medis: Perawat memproses status kunjungan, Dokter melakukan pemeriksaan serta menyimpan tindakan, rekam medis, dan resep.
3. Rekap pelayanan klinik: Manajer mengelola data operasional dan Owner melihat statistik serta rekap berdasarkan periode.

Ketiga alur harus dapat didemonstrasikan dari awal sampai akhir menggunakan role yang berbeda dan data yang sama di PostgreSQL.

## UI dan Figma

- Ikuti desain Figma yang tersedia: warna, tipografi, sidebar 250 px, panel, tabel, tombol, form, detail, jarak, dan hierarki visual.
- Gunakan aset lokal di `public/figma` apabila aset yang sama sudah tersedia.
- Pertahankan tampilan desktop 1440 x 960 sebagai target utama tanpa merusak responsivitas dasar.
- Jangan biarkan teks, tombol, profil, tabel, atau kartu saling bertumpuk.
- Tabel harus tetap terbaca ketika kontennya panjang. Kolom aksi harus menampilkan tombol yang ringkas dan tidak terpotong.
- Jangan menampilkan data dummy, simulasi, tautan kosong, tombol dekoratif, atau kontrol yang terlihat aktif tetapi tidak menjalankan proses.

## Tombol, Form, dan Navigasi

- Setiap tombol `Detail`, `Tambah`, `Edit`, `Simpan`, `Periksa`, `Konfirmasi`, `Tolak`, `Bayar`, `Unggah`, `Hapus`, `Kembali`, dan `Logout` harus memiliki aksi nyata.
- Setiap halaman Detail harus memuat record yang dipilih dan memeriksa hak akses role.
- Semua form harus memiliki label, validasi, pesan kesalahan yang jelas, nilai awal saat edit, dan redirect yang benar setelah berhasil.
- Jangan menyembunyikan kegagalan dengan halaman status generik. Jelaskan kondisi seperti data berubah, slot jadwal dipakai, file tidak valid, atau record tidak dapat dihapus.
- Tombol yang tidak berlaku untuk status tertentu harus disembunyikan atau diganti informasi yang jelas, bukan ditampilkan sebagai tombol palsu yang dinonaktifkan.
- Menu sidebar dan tombol Kembali harus selalu menuju halaman yang benar untuk role aktif.

## Aturan Implementasi

- Baca dokumentasi Next.js yang relevan di `node_modules/next/dist/docs/` sebelum mengubah API, route, form, server action, cookie, cache, atau pola rendering.
- Gunakan komponen dan helper yang sudah ada sebelum membuat komponen baru.
- Gunakan `apply_patch` untuk perubahan file manual.
- Jangan menghapus file, melakukan `git reset`, `git checkout`, Keep, Undo, commit, atau push otomatis.
- Jangan menimpa perubahan pengguna atau perubahan lain yang tidak terkait.

## Verifikasi Wajib

- Uji fungsi melalui browser, bukan hanya memeriksa JSX atau tampilan statis.
- Untuk setiap role yang diubah, uji menu, Detail, form tambah/edit, Simpan, Kembali, validasi, dan hak akses.
- Untuk perubahan lintas role, uji bahwa data yang dibuat satu role terlihat dan dapat diproses role berikutnya.
- Jalankan `npm.cmd run lint` dan `npm.cmd run build` setelah perubahan selesai.
- Gunakan skrip pengujian integrasi yang tersedia di direktori `tmp` bila relevan dan pertahankan pembersihan data uji.
- Periksa screenshot desktop untuk perubahan visual penting dan pastikan tidak ada teks atau tombol bertumpuk.
- Laporkan secara singkat fitur yang berhasil, pengujian yang dijalankan, dan masalah yang masih tersisa.
