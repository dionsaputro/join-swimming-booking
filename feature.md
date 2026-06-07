# Join Swimming — Feature Specifications

## F-01 · Authentication

### F-01-01 Admin Login
- Admin login menggunakan email & password via Supabase Auth
- Satu akun admin (single user)
- Session persisten (stay logged in)
- Redirect ke `/admin` setelah login berhasil
- Redirect ke `/login` jika mengakses `/admin/*` tanpa sesi aktif

---

## F-02 · Manajemen Slot Jadwal

### F-02-01 Tampilan Grid Slot Mingguan
- Halaman `/admin/schedule` menampilkan semua slot dalam format grid per hari
- Slot default yang tersedia:
  - Senin–Jumat: 17.30–18.30, 18.30–19.30
  - Sabtu–Minggu: 06.00–07.00, 07.00–08.00, 08.00–09.00
- Setiap slot menampilkan: hari, jam mulai–selesai, kapasitas maksimal, status aktif/nonaktif

### F-02-02 Edit Kapasitas Slot
- Admin bisa edit kapasitas maksimal per slot (default 7)
- Perubahan kapasitas berlaku untuk sesi mendatang
- Kapasitas minimum: 1

### F-02-03 Aktif/Nonaktifkan Slot
- Admin bisa toggle slot aktif atau nonaktif
- Slot nonaktif tidak muncul sebagai pilihan saat membuat sesi baru
- Slot nonaktif tetap terlihat di grid dengan tampilan redup

---

## F-03 · Manajemen Murid

### F-03-01 Tambah Murid Baru
- Form input data murid:
  - Nama lengkap (required)
  - Nomor telepon (required)
  - Akun Threads/Instagram (optional)
  - Level: Pemula / Menengah / Lanjut (required)
  - Catatan khusus (optional, textarea)
  - Tanggal awal join (required, default: hari ini)
- Setelah submit, sistem otomatis generate token unik 16 karakter untuk link reschedule
- Murid baru tersimpan dengan `session_type = null` (belum ada paket)

### F-03-02 Daftar Murid
- Halaman `/admin/students` menampilkan semua murid dalam list/card
- Setiap item menampilkan: nama, level (badge), paket aktif, status bayar
- Filter: by level, by status paket (aktif/selesai/trial), by status bayar
- Search by nama

### F-03-03 Detail Murid
- Halaman `/admin/students/:id` menampilkan:
  - Info profil lengkap murid
  - Paket aktif saat ini (progress sesi, tanggal berlaku, status bayar)
  - Riwayat semua paket
  - Daftar sesi (upcoming & selesai) dengan status masing-masing
  - Tombol edit data murid
  - Tombol tambah paket baru
  - Tombol convert trial → paket (muncul jika paket aktif bertipe trial)
  - Tombol salin link reschedule

### F-03-04 Edit Data Murid
- Semua field saat tambah murid bisa diedit
- Token reschedule tidak berubah saat data murid diedit

### F-03-05 Generate & Salin Link Reschedule
- Tombol "Salin Link Reschedule" di halaman detail murid
- Link format: `[domain]/s/[token]`
- Satu klik salin ke clipboard dengan feedback toast "Link disalin"

---

## F-04 · Manajemen Paket & Sesi

### F-04-01 Tambah Paket Baru
- Admin memilih dari halaman detail murid
- Form:
  - Tipe paket: Trial (1 sesi) / Paket (4 sesi)
  - Pilih slot: hari + jam (dropdown dari slot aktif)
  - Tanggal mulai (date picker)
- Setelah submit, sistem otomatis:
  - Membuat record paket dengan `end_date = start_date + 30 hari`
  - Generate sesi sebanyak total sesi (1 untuk trial, 4 untuk paket) di slot yang sama secara berurutan
  - Semua sesi berstatus `scheduled` dan `is_public = true`
- Validasi: cek kapasitas slot di setiap tanggal yang akan diisi sebelum menyimpan

### F-04-02 Validasi Kapasitas Saat Buat Sesi
- Jika salah satu tanggal dalam 4 sesi sudah penuh, tampilkan warning dan minta admin pilih tanggal alternatif
- Hitungan kapasitas mengecualikan sesi dengan status `rescheduled`

### F-04-03 Convert Trial ke Paket
- Tombol hanya muncul jika paket aktif bertipe trial
- Setelah konfirmasi, buat paket baru (4 sesi) dengan tanggal mulai = hari ini atau pilihan admin
- Paket trial lama tetap ada di riwayat

### F-04-04 Toggle Visibilitas Sesi (Public/Private)
- Admin bisa toggle `is_public` per sesi dari halaman detail murid atau absensi
- Sesi private tidak muncul di kalender publik (nama murid tidak ditampilkan), tapi slot tetap terhitung dalam kapasitas

---

## F-05 · Absensi

### F-05-01 Tandai Kehadiran
- Dari dashboard (jadwal hari ini) atau halaman `/admin/attendance`
- Pilihan status per sesi: Hadir / Tidak Hadir
- Admin bisa tambahkan catatan teks per sesi
- Status bisa diubah selama sesi belum lewat (atau boleh diubah kapan saja — sesuai kebutuhan admin)

### F-05-02 Tampilan Absensi per Tanggal
- Halaman `/admin/attendance` menampilkan date picker
- Pilih tanggal → tampilkan semua sesi di tanggal tersebut beserta status kehadiran
- Bisa tandai hadir/absen dan tambah catatan langsung dari halaman ini

---

## F-06 · Pembayaran

### F-06-01 Daftar Status Pembayaran
- Halaman `/admin/payments` menampilkan semua paket
- Per item: nama murid, tipe paket, nominal, status (Lunas / Belum Lunas), tanggal bayar
- Filter: Belum Lunas / Lunas
- Default sort: belum lunas di atas

### F-06-02 Tandai Lunas
- Tombol "Tandai Lunas" per paket
- Muncul modal konfirmasi dengan input nominal pembayaran
- Setelah konfirmasi: `is_paid = true`, `paid_at = now()`, simpan nominal

### F-06-03 Pembayaran di Detail Murid
- Status bayar paket aktif juga terlihat di halaman detail murid
- Tombol tandai lunas tersedia di sana juga

---

## F-07 · Reschedule

### F-07-01 Reschedule oleh Admin
- Admin bisa pindahkan sesi murid dari halaman detail murid
- Pilih sesi yang mau dipindah → pilih slot & tanggal baru
- Validasi: tanggal baru harus dalam `end_date` paket & kapasitas slot tidak penuh
- Tidak ada batas maksimal reschedule untuk admin
- Sesi lama berstatus `rescheduled`, sesi baru dibuat

### F-07-02 Halaman Reschedule untuk Murid (`/s/:studentToken`)
- Halaman publik, tidak perlu login
- Tampilkan nama murid (dari token) dan sesi aktifnya yang bisa direschedule
- Sesi yang bisa direschedule: status `scheduled` dan belum pernah direschedule (`reschedule_from = null`)
- Murid pilih sesi → pilih tanggal & slot baru dari kalender interaktif
- Kalender hanya tampilkan slot yang: masih dalam periode paket, kapasitas belum penuh, dan slot aktif
- Submit → buat record `reschedule_requests` dengan status `pending`
- Tampilkan pesan sukses setelah submit

### F-07-03 Approve / Reject Reschedule Request
- Request muncul di dashboard admin (section "Request Pending") dan di notifikasi badge
- Admin bisa approve atau reject
- Approve: sesi lama → `rescheduled`, sesi baru dibuat sesuai request
- Reject: request ditolak, sesi lama tetap `scheduled`
- Murid tidak mendapat notifikasi otomatis (admin informasikan manual via WA)

---

## F-08 · Dashboard Admin

### F-08-01 Jadwal Hari Ini
- Daftar semua sesi hari ini, diurutkan per slot (jam)
- Per sesi: nama murid, level, slot, status kehadiran
- Bisa langsung tandai hadir/absen dari sini

### F-08-02 Request Pending
- List reschedule request yang belum diproses
- Per item: nama murid, sesi asal, slot yang diminta, tanggal request
- Tombol approve & reject inline

### F-08-03 Pembayaran Belum Lunas
- List murid dengan paket aktif yang belum bayar
- Per item: nama murid, tipe paket, tanggal mulai paket
- Tap untuk ke halaman detail murid

### F-08-04 Mini Calendar Bulan Ini
- Calendar view satu bulan
- Setiap tanggal yang ada sesi ditandai dengan dot indicator
- Tap tanggal → tampilkan sheet/modal daftar sesi di tanggal tersebut

---

## F-09 · Kalender Publik (`/calendar`)

### F-09-01 Tampilan Kalender Bulanan
- Navigasi prev/next bulan
- Tanggal yang ada sesi ditandai visual (dot atau warna ringan)
- Tap/klik tanggal → tampilkan daftar slot hari itu

### F-09-02 Detail Slot per Hari
- Setiap slot menampilkan:
  - Jam mulai – selesai
  - Kapasitas: terisi / maksimal (misal "3/7")
  - Progress bar kapasitas
  - Nama murid yang terdaftar, dianonimkan (hanya sesi dengan `is_public = true`)
  - Badge "Penuh" jika kapasitas terisi penuh (slot tetap ditampilkan)
- Slot kosong (belum ada sesi) tetap ditampilkan agar calon murid tahu slot tersedia

### F-09-03 Anonimisasi Nama
- Format: huruf pertama setiap kata dalam nama, dipisah titik
- Contoh: "Ahmad Riyadi" → "A.R", "Siti Nur Haliza" → "S.N.H"
- Nama dengan satu kata: "Budi" → "B."

---

## F-10 · Navigasi & UX

### F-10-01 Bottom Navigation (Admin)
- 4 tab: Beranda, Murid, Jadwal, Pembayaran
- Tab aktif dengan indicator visual (pill di atas ikon)
- Badge notifikasi di tab Beranda jika ada request pending

### F-10-02 Toast Notifications
- Feedback singkat untuk aksi: simpan berhasil, link disalin, request diapprove, dll
- Muncul di atas bottom navigation, auto-dismiss 3 detik

### F-10-03 Loading & Empty States
- Skeleton loading saat fetch data
- Empty state ilustratif (teks + ikon) jika data kosong
- Error state dengan tombol retry

### F-10-04 Konfirmasi Aksi Destruktif
- Modal konfirmasi untuk: approve/reject request, tandai lunas, convert trial

---

## Catatan Non-Fungsional

- App dirancang mobile-first, diakses via browser smartphone
- Tidak ada PWA / installable (cukup browser)
- Tidak ada notifikasi push
- Tidak ada integrasi payment gateway — semua manual
- Tidak ada fitur multi-bahasa — bahasa Indonesia saja
- Data tidak dihapus secara permanen (soft delete jika diperlukan di masa depan)