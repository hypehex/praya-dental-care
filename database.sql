
-- =====================================================
-- DATABASE SISTEM INFORMASI PRAYA DENTAL CARE
-- PostgreSQL
-- Berdasarkan ERD Final Modul II
-- =====================================================

BEGIN;

-- 1. TABEL AKUN PENGGUNA
CREATE TABLE IF NOT EXISTS akun_pengguna (
    id_akun VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    status_akun VARCHAR(20) NOT NULL
);

-- 2. TABEL KODE POS
CREATE TABLE IF NOT EXISTS kode_pos (
    kode_pos VARCHAR(5) PRIMARY KEY,
    kelurahan VARCHAR(50) NOT NULL,
    kecamatan VARCHAR(50) NOT NULL,
    kota VARCHAR(50) NOT NULL,
    provinsi VARCHAR(50) NOT NULL
);

-- 3. TABEL MANAJER KLINIK
CREATE TABLE IF NOT EXISTS manajer_klinik (
    id_manajer VARCHAR(10) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    id_akun VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

-- 4. TABEL DOKTER
CREATE TABLE IF NOT EXISTS dokter (
    id_dokter VARCHAR(10) PRIMARY KEY,
    nama_dokter VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    spesialisasi VARCHAR(50) NOT NULL,
    id_akun VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

-- 5. TABEL PERAWAT
CREATE TABLE IF NOT EXISTS perawat (
    id_perawat VARCHAR(10) PRIMARY KEY,
    nama_perawat VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    id_akun VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

-- 6. TABEL OWNER
CREATE TABLE IF NOT EXISTS owner (
    id_owner VARCHAR(10) PRIMARY KEY,
    nama_owner VARCHAR(255) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    id_akun VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

-- 7. TABEL PASIEN
CREATE TABLE IF NOT EXISTS pasien (
    id_pasien VARCHAR(10) PRIMARY KEY,
    nama_pasien VARCHAR(100) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    jenis_kelamin VARCHAR(15) NOT NULL,
    alamat_jalan VARCHAR(100) NOT NULL,
    no_hp VARCHAR(15) NOT NULL,
    kode_pos VARCHAR(5) NOT NULL,
    id_akun VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (kode_pos)
        REFERENCES kode_pos(kode_pos),
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

-- 8. TABEL JADWAL DOKTER
CREATE TABLE IF NOT EXISTS jadwal_dokter (
    id_jadwal VARCHAR(10) PRIMARY KEY,
    hari VARCHAR(10) NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    status_jadwal VARCHAR(20) NOT NULL,
    id_dokter VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_dokter)
        REFERENCES dokter(id_dokter)
);

-- 9. TABEL KUNJUNGAN
CREATE TABLE IF NOT EXISTS kunjungan (
    id_kunjungan VARCHAR(10) PRIMARY KEY,
    tanggal_kunjungan DATE NOT NULL,
    waktu_kunjungan TIME NOT NULL,
    keluhan_awal VARCHAR(255) NOT NULL,
    status_kunjungan VARCHAR(20) NOT NULL,
    id_pasien VARCHAR(10) NOT NULL,
    id_jadwal VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_pasien)
        REFERENCES pasien(id_pasien),
    FOREIGN KEY (id_jadwal)
        REFERENCES jadwal_dokter(id_jadwal)
);

-- 10. TABEL PEMERIKSAAN
CREATE TABLE IF NOT EXISTS pemeriksaan (
    id_pemeriksaan VARCHAR(10) PRIMARY KEY,
    tanggal_pemeriksaan DATE NOT NULL,
    keluhan VARCHAR(255) NOT NULL,
    hasil_pemeriksaan VARCHAR(255) NOT NULL,
    catatan_pemeriksaan VARCHAR(255),
    id_kunjungan VARCHAR(10) NOT NULL,
    id_dokter VARCHAR(10) NOT NULL,
    id_perawat VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_kunjungan)
        REFERENCES kunjungan(id_kunjungan),
    FOREIGN KEY (id_dokter)
        REFERENCES dokter(id_dokter),
    FOREIGN KEY (id_perawat)
        REFERENCES perawat(id_perawat)
);

-- 11. TABEL TINDAKAN
CREATE TABLE IF NOT EXISTS tindakan (
    id_tindakan VARCHAR(10) PRIMARY KEY,
    nama_tindakan VARCHAR(100) NOT NULL,
    deskripsi_tindakan VARCHAR(255) NOT NULL,
    biaya NUMERIC(12,2) NOT NULL,
    id_pemeriksaan VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_pemeriksaan)
        REFERENCES pemeriksaan(id_pemeriksaan)
);

-- 12. TABEL REKAM MEDIS
CREATE TABLE IF NOT EXISTS rekam_medis (
    id_rekam_medis VARCHAR(10) PRIMARY KEY,
    tanggal_rekam_medis DATE NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    catatan VARCHAR(255),
    status_validasi VARCHAR(20) NOT NULL,
    id_pemeriksaan VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_pemeriksaan)
        REFERENCES pemeriksaan(id_pemeriksaan)
);

-- 13. TABEL RESEP
CREATE TABLE IF NOT EXISTS resep (
    id_resep VARCHAR(10) PRIMARY KEY,
    no_resep VARCHAR(20) NOT NULL,
    tanggal_resep DATE NOT NULL,
    isi_resep VARCHAR(255) NOT NULL,
    id_rekam_medis VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_rekam_medis)
        REFERENCES rekam_medis(id_rekam_medis)
);

-- 14. TABEL PEMBAYARAN
CREATE TABLE IF NOT EXISTS pembayaran (
    id_pembayaran VARCHAR(10) PRIMARY KEY,
    jumlah_pembayaran NUMERIC(12,2) NOT NULL,
    metode_pembayaran VARCHAR(20) NOT NULL,
    tanggal_pembayaran DATE NOT NULL,
    status_pembayaran VARCHAR(20) NOT NULL,
    id_manajer VARCHAR(10) NOT NULL,
    id_pasien VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_manajer)
        REFERENCES manajer_klinik(id_manajer),
    FOREIGN KEY (id_pasien)
        REFERENCES pasien(id_pasien)
);

-- 15. TABEL KRITIK DAN SARAN
CREATE TABLE IF NOT EXISTS kritik_saran (
    id_kritik_saran VARCHAR(10) PRIMARY KEY,
    isi_kritik_saran VARCHAR(255) NOT NULL,
    tanggal_pengiriman DATE NOT NULL,
    status_tindak_lanjut VARCHAR(30),
    catatan_tindak_lanjut VARCHAR(255),
    id_pasien VARCHAR(10) NOT NULL,
    id_owner VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_pasien)
        REFERENCES pasien(id_pasien),
    FOREIGN KEY (id_owner)
        REFERENCES owner(id_owner)
);

-- 16. TABEL TAMPILAN MENU
-- Entitas tambahan yang tercantum pada ERD final
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
    id_akun VARCHAR(10),
    FOREIGN KEY (id_akun)
        REFERENCES akun_pengguna(id_akun)
);

COMMIT;

-- =====================================================
-- SELESAI MEMBUAT TABEL PRAYA DENTAL CARE
-- =====================================================


-- DATA AKUN PENGGUNA
INSERT INTO akun_pengguna
(id_akun, username, password, status_akun)
VALUES
('AK001', 'budi', 'budi123', 'Aktif'),
('AK002', 'siti', 'siti123', 'Aktif'),
('AK003', 'rina', 'rina123', 'Aktif'),
('AK004', 'andi', 'andi123', 'Aktif'),
('AK005', 'siti_dokter', 'siti123', 'Aktif'),
('AK006', 'bayu', 'bayu123', 'Aktif'),
('AK007', 'rani', 'rani123', 'Aktif'),
('AK008', 'suster', 'suster123', 'Aktif'),
('AK011', 'owner', 'owner123', 'Aktif')
ON CONFLICT DO NOTHING;

-- DATA KODE POS
INSERT INTO kode_pos
(kode_pos, kelurahan, kecamatan, kota, provinsi)
VALUES
('25173', 'Lolong Belanti', 'Padang Utara',
 'Padang', 'Sumatera Barat'),
('25175', 'Pasar Ambacang', 'Kuranji',
 'Padang', 'Sumatera Barat')
ON CONFLICT DO NOTHING;


-- DATA MANAJER KLINIK
INSERT INTO manajer_klinik
(id_manajer, nama, no_hp, id_akun)
VALUES
('MN001', 'Andi Wijaya', '08111222333', 'AK004')
ON CONFLICT DO NOTHING;

-- DATA DOKTER
INSERT INTO dokter
(id_dokter, nama_dokter, no_hp, spesialisasi, id_akun)
VALUES
('DR001', 'drg. Siti Aminah', '08555666777',
 'Dokter Gigi Umum', 'AK005'),

('DR002', 'drg. Bayu Prakoso', '08555666778',
 'Ortodonti', 'AK006'),

('DR003', 'drg. Rani Oktavia', '08555666779',
 'Periodonsia', 'AK007')
ON CONFLICT DO NOTHING;

-- DATA PERAWAT
INSERT INTO perawat
(id_perawat, nama_perawat, no_hp, id_akun)
VALUES
('PR001', 'Suster Neng', '08999888777', 'AK008')
ON CONFLICT DO NOTHING;

-- DATA OWNER
INSERT INTO owner
(id_owner, nama_owner, no_hp, id_akun)
VALUES
('OW001', 'Bapak. Praya', '08777666555', 'AK011')
ON CONFLICT DO NOTHING;


INSERT INTO pasien
(id_pasien, nama_pasien, tanggal_lahir, jenis_kelamin,
 alamat_jalan, no_hp, kode_pos, id_akun)
VALUES
('PS001', 'Budi Santoso', '1990-05-15', 'Laki-laki',
 'Jl. Permai No. 5', '08123456789', '25173', 'AK001'),

('PS002', 'Siti Rahma', '2001-07-25', 'Perempuan',
 'Jl. Damai No. 12', '08123456790', '25175', 'AK002'),

('PS003', 'Rina Putri', '1995-11-03', 'Perempuan',
 'Jl. Belimbing No. 20', '08123456791', '25173', 'AK003')
ON CONFLICT DO NOTHING;


INSERT INTO jadwal_dokter
(id_jadwal, hari, jam_mulai, jam_selesai,
 status_jadwal, id_dokter)
VALUES
('JD001', 'Senin', '09:00', '12:00', 'Aktif', 'DR001'),
('JD002', 'Senin', '09:00', '12:00', 'Aktif', 'DR002'),
('JD003', 'Rabu', '13:00', '16:00', 'Aktif', 'DR003')
ON CONFLICT DO NOTHING;


-- DATA KUNJUNGAN
INSERT INTO kunjungan
(id_kunjungan, tanggal_kunjungan, waktu_kunjungan,
 keluhan_awal, status_kunjungan, id_pasien, id_jadwal)
VALUES
('KJ001', '2023-10-02', '10:00',
 'Gigi berlubang dan nyeri', 'Selesai', 'PS001', 'JD001'),

('KJ002', '2023-10-02', '10:45',
 'Karang gigi menumpuk', 'Selesai', 'PS002', 'JD002'),

('KJ003', '2023-10-04', '13:30',
 'Gusi bengkak', 'Selesai', 'PS003', 'JD003')
ON CONFLICT DO NOTHING;


-- DATA PEMERIKSAAN
INSERT INTO pemeriksaan
(id_pemeriksaan, tanggal_pemeriksaan, keluhan,
 hasil_pemeriksaan, catatan_pemeriksaan,
 id_kunjungan, id_dokter, id_perawat)
VALUES
('PM001', '2023-10-02',
 'Sakit gigi geraham kiri bawah',
 'Karies gigi 36',
 'Perlu tambal dan scaling',
 'KJ001', 'DR001', 'PR001'),

('PM002', '2023-10-02',
 'Karang gigi menumpuk',
 'Kalkulus supragingival',
 'Scaling rahang atas dan bawah',
 'KJ002', 'DR002', 'PR001'),

('PM003', '2023-10-04',
 'Gusi bengkak dan mudah berdarah',
 'Gingivitis',
 'Perlu kuretase',
 'KJ003', 'DR003', 'PR001')
ON CONFLICT DO NOTHING;



INSERT INTO tindakan
(id_tindakan, nama_tindakan, deskripsi_tindakan,
 biaya, id_pemeriksaan)
VALUES
('TD001', 'Tambal Gigi',
 'Penambalan gigi berlubang', 300000, 'PM001'),

('TD002', 'Scaling',
 'Pembersihan karang gigi', 200000, 'PM001'),

('TD003', 'Scaling',
 'Pembersihan karang gigi', 200000, 'PM002'),

('TD004', 'Kuretase Gusi',
 'Pembersihan jaringan gusi', 250000, 'PM003'),

('TD005', 'Scaling',
 'Pembersihan karang gigi', 200000, 'PM003')
ON CONFLICT DO NOTHING;


-- DATA REKAM MEDIS
INSERT INTO rekam_medis
(id_rekam_medis, tanggal_rekam_medis, diagnosis,
 catatan, status_validasi, id_pemeriksaan)
VALUES
('RM001', '2023-10-02', 'Karies',
 'Pasien dianjurkan kontrol', 'Valid', 'PM001'),

('RM002', '2023-10-02', 'Kalkulus gigi',
 'Kontrol 6 bulan', 'Valid', 'PM002'),

('RM003', '2023-10-04', 'Gingivitis',
 'Kontrol 2 minggu', 'Valid', 'PM003')
ON CONFLICT DO NOTHING;


-- DATA RESEP
INSERT INTO resep
(id_resep, no_resep, tanggal_resep,
 isi_resep, id_rekam_medis)
VALUES
('RS001', 'RSP-001', '2023-10-02',
 'Asam Mefenamat 500 mg 3x1', 'RM001'),

('RS002', 'RSP-002', '2023-10-02',
 'Obat kumur chlorhexidine 2x1', 'RM002'),

('RS003', 'RSP-003', '2023-10-04',
 'Metronidazole 500 mg 3x1', 'RM003')
ON CONFLICT DO NOTHING;


-- DATA PEMBAYARAN
INSERT INTO pembayaran
(id_pembayaran, jumlah_pembayaran, metode_pembayaran,
 tanggal_pembayaran, status_pembayaran,
 id_manajer, id_pasien)
VALUES
('PB001', 500000, 'Cash', '2023-10-02',
 'Lunas', 'MN001', 'PS001'),

('PB002', 200000, 'QRIS', '2023-10-02',
 'Lunas', 'MN001', 'PS002'),

('PB003', 450000, 'Transfer', '2023-10-04',
 'Lunas', 'MN001', 'PS003')
ON CONFLICT DO NOTHING;

-- DATA KRITIK DAN SARAN
INSERT INTO kritik_saran
(id_kritik_saran, isi_kritik_saran, tanggal_pengiriman,
 status_tindak_lanjut, catatan_tindak_lanjut,
 id_pasien, id_owner)
VALUES
('KS001', 'Pelayanan baik', '2023-10-03',
 'Selesai', 'Terima kasih atas masukannya',
 'PS001', 'OW001'),

('KS002', 'Antrean agak lama', '2023-10-05',
 'Belum ditindaklanjuti', '-',
 'PS003', 'OW001')
ON CONFLICT DO NOTHING;



-- 1. Memeriksa akun pengguna
SELECT * FROM akun_pengguna;

-- 2. Memeriksa jumlah perawat
SELECT * FROM perawat;

-- 3. Memeriksa pasien
SELECT * FROM pasien;

-- 4. Memeriksa pemeriksaan
SELECT * FROM pemeriksaan;

SELECT * FROM akun_pengguna
ORDER BY id_akun;

SELECT * FROM perawat;

SELECT * FROM kunjungan;

SELECT * FROM perawat;

SELECT * FROM tindakan;

SELECT * FROM rekam_medis;

SELECT * FROM resep;

SELECT * FROM pembayaran;

SELECT * FROM kritik_saran;

SELECT 'akun_pengguna' AS nama_tabel, COUNT(*) AS jumlah FROM akun_pengguna
UNION ALL
SELECT 'kode_pos', COUNT(*) FROM kode_pos
UNION ALL
SELECT 'manajer_klinik', COUNT(*) FROM manajer_klinik
UNION ALL
SELECT 'dokter', COUNT(*) FROM dokter
UNION ALL
SELECT 'perawat', COUNT(*) FROM perawat
UNION ALL
SELECT 'owner', COUNT(*) FROM owner
UNION ALL
SELECT 'pasien', COUNT(*) FROM pasien
UNION ALL
SELECT 'jadwal_dokter', COUNT(*) FROM jadwal_dokter
UNION ALL
SELECT 'kunjungan', COUNT(*) FROM kunjungan
UNION ALL
SELECT 'pemeriksaan', COUNT(*) FROM pemeriksaan
UNION ALL
SELECT 'tindakan', COUNT(*) FROM tindakan
UNION ALL
SELECT 'rekam_medis', COUNT(*) FROM rekam_medis
UNION ALL
SELECT 'resep', COUNT(*) FROM resep
UNION ALL
SELECT 'pembayaran', COUNT(*) FROM pembayaran
UNION ALL
SELECT 'kritik_saran', COUNT(*) FROM kritik_saran;

SELECT
    pasien.nama_pasien,
    kunjungan.tanggal_kunjungan,
    kunjungan.waktu_kunjungan,
    kunjungan.keluhan_awal,
    kunjungan.status_kunjungan
FROM pasien
JOIN kunjungan
ON pasien.id_pasien = kunjungan.id_pasien
ORDER BY kunjungan.tanggal_kunjungan ASC;

SELECT
    dokter.nama_dokter,
    dokter.spesialisasi,
    jadwal_dokter.hari,
    jadwal_dokter.jam_mulai,
    jadwal_dokter.jam_selesai
FROM dokter
JOIN jadwal_dokter
ON dokter.id_dokter = jadwal_dokter.id_dokter
ORDER BY jadwal_dokter.hari ASC;

SELECT
    pasien.nama_pasien,
    dokter.nama_dokter,
    perawat.nama_perawat,
    pemeriksaan.keluhan,
    pemeriksaan.hasil_pemeriksaan,
    pemeriksaan.tanggal_pemeriksaan
FROM pemeriksaan
JOIN kunjungan
ON pemeriksaan.id_kunjungan = kunjungan.id_kunjungan
JOIN pasien
ON kunjungan.id_pasien = pasien.id_pasien
JOIN dokter
ON pemeriksaan.id_dokter = dokter.id_dokter
JOIN perawat
ON pemeriksaan.id_perawat = perawat.id_perawat
ORDER BY pemeriksaan.tanggal_pemeriksaan ASC;

SELECT COUNT(*) AS total_pasien
FROM pasien;
SELECT COUNT(*) AS total_dokter
FROM dokter;
SELECT COUNT(*) AS total_kunjungan
FROM kunjungan;
SELECT SUM(jumlah_pembayaran) AS total_pendapatan
FROM pembayaran;
SELECT SUM(biaya) AS total_biaya_tindakan
FROM tindakan;