BEGIN;
CREATE TABLE IF NOT EXISTS informasi_klinik (
  id_informasi VARCHAR(10) PRIMARY KEY,
  judul VARCHAR(100) NOT NULL,
  isi_informasi TEXT NOT NULL,
  tanggal_publikasi DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS pelayanan (
  id_pelayanan VARCHAR(10) PRIMARY KEY,
  nama_pelayanan VARCHAR(100) NOT NULL,
  deskripsi VARCHAR(255) NOT NULL,
  biaya NUMERIC(12,2) NOT NULL CHECK (biaya >= 0)
);
INSERT INTO pelayanan (id_pelayanan, nama_pelayanan, deskripsi, biaya)
VALUES
  ('DEMO001', 'Pemeriksaan dan Konsultasi Gigi', 'Pemeriksaan kondisi gigi dan konsultasi perawatan.', 100000),
  ('DEMO002', 'Pembersihan Karang Gigi (Scaling)', 'Pembersihan karang gigi oleh dokter gigi.', 200000),
  ('DEMO003', 'Penambalan Gigi', 'Perawatan gigi berlubang dengan tindakan penambalan.', 300000)
ON CONFLICT (id_pelayanan) DO UPDATE
SET nama_pelayanan = EXCLUDED.nama_pelayanan,
    deskripsi = EXCLUDED.deskripsi;
CREATE TABLE IF NOT EXISTS bukti_pembayaran (
  id_pembayaran VARCHAR(10) PRIMARY KEY REFERENCES pembayaran(id_pembayaran),
  nama_file VARCHAR(255) NOT NULL,
  tipe_file VARCHAR(50) NOT NULL,
  isi_file BYTEA NOT NULL,
  tanggal_unggah TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE kunjungan ADD COLUMN IF NOT EXISTS id_pelayanan VARCHAR(10) REFERENCES pelayanan(id_pelayanan);
ALTER TABLE akun_pengguna ADD COLUMN IF NOT EXISTS tanggal_pengajuan TIMESTAMPTZ;
COMMIT;
