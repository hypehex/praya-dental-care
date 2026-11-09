-- DATABASE PRAYA DENTAL CARE

BEGIN;

-- 1. Kode Pos
CREATE TABLE IF NOT EXISTS kode_pos (
    kode_pos VARCHAR(5) PRIMARY KEY,
    kelurahan VARCHAR(50) NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    kota VARCHAR(50) NOT NULL,
    provinsi VARCHAR(50) NOT NULL
);

-- 2. Manajer Klinik
CREATE TABLE IF NOT EXISTS manajer_klinik (
    id_manajer VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 3. Dokter
CREATE TABLE IF NOT EXISTS dokter (
    id_dokter VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    spesialis VARCHAR(50) NOT NULL
);

-- 4. Perawat
CREATE TABLE IF NOT EXISTS perawat (
    id_perawat VARCHAR(10) PRIMARY KEY,
    nama_perawat VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 5. Owner
CREATE TABLE IF NOT EXISTS owner (
    id_owner VARCHAR(10) PRIMARY KEY,
    nama_owner VARCHAR(255) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 6. Pasien
CREATE TABLE IF NOT EXISTS pasien (
    id_pasien VARCHAR(10) PRIMARY KEY,
    nama_pasien VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    alamat_jalan VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    kode_pos VARCHAR(5) NOT NULL REFERENCES kode_pos(kode_pos),
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 7. Pelayanan
CREATE TABLE IF NOT EXISTS pelayanan (
    id_pelayanan VARCHAR(10) PRIMARY KEY,
    nama_pelayanan VARCHAR(100) NOT NULL,
    deskripsi VARCHAR(255) NOT NULL,
    biaya NUMERIC(12,2) NOT NULL CHECK (biaya >= 0)
);

-- 8. Informasi Klinik
CREATE TABLE IF NOT EXISTS informasi_klinik (
    id_informasi VARCHAR(10) PRIMARY KEY,
    judul VARCHAR(100) NOT NULL,
    isi_informasi TEXT NOT NULL,
    tanggal_publikasi DATE NOT NULL
);

-- 9. Akun Pengguna
CREATE TABLE IF NOT EXISTS akun_pengguna (
    id_akun VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status_akun VARCHAR(20) NOT NULL,
    id_owner VARCHAR(10) REFERENCES owner(id_owner),
    id_manajer VARCHAR(10) REFERENCES manajer_klinik(id_manajer),
    id_pasien VARCHAR(10) REFERENCES pasien(id_pasien),
    id_dokter VARCHAR(10) REFERENCES dokter(id_dokter),
    tanggal_pengajuan TIMESTAMPTZ
);

-- 10. Jadwal Dokter
CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id_jadwal VARCHAR(10) PRIMARY KEY,
    hari VARCHAR(10) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status_jadwal VARCHAR(20) NOT NULL,
    id_dokter VARCHAR(10) NOT NULL REFERENCES dokter(id_dokter)
);

-- 11. Kunjungan
CREATE TABLE IF NOT EXISTS kunjungan (
    id_kunjungan VARCHAR(10) PRIMARY KEY,
    tanggal_kunjungan DATE NOT NULL,
    waktu_kunjungan TIME NOT NULL,
    keluhan_awal VARCHAR(255) NOT NULL,
    status_kunjungan VARCHAR(20) NOT NULL,
    id_pasien VARCHAR(10) NOT NULL REFERENCES pasien(id_pasien),
    id_jadwal VARCHAR(10) NOT NULL REFERENCES jadwal_dokter(id_jadwal),
    id_owner VARCHAR(10) REFERENCES owner(id_owner),
    id_pelayanan VARCHAR(10) REFERENCES pelayanan(id_pelayanan)
);

-- 12. Pemeriksaan
CREATE TABLE IF NOT EXISTS pemeriksaan (
    id_pemeriksaan VARCHAR(10) PRIMARY KEY,
    tanggal_pemeriksaan DATE NOT NULL,
    keluhan VARCHAR(255) NOT NULL,
    hasil_pemeriksaan VARCHAR(255) NOT NULL,
    catatan_pemeriksaan VARCHAR(255),
    id_kunjungan VARCHAR(10) NOT NULL REFERENCES kunjungan(id_kunjungan),
    id_dokter VARCHAR(10) NOT NULL REFERENCES dokter(id_dokter),
    id_perawat VARCHAR(10) NOT NULL REFERENCES perawat(id_perawat),
    id_owner VARCHAR(10) REFERENCES owner(id_owner)
);

-- 13. Tindakan
CREATE TABLE IF NOT EXISTS tindakan (
    id_tindakan VARCHAR(10) PRIMARY KEY,
    nama_tindakan VARCHAR(100) NOT NULL,
    deskripsi_tindakan VARCHAR(255) NOT NULL,
    biaya NUMERIC(12,2) NOT NULL,
    id_pemeriksaan VARCHAR(10) NOT NULL REFERENCES pemeriksaan(id_pemeriksaan)
);

-- 14. Rekam medis
CREATE TABLE IF NOT EXISTS rekam_medis (
    id_rekam_medis VARCHAR(10) PRIMARY KEY,
    tanggal_rekam_medis DATE NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    catatan VARCHAR(255),
    status_validasi VARCHAR(20) NOT NULL,
    id_pemeriksaan VARCHAR(10) NOT NULL REFERENCES pemeriksaan(id_pemeriksaan)
);

-- 15. Resep
CREATE TABLE IF NOT EXISTS resep (
    id_resep VARCHAR(10) PRIMARY KEY,
    no_resep VARCHAR(20) NOT NULL UNIQUE,
    tanggal_resep DATE NOT NULL,
    isi_resep VARCHAR(255) NOT NULL,
    id_rekam_medis VARCHAR(10) NOT NULL REFERENCES rekam_medis(id_rekam_medis)
);

-- 16. Pembayaran
CREATE TABLE IF NOT EXISTS pembayaran (
    id_pembayaran VARCHAR(10) PRIMARY KEY,
    jumlah_pembayaran NUMERIC(12,2) NOT NULL,
    metode_pembayaran VARCHAR(20) NOT NULL,
    tanggal_pembayaran DATE NOT NULL,
    status_pembayaran INTEGER NOT NULL,
    id_manajer VARCHAR(10) NOT NULL REFERENCES manajer_klinik(id_manajer),
    id_pasien VARCHAR(10) NOT NULL REFERENCES pasien(id_pasien),
    id_kunjungan VARCHAR(10) REFERENCES kunjungan(id_kunjungan)
);

-- 17. Bukti Pembayaran
CREATE TABLE IF NOT EXISTS bukti_pembayaran (
    id_pembayaran VARCHAR(10) PRIMARY KEY REFERENCES pembayaran(id_pembayaran),
    nama_file VARCHAR(255) NOT NULL,
    tipe_file VARCHAR(50) NOT NULL,
    isi_file BYTEA NOT NULL,
    tanggal_unggah TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. Kritik dan Saran
CREATE TABLE IF NOT EXISTS kritik_saran (
    id_kritik_saran VARCHAR(10) PRIMARY KEY,
    isi_kritik_saran VARCHAR(255) NOT NULL,
    tanggal_pengiriman DATE NOT NULL,
    status_tindak_lanjut VARCHAR(30),
    catatan_tindak_lanjut VARCHAR(255),
    id_pasien VARCHAR(10) NOT NULL REFERENCES pasien(id_pasien),
    id_owner VARCHAR(10) NOT NULL REFERENCES owner(id_owner)
);

-- 19. Tampilan Menu
CREATE TABLE IF NOT EXISTS tampilan_menu (
    id_menu VARCHAR(10) PRIMARY KEY,
    registrasi VARCHAR(50),
    login VARCHAR(50),
    booking_kunjungan VARCHAR(50),
    lihat_jadwal_dokter VARCHAR(50),
    kritik_dan_saran VARCHAR(255),
    catatan_pasien VARCHAR(255),
    pemeriksaan VARCHAR(255),
    rekam_medis VARCHAR(255),
    resep VARCHAR(255),
    id_akun VARCHAR(10) REFERENCES akun_pengguna(id_akun)
);

COMMIT;
