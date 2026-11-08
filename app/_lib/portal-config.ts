export type PortalAction = {
  label: string;
  section: string;
  variant?: "primary" | "secondary" | "danger";
};

export type PortalScreen = {
  section: string;
  parent: string;
  title: string;
  description: string;
  kind: "dashboard" | "list" | "form" | "detail" | "review" | "confirmation" | "status";
  columns?: string[];
  fields?: string[];
  actions?: PortalAction[];
};

export type PortalMenuItem = {
  label: string;
  section: string;
};

export type PortalRoleSlug =
  | "manajer-klinik"
  | "dokter"
  | "perawat"
  | "owner"
  | "pasien";

export type PortalRole = {
  slug: PortalRoleSlug;
  label: string;
  initials: string;
  menu: PortalMenuItem[];
  screens: PortalScreen[];
};

const action = (
  label: string,
  section: string,
  variant: PortalAction["variant"] = "secondary",
): PortalAction => ({ label, section, variant });

const screen = (
  section: string,
  parent: string,
  title: string,
  kind: PortalScreen["kind"],
  description: string,
  options: Pick<PortalScreen, "columns" | "fields" | "actions"> = {},
): PortalScreen => ({
  section,
  parent,
  title,
  kind,
  description,
  ...options,
});

export const portalRoles: PortalRole[] = [
  {
    slug: "manajer-klinik",
    label: "Manajer Klinik",
    initials: "MK",
    menu: [
      { label: "Dashboard", section: "" },
      { label: "Data Pasien", section: "data-pasien" },
      { label: "Data Pelayanan", section: "data-pelayanan" },
      { label: "Data Dokter", section: "data-dokter" },
      { label: "Jadwal Dokter", section: "jadwal-dokter" },
      { label: "Kunjungan Pasien", section: "kunjungan-pasien" },
      { label: "Pembayaran", section: "pembayaran" },
      { label: "Informasi Klinik", section: "informasi-klinik" },
    ],
    screens: [
      screen("", "", "Dashboard Manajer Klinik", "dashboard", "Ringkasan pengelolaan klinik."),
      screen("data-pasien", "data-pasien", "Data Pasien", "list", "Kelola data dan pengajuan registrasi pasien.", {
        columns: ["Nama Pasien", "ID Pasien", "Kontak", "Status", "Aksi"],
        actions: [
          action("Tambah Data Pasien", "data-pasien/tambah", "primary"),
          action("Pengajuan Registrasi", "pengajuan-registrasi"),
        ],
      }),
      screen("data-pasien/tambah", "data-pasien", "Tambah Data Pasien", "form", "Lengkapi data pasien.", {
        fields: ["ID Pasien", "Nama Pasien", "Tanggal Lahir", "Alamat Jalan", "No. HP", "Kode Pos", "Username", "Password"],
      }),
      screen("data-pasien/tambah/periksa", "data-pasien", "Periksa Kembali Data Pasien", "review", "Periksa kembali isian sebelum disimpan."),
      screen("data-pasien/detail", "data-pasien", "Detail Data Pasien", "detail", "Informasi pasien.", {
        columns: ["ID Pasien", "Nama Pasien", "Tanggal Lahir", "No. HP", "Alamat Jalan", "Kode Pos", "Username"],
        actions: [
          action("Edit Data Pasien", "data-pasien/edit", "primary"),
          action("Hapus Data Pasien", "data-pasien/hapus", "danger"),
        ],
      }),
      screen("data-pasien/edit", "data-pasien", "Edit Data Pasien", "form", "Ubah data pasien.", {
        fields: ["Nama Pasien", "Tanggal Lahir", "Alamat Jalan", "No. HP", "Kode Pos"],
      }),
      screen("data-pasien/hapus", "data-pasien", "Konfirmasi Hapus Data", "confirmation", "Konfirmasi penghapusan data pasien."),
      screen("data-pasien/hapus/tidak-dapat", "data-pasien", "Data Pasien Tidak Dapat Dihapus", "status", "Data pasien memiliki riwayat klinis yang harus dipertahankan."),
      screen("data-pasien/sudah-terdaftar", "data-pasien", "Data Pasien Sudah Terdaftar", "status", "Periksa kembali kecocokan identitas pasien."),
      screen("data-pasien/belum-terdaftar", "data-pasien", "Data Pasien Belum Terdaftar", "status", "Pastikan identitas pasien sudah diperiksa."),
      screen("pengajuan-registrasi", "data-pasien", "Pengajuan Registrasi Pasien", "list", "Tinjau pengajuan registrasi pasien.", {
        columns: ["Nama Pasien", "Tanggal Pengajuan", "Status", "Aksi"],
        actions: [action("Kembali ke Daftar Pasien", "data-pasien")],
      }),
      screen("pengajuan-registrasi/detail", "data-pasien", "Detail Pengajuan Registrasi", "detail", "Periksa data pengajuan registrasi pasien."),
      screen("pengajuan-registrasi/disetujui", "data-pasien", "Registrasi Pasien Disetujui", "status", "Status pengajuan registrasi."),
      screen("pengajuan-registrasi/perbaikan", "data-pasien", "Perbaikan Registrasi Diminta", "status", "Status pengajuan registrasi."),
      screen("pengajuan-registrasi/ditolak", "data-pasien", "Registrasi Pasien Ditolak", "status", "Status pengajuan registrasi."),
      screen("data-dokter", "data-dokter", "Daftar Dokter", "list", "Kelola data dokter.", {
        columns: ["ID Dokter", "Nama Dokter", "Spesialisasi", "Aksi"],
        actions: [action("Tambah Data Dokter", "data-dokter/tambah", "primary")],
      }),
      screen("data-dokter/tambah", "data-dokter", "Tambah Data Dokter", "form", "Lengkapi data dokter.", {
        fields: ["ID Dokter", "Nama Dokter", "No. HP", "Spesialisasi", "Username", "Password"],
      }),
      screen("data-dokter/tambah/periksa", "data-dokter", "Periksa Kembali Data Dokter", "review", "Periksa kembali isian sebelum disimpan."),
      screen("data-dokter/detail", "data-dokter", "Detail Data Dokter", "detail", "Informasi dokter.", {
        columns: ["ID Dokter", "Nama Dokter", "Spesialisasi", "No. HP"],
        actions: [
          action("Edit Data Dokter", "data-dokter/edit", "primary"),
          action("Hapus Data Dokter", "data-dokter/hapus", "danger"),
        ],
      }),
      screen("data-dokter/edit", "data-dokter", "Edit Data Dokter", "form", "Ubah data dokter.", {
        fields: ["Nama Dokter", "No. HP", "Spesialisasi"],
      }),
      screen("data-dokter/hapus", "data-dokter", "Hapus Data Dokter", "confirmation", "Konfirmasi penghapusan data dokter."),
      screen("data-dokter/hapus/tidak-dapat", "data-dokter", "Data Dokter Tidak Dapat Dihapus", "status", "Dokter memiliki jadwal atau riwayat pemeriksaan yang harus dipertahankan."),
      screen("jadwal-dokter", "jadwal-dokter", "Jadwal Praktik Dokter", "list", "Kelola waktu praktik dan ketersediaan dokter.", {
        columns: ["Dokter", "Hari / Tanggal", "Jam Praktik", "Booking", "Status", "Aksi"],
        actions: [action("Tambah Jadwal Dokter", "jadwal-dokter/tambah", "primary")],
      }),
      screen("jadwal-dokter/tambah", "jadwal-dokter", "Tambah Jadwal Dokter", "form", "Lengkapi jadwal praktik dokter.", {
        fields: ["Dokter", "Hari", "Jam Mulai", "Jam Selesai", "Status Jadwal"],
      }),
      screen("jadwal-dokter/tambah/periksa", "jadwal-dokter", "Periksa Kembali Jadwal", "review", "Periksa kembali isian jadwal sebelum disimpan."),
      screen("jadwal-dokter/tambah/bentrok", "jadwal-dokter", "Jadwal Dokter Bentrok", "status", "Periksa kembali ketersediaan jadwal dokter."),
      screen("jadwal-dokter/tambah/tersedia", "jadwal-dokter", "Jadwal Tersedia", "status", "Pemeriksaan tidak menemukan jadwal praktik lain pada waktu yang dipilih."),
      screen("jadwal-dokter/detail", "jadwal-dokter", "Detail Jadwal Dokter", "detail", "Informasi jadwal praktik dokter.", {
        columns: ["Dokter", "Hari", "Jam Mulai", "Jam Selesai", "Jumlah Booking", "Status Jadwal"],
        actions: [
          action("Edit Jadwal", "jadwal-dokter/edit", "primary"),
          action("Hapus Jadwal", "jadwal-dokter/hapus", "danger"),
        ],
      }),
      screen("jadwal-dokter/edit", "jadwal-dokter", "Edit Jadwal Dokter", "form", "Ubah jadwal praktik dokter.", {
        fields: ["Dokter", "Hari", "Jam Mulai", "Jam Selesai", "Status Jadwal"],
      }),
      screen("jadwal-dokter/hapus", "jadwal-dokter", "Konfirmasi Hapus Jadwal", "confirmation", "Konfirmasi penghapusan jadwal dokter."),
      screen("jadwal-dokter/hapus/tidak-dapat", "jadwal-dokter", "Jadwal Tidak Dapat Dihapus", "status", "Jadwal yang memiliki booking tidak dapat dihapus."),
      screen("kunjungan-pasien", "kunjungan-pasien", "Daftar Kunjungan Pasien", "list", "Tinjau dan konfirmasi booking pasien.", {
        columns: ["Dokter", "Tanggal", "Waktu", "Keluhan", "Status", "Aksi"],
      }),
      screen("kunjungan-pasien/detail", "kunjungan-pasien", "Detail Kunjungan Pasien", "detail", "Periksa data booking sebelum memberikan keputusan.", {
        columns: ["Dokter", "Tanggal", "Waktu", "Layanan", "Keluhan", "Status"],
      }),
      screen("pembayaran", "pembayaran", "Daftar Pembayaran", "list", "Tinjau pembayaran pasien.", {
        columns: ["ID Pembayaran", "Pasien", "Jumlah", "Tanggal", "Status", "Metode", "Aksi"],
      }),
      screen("pembayaran/verifikasi", "pembayaran", "Detail Verifikasi Pembayaran", "detail", "Periksa detail pembayaran pasien.", { columns: ["ID Pembayaran", "Pasien", "Jumlah", "Tanggal", "Status", "Metode"] }),
      screen("pembayaran/lunas", "pembayaran", "Pembayaran Lunas", "status", "Status pembayaran."),
      screen("pembayaran/ditolak", "pembayaran", "Pembayaran Ditolak", "status", "Status pembayaran."),
      screen("informasi-klinik", "informasi-klinik", "Daftar Informasi Klinik", "list", "Kelola informasi klinik.", {
        columns: ["Judul", "Tanggal", "Status", "Aksi"],
        actions: [action("Tambah Informasi Klinik", "informasi-klinik/tambah", "primary")],
      }),
      screen("informasi-klinik/tambah", "informasi-klinik", "Tambah Informasi Klinik", "form", "Lengkapi informasi klinik.", {
        fields: ["Judul", "Isi Informasi", "Tanggal Publikasi"],
      }),
      screen("informasi-klinik/tambah/periksa", "informasi-klinik", "Periksa Kembali Informasi Klinik", "review", "Periksa kembali informasi sebelum disimpan."),
      screen("informasi-klinik/detail", "informasi-klinik", "Detail Informasi Klinik", "detail", "Informasi klinik.", { columns: ["Judul", "Tanggal Publikasi", "Isi Informasi"], actions: [action("Edit Informasi", "informasi-klinik/edit"), action("Hapus Informasi", "informasi-klinik/hapus", "danger")] }),
      screen("informasi-klinik/edit", "informasi-klinik", "Edit Informasi Klinik", "form", "Ubah informasi klinik.", { fields: ["Judul", "Isi Informasi", "Tanggal Publikasi"] }),
      screen("informasi-klinik/hapus", "informasi-klinik", "Hapus Informasi Klinik", "confirmation", "Konfirmasi penghapusan informasi klinik."),
      screen("data-pelayanan", "data-pelayanan", "Daftar Jenis Pelayanan", "list", "Kelola jenis pelayanan klinik.", {
        columns: ["ID Pelayanan", "Nama Pelayanan", "Deskripsi", "Biaya", "Aksi"],
        actions: [action("Tambah Data Pelayanan", "data-pelayanan/tambah", "primary")],
      }),
      screen("data-pelayanan/tambah", "data-pelayanan", "Tambah Data Pelayanan", "form", "Lengkapi data pelayanan.", {
        fields: ["Nama Pelayanan", "Deskripsi", "Biaya"],
      }),
      screen("data-pelayanan/tambah/periksa", "data-pelayanan", "Periksa Kembali Data Pelayanan", "review", "Periksa kembali data pelayanan sebelum disimpan."),
      screen("data-pelayanan/detail", "data-pelayanan", "Detail Data Pelayanan", "detail", "Informasi jenis pelayanan.", { columns: ["ID Pelayanan", "Nama Pelayanan", "Deskripsi", "Biaya"], actions: [action("Edit Pelayanan", "data-pelayanan/edit"), action("Hapus Pelayanan", "data-pelayanan/hapus", "danger")] }),
      screen("data-pelayanan/edit", "data-pelayanan", "Edit Data Pelayanan", "form", "Ubah data pelayanan.", { fields: ["Nama Pelayanan", "Deskripsi", "Biaya"] }),
      screen("data-pelayanan/hapus", "data-pelayanan", "Hapus Data Pelayanan", "confirmation", "Konfirmasi penghapusan data pelayanan."),
    ],
  },
  {
    slug: "pasien",
    label: "Pasien",
    initials: "PS",
    menu: [
      { label: "Dashboard", section: "" },
      { label: "Profil Saya", section: "profil" },
      { label: "Informasi Klinik", section: "informasi-klinik" },
      { label: "Layanan", section: "layanan" },
      { label: "Booking & Kunjungan", section: "booking-kunjungan" },
      { label: "Data Dokter", section: "data-dokter" },
      { label: "Konfirmasi Kedatangan", section: "konfirmasi-kedatangan" },
      { label: "Jadwal Dokter", section: "jadwal-dokter" },
      { label: "Pembayaran", section: "pembayaran" },
      { label: "Kritik & Saran", section: "kritik-saran" },
    ],
    screens: [
      screen("", "", "Dashboard Pasien", "dashboard", "Ringkasan kunjungan dan layanan pasien."),
      screen("profil", "profil", "Profil Saya", "detail", "Data pribadi yang terhubung dengan akun pasien.", {
        columns: ["ID Pasien", "Nama Pasien", "Tanggal Lahir", "No. HP", "Alamat Jalan", "Kode Pos", "Username"],
        actions: [action("Edit Profil", "profil/edit", "primary")],
      }),
      screen("profil/edit", "profil", "Edit Profil", "form", "Perbarui data pribadi pasien.", {
        fields: ["Nama Pasien", "Tanggal Lahir", "Alamat Jalan", "No. HP", "Kode Pos"],
      }),
      screen("informasi-klinik", "informasi-klinik", "Informasi Klinik", "list", "Informasi operasional terbaru dari klinik.", {
        columns: ["Judul", "Tanggal Publikasi", "Aksi"],
      }),
      screen("informasi-klinik/detail", "informasi-klinik", "Detail Informasi Klinik", "detail", "Informasi operasional klinik.", {
        columns: ["Judul", "Tanggal Publikasi", "Isi Informasi"],
      }),
      screen("layanan", "layanan", "Layanan Klinik", "list", "Lihat jenis pelayanan dan biaya yang tersedia.", {
        columns: ["Nama Layanan", "Deskripsi", "Biaya", "Aksi"],
      }),
      screen("layanan/detail", "layanan", "Detail Layanan", "detail", "Informasi jenis pelayanan klinik.", {
        columns: ["Nama Layanan", "Deskripsi", "Biaya"],
        actions: [action("Booking Layanan", "booking-kunjungan/tambah", "primary")],
      }),
      screen("booking-kunjungan", "booking-kunjungan", "Booking dan Kunjungan", "list", "Kelola booking dan riwayat kunjungan.", {
        columns: ["Dokter", "Tanggal", "Waktu", "Keluhan", "Status", "Aksi"],
        actions: [action("Booking Kunjungan", "booking-kunjungan/tambah", "primary"), action("Riwayat Booking", "booking-kunjungan/riwayat")],
      }),
      screen("booking-kunjungan/tambah", "booking-kunjungan", "Booking Kunjungan", "form", "Pilih jadwal dan lengkapi keluhan awal.", {
        fields: ["Dokter", "Tanggal Kunjungan", "Jadwal Praktik", "Waktu Kunjungan", "Jenis Layanan", "Keluhan Awal"],
      }),
      screen("booking-kunjungan/tambah/periksa-jadwal", "booking-kunjungan", "Periksa Booking Jadwal", "review", "Periksa kembali jadwal kunjungan yang dipilih."),
      screen("booking-kunjungan/tersimpan", "booking-kunjungan", "Booking Tersimpan", "status", "Status booking kunjungan."),
      screen("booking-kunjungan/detail", "booking-kunjungan", "Detail Booking", "detail", "Informasi booking kunjungan.", {
        columns: ["Dokter", "Layanan", "Tanggal", "Waktu", "Status Kedatangan", "Nomor Booking"],
        actions: [
          action("Ubah Booking", "booking-kunjungan/ubah", "primary"),
          action("Batalkan Booking", "booking-kunjungan/dibatalkan", "danger"),
          action("Hapus Booking", "booking-kunjungan/hapus", "danger"),
        ],
      }),
      screen("booking-kunjungan/ubah", "booking-kunjungan", "Ubah Booking", "form", "Ubah jadwal booking kunjungan.", {
        fields: ["Jadwal Baru", "Tanggal Kunjungan", "Waktu Kunjungan", "Jenis Layanan", "Keluhan Awal"],
      }),
      screen("booking-kunjungan/ubah/periksa", "booking-kunjungan", "Perubahan Booking Belum Valid", "review", "Periksa kembali perubahan booking."),
      screen("booking-kunjungan/riwayat", "booking-kunjungan", "Riwayat Booking", "list", "Riwayat booking kunjungan.", {
        columns: ["Tanggal", "Dokter", "Keluhan", "Status", "Aksi"],
      }),
      screen("booking-kunjungan/hapus", "booking-kunjungan", "Konfirmasi Hapus Booking", "confirmation", "Konfirmasi penghapusan booking."),
      screen("booking-kunjungan/hapus/tidak-dapat", "booking-kunjungan", "Booking Tidak Dapat Dihapus", "status", "Status booking."),
      screen("booking-kunjungan/dibatalkan", "booking-kunjungan", "Konfirmasi Pembatalan Booking", "confirmation", "Konfirmasi pembatalan booking."),
      screen("booking-kunjungan/dibatalkan/selesai", "booking-kunjungan", "Booking Dibatalkan", "status", "Status booking."),
      screen("booking-kunjungan/dibatalkan/tidak-dapat", "booking-kunjungan", "Booking Tidak Dapat Dibatalkan", "status", "Status booking."),
      screen("data-dokter", "data-dokter", "Daftar Dokter", "list", "Lihat informasi dokter klinik.", {
        columns: ["Nama Dokter", "Kompetensi", "Aksi"],
      }),
      screen("data-dokter/detail", "data-dokter", "Detail Data Dokter", "detail", "Informasi dokter dan jadwal praktik.", {
        columns: ["ID Dokter", "Nama Dokter", "Spesialisasi", "No. HP", "Jadwal Praktik"],
        actions: [
          action("Booking Kunjungan", "booking-kunjungan/tambah", "primary"),
          action("Lihat Jadwal Dokter", "jadwal-dokter"),
        ],
      }),
      screen("konfirmasi-kedatangan", "konfirmasi-kedatangan", "Konfirmasi Kedatangan", "list", "Konfirmasi kedatangan sesuai jadwal kunjungan.", {
        columns: ["Dokter", "Tanggal", "Waktu", "Status", "Aksi"],
      }),
      screen("konfirmasi-kedatangan/selesai", "konfirmasi-kedatangan", "Kedatangan Terkonfirmasi", "status", "Status konfirmasi kedatangan."),
      screen("konfirmasi-kedatangan/tidak-berlaku", "konfirmasi-kedatangan", "Konfirmasi Kedatangan Tidak Berlaku", "status", "Status konfirmasi kedatangan."),
      screen("jadwal-dokter", "jadwal-dokter", "Jadwal Dokter", "list", "Lihat jadwal praktik dokter.", {
        columns: ["Dokter", "Spesialisasi", "Hari", "Jam Praktik", "Status", "Aksi"],
      }),
      screen("jadwal-dokter/detail", "jadwal-dokter", "Detail Dokter dan Jadwal", "detail", "Informasi dokter dan jadwal praktik.", {
        columns: ["Dokter", "Hari Praktik", "Jam Mulai", "Jam Selesai", "Jumlah Kunjungan", "Status Jadwal"],
        actions: [action("Booking Jadwal Ini", "booking-kunjungan/tambah", "primary")],
      }),
      screen("pembayaran/detail", "pembayaran", "Detail Pembayaran", "detail", "Informasi tagihan dan status pembayaran.", { columns: ["ID Pembayaran", "Pasien", "Jumlah", "Tanggal", "Status", "Metode"], actions: [action("Pilih Pembayaran", "pembayaran/transfer", "primary")] }),
      screen("pembayaran/transfer", "pembayaran", "Pembayaran melalui Transfer Bank", "form", "Lengkapi informasi pembayaran.", {
        fields: ["Metode Pembayaran", "Bukti Pembayaran"],
      }),
      screen("pembayaran/bukti-terkirim", "pembayaran", "Bukti Pembayaran Terkirim", "status", "Status bukti pembayaran."),
      screen("pembayaran/lunas", "pembayaran", "Pembayaran Lunas", "status", "Status pembayaran."),
      screen("pembayaran/ditolak", "pembayaran", "Pembayaran Ditolak", "status", "Periksa kembali bukti pembayaran Anda. Anda dapat mengunggah ulang bukti pembayaran yang sesuai."),
      screen("kritik-saran", "kritik-saran", "Kritik dan Saran", "form", "Kirimkan kritik dan saran.", {
        fields: ["Isi Kritik dan Saran"],
      }),
      screen("kritik-saran/belum-lengkap", "kritik-saran", "Masukan Belum Lengkap", "status", "Periksa formulir dan lengkapi kolom wajib."),
      screen("kritik-saran/terkirim", "kritik-saran", "Masukan Terkirim", "status", "Status kritik dan saran."),
    ],
  },
  {
    slug: "dokter",
    label: "Dokter",
    initials: "DR",
    menu: [
      { label: "Dashboard", section: "" },
      { label: "Jadwal Saya", section: "jadwal-saya" },
      { label: "Kunjungan Pasien", section: "kunjungan-pasien" },
      { label: "Rekam Medis", section: "rekam-medis" },
      { label: "Resep", section: "resep" },
    ],
    screens: [
      screen("", "", "Dashboard Dokter", "dashboard", "Ringkasan jadwal dan kunjungan pasien."),
      screen("jadwal-saya", "jadwal-saya", "Jadwal Praktik Saya", "list", "Lihat jadwal praktik dokter.", {
        columns: ["Hari / Tanggal", "Jam Praktik", "Jenis Pelayanan", "Kunjungan", "Status", "Aksi"],
      }),
      screen("jadwal-saya/detail", "jadwal-saya", "Detail Jadwal", "detail", "Informasi jadwal praktik.", {
        columns: ["Dokter", "Hari", "Jam Mulai", "Jam Selesai", "Jumlah Booking", "Status"],
      }),
      screen("kunjungan-pasien", "kunjungan-pasien", "Daftar Kunjungan Pasien", "list", "Tinjau kunjungan pasien.", {
        columns: ["Pasien", "Nomor RM", "Layanan / Keluhan", "Waktu", "Status", "Aksi"],
      }),
      screen("kunjungan-pasien/detail", "kunjungan-pasien", "Detail Kunjungan Pasien", "detail", "Informasi kunjungan pasien.", {
        columns: ["Pasien", "Nomor RM", "Layanan", "Keluhan", "Waktu", "Status"],
        actions: [action("Tambah Rekam Medis", "rekam-medis/tambah", "primary")],
      }),
      screen("rekam-medis", "rekam-medis", "Rekam Medis Pasien", "list", "Tinjau rekam medis pasien.", {
        columns: ["Pasien", "Nomor RM", "Tanggal", "Diagnosis / Tindakan", "Status Catatan", "Aksi"],
      }),
      screen("rekam-medis/detail", "rekam-medis", "Detail Rekam Medis", "detail", "Informasi rekam medis pasien.", {
        columns: ["Pasien", "Nomor RM", "Tanggal", "Dokter", "Perawat", "Keluhan", "Hasil Pemeriksaan", "Diagnosis", "Tindakan", "Catatan", "Status Catatan"],
        actions: [action("Tambah Resep", "resep/tambah", "primary"), action("Ubah Catatan", "rekam-medis/edit"), action("Hapus Catatan", "rekam-medis/hapus", "danger")],
      }),
      screen("rekam-medis/tambah", "rekam-medis", "Form Rekam Medis", "form", "Lengkapi hasil pemeriksaan pasien.", {
        fields: ["Perawat", "Keluhan", "Hasil Pemeriksaan", "Catatan Pemeriksaan", "Diagnosis", "Tindakan", "Catatan"],
      }),
      screen("rekam-medis/edit", "rekam-medis", "Ubah Catatan Rekam Medis", "form", "Perbarui catatan pasien.", { fields: ["Diagnosis", "Catatan"] }),
      screen("rekam-medis/hapus", "rekam-medis", "Hapus Rekam Medis", "confirmation", "Catatan tervalidasi atau yang memiliki resep tidak dapat dihapus.", {
        columns: ["Pasien", "Nomor RM", "Tanggal", "Diagnosis / Tindakan", "Status Catatan"],
      }),
      screen("rekam-medis/tambah/resep", "rekam-medis", "Informasi Resep", "form", "Lengkapi informasi resep jika diperlukan.", {
        fields: ["Nomor Resep", "Tanggal Resep", "Isi Resep"],
      }),
      screen("rekam-medis/tambah/tersimpan", "rekam-medis", "Rekam Medis Tersimpan", "status", "Status rekam medis."),
      screen("rekam-medis/tambah/tidak-valid", "rekam-medis", "Rekam Medis Tidak Valid", "status", "Status rekam medis."),
      screen("resep", "resep", "Daftar Resep", "list", "Lihat resep yang tersimpan.", {
        columns: ["Nomor Resep", "Tanggal", "Isi Resep", "Aksi"],
      }),
      screen("resep/detail", "resep", "Detail Resep Pasien", "detail", "Informasi resep pasien.", { columns: ["Nama Pasien", "Nomor Rekam Medis", "Nomor Resep", "Tanggal Resep", "Isi Resep"], actions: [action("Ubah Resep", "resep/edit"), action("Hapus Resep", "resep/hapus", "danger")] }),
      screen("resep/edit", "resep", "Ubah Resep", "form", "Perbarui resep pasien.", { fields: ["Nomor Resep", "Tanggal Resep", "Isi Resep"] }),
      screen("resep/tambah", "resep", "Tambah Resep", "form", "Lengkapi informasi resep.", {
        fields: ["Rekam Medis", "Nomor Resep", "Tanggal Resep", "Isi Resep"],
      }),
      screen("resep/tambah/tersimpan", "resep", "Resep Disimpan", "status", "Status resep."),
      screen("resep/tambah/tidak-valid", "resep", "Resep Tidak Valid", "status", "Status resep."),
      screen("resep/hapus", "resep", "Hapus Resep", "confirmation", "Konfirmasi penghapusan resep.", {
        columns: ["Nomor Resep", "Tanggal", "Isi Resep"],
      }),
      screen("resep/hapus/tidak-dapat", "resep", "Resep Tidak Dapat Dihapus", "status", "Status resep."),
      screen("riwayat-pasien", "riwayat-pasien", "Riwayat Pasien", "list", "Tinjau riwayat pasien yang ditangani.", {
        columns: ["Nama Pasien", "Nomor RM", "Tanggal", "Diagnosis / Tindakan", "Aksi"],
      }),
      screen("riwayat-pasien/detail", "riwayat-pasien", "Detail Riwayat Pasien", "detail", "Informasi riwayat perawatan pasien.", {
        columns: ["Pasien", "Nomor RM", "Tanggal", "Dokter", "Perawat", "Keluhan", "Hasil Pemeriksaan", "Diagnosis", "Tindakan", "Catatan", "Status Catatan"],
      }),
    ],
  },
  {
    slug: "owner",
    label: "Owner",
    initials: "OW",
    menu: [
      { label: "Dashboard", section: "" },
      { label: "Rekap pelayanan", section: "rekap-pelayanan" },
      { label: "Informasi operasional", section: "informasi-operasional" },
      { label: "Kritik & Saran", section: "informasi-operasional/kritik-pasien" },
      { label: "Laporan klinik", section: "laporan-klinik" },
    ],
    screens: [
      screen("", "", "Dashboard Owner", "dashboard", "Selamat datang, owner Praya Dental Care.", {
        actions: [
          action("Lihat Rekap Pelayanan", "rekap-pelayanan", "primary"),
          action("Informasi Operasional", "informasi-operasional"),
          action("Laporan Klinik", "laporan-klinik"),
        ],
      }),
      screen("rekap-pelayanan", "", "Rekap Pelayanan", "list", "Pilih periode untuk melihat rekap pelayanan berdasarkan data yang tersedia.", {
        columns: ["Data Rekap", "Cakupan", "Keterangan"],
        actions: [action("Tampilkan Rekap", "rekap-pelayanan/hasil", "primary")],
      }),
      screen("rekap-pelayanan/hasil", "rekap-pelayanan", "Hasil Rekap Pelayanan", "list", "Rekap ditampilkan sesuai periode yang dipilih.", {
        columns: ["Jenis Data", "Periode", "Jumlah/Ringkasan"],
        actions: [
          action("Ubah Pilihan", "rekap-pelayanan"),
          action("Menu Utama", ""),
        ],
      }),
      screen("informasi-operasional", "", "Informasi Operasional Klinik", "list", "Pilih kategori informasi klinik yang ingin ditinjau.", {
        columns: ["Kategori", "Ringkasan", "Aksi"],
        actions: [
          action("Pilih Kritik", "informasi-operasional/kritik-pasien"),
          action("Pilih Saran", "informasi-operasional/kritik-pasien"),
        ],
      }),
      screen("informasi-operasional/kritik-pasien", "informasi-operasional", "Kritik Pasien", "list", "Tinjau masukan pasien dan pilih masukan yang perlu ditindaklanjuti.", {
        columns: ["Tanggal", "Isi Kritik", "Status Tindak Lanjut", "Aksi"],
        actions: [action("Detail Kritik", "informasi-operasional/kritik-pasien/detail")],
      }),
      screen("informasi-operasional/kritik-pasien/detail", "informasi-operasional/kritik-pasien", "Detail Kritik", "form", "Tinjau masukan pasien dan catat tindak lanjut apabila diperlukan.", {
        fields: ["Status Tindak Lanjut", "Catatan Tindak Lanjut"],
      }),
      screen("laporan-klinik", "", "Laporan Klinik", "list", "Pilih jenis laporan dan periode untuk melihat hasil sesuai pilihan.", {
        columns: ["Pilihan", "Cakupan", "Keterangan"],
        actions: [action("Tampilkan Laporan", "laporan-klinik/hasil", "primary")],
      }),
      screen("laporan-klinik/hasil", "laporan-klinik", "Hasil Laporan Klinik", "list", "Laporan ditampilkan sesuai jenis laporan dan periode yang dipilih.", {
        columns: ["Jenis Laporan", "Periode", "Ringkasan"],
        actions: [
          action("Ubah Pilihan", "laporan-klinik"),
          action("Menu Utama", ""),
        ],
      }),
    ],
  },
  {
    slug: "perawat",
    label: "Perawat",
    initials: "PR",
    menu: [
      { label: "Dashboard", section: "" },
      { label: "Data Dokter", section: "data-dokter" },
    ],
    screens: [
      screen("", "", "Dashboard Perawat", "dashboard", "Pantau status pelayanan setiap kunjungan.", {
        actions: [action("Lihat Daftar Status Kunjungan", "status-kunjungan", "primary")],
      }),
      screen("data-dokter", "data-dokter", "Daftar Dokter", "list", "Lihat data dokter klinik.", {
        columns: ["ID Dokter", "Nama Dokter", "Spesialisasi"],
      }),
      screen("status-kunjungan", "status-kunjungan", "Daftar Status Kunjungan", "list", "Pantau status pelayanan setiap kunjungan.", {
        columns: ["No.", "Nama Pasien", "Waktu Kunjungan", "Layanan", "Status", "Aksi"],
        actions: [action("Tambah Status Kunjungan", "status-kunjungan/tambah", "primary")],
      }),
      screen("status-kunjungan/detail", "status-kunjungan", "Detail Status Kunjungan", "detail", "Periksa status kunjungan sebelum melakukan perubahan atau penghapusan.", {
        columns: ["Nama Pasien", "Nomor Rekam Medis", "Waktu Kunjungan", "Layanan", "Status"],
        actions: [
          action("Ubah Status", "status-kunjungan/ubah", "primary"),
          action("Hapus Status", "status-kunjungan/hapus", "danger"),
        ],
      }),
      screen("status-kunjungan/tambah", "status-kunjungan", "Tambah Status Kunjungan", "form", "Sistem memeriksa urutan status sebelum menyimpan.", {
        fields: ["Status Saat Ini", "Status Baru"],
      }),
      screen("status-kunjungan/tambah/validasi", "status-kunjungan", "Validasi Status Baru", "review", "Periksa apakah status baru sesuai urutan pelayanan."),
      screen("status-kunjungan/tambah/tersimpan", "status-kunjungan", "Status Kunjungan Ditambahkan", "status", "Status kunjungan ditambahkan."),
      screen("status-kunjungan/tambah/tidak-valid", "status-kunjungan", "Status Baru Tidak Sesuai", "status", "Status baru belum dapat disimpan."),
      screen("status-kunjungan/ubah", "status-kunjungan", "Ubah Status Kunjungan", "form", "Sistem memeriksa urutan status sebelum menyimpan.", {
        fields: ["Status Saat Ini", "Status Baru"],
      }),
      screen("status-kunjungan/ubah/validasi", "status-kunjungan", "Validasi Perubahan Status", "review", "Periksa apakah status baru sesuai urutan pelayanan."),
      screen("status-kunjungan/ubah/tidak-valid", "status-kunjungan", "Perubahan Status Tidak Sesuai", "status", "Perubahan status belum dapat disimpan."),
      screen("status-kunjungan/hapus", "status-kunjungan", "Hapus Status Kunjungan", "confirmation", "Pastikan identitas pasien dan kunjungan sudah benar."),
      screen("status-kunjungan/hapus/validasi", "status-kunjungan", "Validasi Penghapusan Status", "review", "Periksa status kunjungan sebelum penghapusan."),
      screen("status-kunjungan/hapus/tidak-dapat", "status-kunjungan", "Status Tidak Dapat Dihapus", "status", "Status kunjungan tidak dapat dihapus."),
      screen("status-kunjungan/hapus/selesai", "status-kunjungan", "Status Kunjungan Dihapus", "status", "Status kunjungan dihapus."),
    ],
  },
];

export function getPortalRole(slug: string) {
  return portalRoles.find((role) => role.slug === slug);
}

export function getPortalScreen(role: PortalRole, section: string) {
  return role.screens.find((candidate) => candidate.section === section);
}

export function portalHref(role: string, section: string) {
  return `/dashboard/${role}${section ? `/${section}` : ""}`;
}
