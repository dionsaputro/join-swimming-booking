# Join Swimming — Agent Blueprint

## Overview

Join Swimming adalah web app manajemen jadwal untuk pelatih renang freelance. App ini memiliki dua sisi utama: **dashboard admin** (hanya untuk pelatih) dan **kalender publik** (view-only, bisa diakses siapapun via link). Ada juga halaman **reschedule** yang bisa diakses murid via link unik per murid.

---

## Tech Stack

| Layer | Pilihan | Keterangan |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR untuk halaman publik, native Vercel |
| Styling | Tailwind CSS v3 | Utility-first, konsisten |
| Animation | Framer Motion | Transisi halaman & micro-interaction |
| Backend & DB | Supabase | PostgreSQL + Auth + Realtime |
| Hosting | Vercel | Deploy dari GitHub, zero-config dengan Next.js |
| Routing | Next.js App Router | File-based routing, layout nesting |
| Server Actions | Next.js Server Actions | Mutasi data tanpa API route terpisah |
| State | Zustand | Global client state ringan |
| Date | date-fns | Manipulasi tanggal |
| Form | React Hook Form + Zod | Validasi form |
| Icons | Lucide React | Konsisten, clean |

### Rendering Strategy per Halaman

| Halaman | Strategy | Alasan |
|---|---|---|
| `/admin/*` | Client Component + Supabase client | Data real-time, butuh auth |
| `/calendar` | Server Component + ISR (revalidate 60s) | Publik, SEO-friendly, performa optimal |
| `/s/[token]` | Server Component (SSR) | Validasi token di server, aman |
| `/login` | Client Component | Form interaktif |

---

## Struktur URL & App Router

```
app/
├── page.tsx                        → redirect ke /admin atau /login
├── login/
│   └── page.tsx                    → halaman login admin
├── admin/
│   ├── layout.tsx                  → layout dengan bottom nav + auth guard
│   ├── page.tsx                    → dashboard utama
│   ├── students/
│   │   ├── page.tsx                → daftar murid
│   │   └── [id]/
│   │       └── page.tsx            → detail murid
│   ├── schedule/
│   │   └── page.tsx                → manajemen jadwal & slot
│   ├── attendance/
│   │   └── page.tsx                → absensi
│   └── payments/
│       └── page.tsx                → pembayaran
├── calendar/
│   └── page.tsx                    → kalender publik (Server Component, ISR)
└── s/
    └── [token]/
        └── page.tsx                → reschedule page murid (SSR)
```

Auth guard diimplementasikan di `admin/layout.tsx` menggunakan Supabase server-side session check. Jika tidak ada sesi aktif, redirect ke `/login`.

---

## Database Schema (Supabase / PostgreSQL)

### `slots`
Slot jadwal mingguan yang tersedia (template berulang).

```sql
id              uuid PRIMARY KEY
day_of_week     int          -- 0=Minggu, 1=Senin, ..., 6=Sabtu
start_time      time         -- '17:30:00'
end_time        time         -- '18:30:00'
max_capacity    int          -- default 7
is_active       boolean      -- bisa dinonaktifkan sementara
created_at      timestamptz
```

### `students`
Data murid yang diinput oleh admin.

```sql
id              uuid PRIMARY KEY
full_name       text
phone           text
social_handle   text         -- threads/ig
level           text         -- 'pemula' | 'menengah' | 'lanjut'
notes           text
joined_at       date         -- tanggal awal join
session_type    text         -- 'trial' | 'paket'
token           text UNIQUE  -- token unik untuk link reschedule
created_at      timestamptz
```

### `packages`
Paket renang per murid. Satu murid bisa punya lebih dari satu paket (historis).

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
session_type    text         -- 'trial' | 'paket'
total_sessions  int          -- 1 untuk trial, 4 untuk paket
used_sessions   int          -- default 0
start_date      date
end_date        date         -- start_date + 30 hari
status          text         -- 'active' | 'completed' | 'expired'
amount          numeric      -- nominal pembayaran
is_paid         boolean      -- default false
paid_at         timestamptz
created_at      timestamptz
```

### `sessions`
Jadwal sesi konkret (bukan template). Dibuat otomatis saat paket dibuat.

```sql
id              uuid PRIMARY KEY
package_id      uuid REFERENCES packages(id)
student_id      uuid REFERENCES students(id)
slot_id         uuid REFERENCES slots(id)
scheduled_date  date         -- tanggal konkret sesi ini
start_time      time
end_time        time
status          text         -- 'scheduled' | 'attended' | 'absent' | 'rescheduled'
is_public       boolean      -- default true, bisa dijadikan private
admin_note      text
reschedule_from uuid REFERENCES sessions(id)  -- jika ini hasil reschedule
created_at      timestamptz
```

### `reschedule_requests`
Request reschedule dari murid via link unik.

```sql
id              uuid PRIMARY KEY
student_id      uuid REFERENCES students(id)
session_id      uuid REFERENCES sessions(id)   -- sesi yang mau direschedule
requested_slot_id   uuid REFERENCES slots(id)
requested_date  date
status          text         -- 'pending' | 'approved' | 'rejected'
created_at      timestamptz
```

---

## Business Logic

### Pembuatan Paket & Sesi Otomatis

Saat admin membuat paket baru untuk murid:
1. Admin memilih slot (hari + jam) dan tanggal mulai.
2. Sistem otomatis generate 4 sesi berturut-turut di slot yang sama (skip hari libur tidak perlu dihandle dulu).
3. `end_date` = `start_date` + 30 hari.
4. Semua sesi berstatus `scheduled`.

Untuk trial:
1. Hanya 1 sesi yang di-generate.
2. Admin bisa convert trial → paket dari halaman detail murid.

### Reschedule oleh Murid

1. Admin kirim link `/s/:studentToken` ke murid via WA.
2. Murid membuka link, melihat daftar sesi aktifnya yang bisa direschedule.
3. Murid memilih sesi yang ingin direschedule, lalu memilih slot + tanggal baru yang masih kosong dan masih dalam periode paket (dalam 30 hari dari start_date).
4. Request masuk ke dashboard admin sebagai notifikasi.
5. Admin approve → sesi lama berstatus `rescheduled`, sesi baru dibuat dengan `reschedule_from` diisi.
6. Admin reject → request ditolak, sesi lama tetap berjalan.
7. Setiap sesi hanya bisa reschedule 1 kali.

### Reschedule oleh Admin

Admin bisa memindahkan sesi murid langsung dari dashboard tanpa batasan (selama tidak melampaui `end_date` paket dan kuota slot tidak penuh).

### Kapasitas Slot

Sebelum sesi baru dibuat di slot tertentu, sistem harus cek:
```
jumlah sessions WHERE slot_id = X AND scheduled_date = Y AND status != 'rescheduled'
< slots.max_capacity
```

### Anonimisasi Nama di Kalender Publik

```
"Ahmad Riyadi" → "A.R"
"Siti Nurhaliza" → "S.N"
```
Logika: ambil huruf pertama dari setiap kata dalam nama, gabungkan dengan titik.

---

## Halaman & Komponen Utama

### `/login`
- Form email + password (Supabase Auth)
- Satu akun admin saja

### `/admin` — Dashboard
Terdiri dari 4 section dalam satu halaman scroll:
1. **Jadwal Hari Ini** — daftar sesi hari ini, bisa langsung tandai hadir/absen
2. **Request Pending** — reschedule request yang belum diapprove
3. **Pembayaran** — murid yang belum lunas
4. **Kalender Bulan Ini** — mini calendar, klik tanggal untuk lihat sesi

### `/admin/students`
- List murid dengan filter level & status
- Tombol tambah murid baru
- Setiap row: nama, level, paket aktif, status bayar
- Generate link reschedule per murid

### `/admin/students/:id`
- Detail lengkap murid
- Riwayat paket & sesi
- Tombol tambah paket baru / convert trial ke paket
- Absensi per sesi dengan catatan admin
- Status pembayaran

### `/admin/schedule`
- Grid slot mingguan
- Edit kapasitas per slot
- Aktif/nonaktifkan slot

### `/admin/attendance`
- View per tanggal
- Tandai hadir / absen / beri catatan

### `/admin/payments`
- List semua paket dengan status bayar
- Filter: belum bayar, sudah bayar
- Tombol tandai lunas + input nominal

### `/calendar` — Kalender Publik
- Tampilan bulan, bisa navigasi prev/next
- Klik tanggal → muncul daftar slot hari itu
- Setiap slot: jam, jumlah terisi / kapasitas, nama murid (anonim, hanya yang `is_public = true`)
- Slot penuh ditandai visual berbeda
- Tidak ada form, tidak ada tombol aksi — view only

### `/s/:studentToken` — Reschedule Page
- Murid melihat sesi aktifnya
- Pilih sesi yang mau direschedule
- Pilih tanggal & slot baru dari kalender interaktif (hanya tampilkan yang masih ada tempat & dalam periode paket)
- Submit → masuk sebagai request pending di dashboard admin

---

## Visual Direction & Design System

### Filosofi Desain

> **"Kolam yang jernih di pagi hari"** — tenang, segar, dan penuh energi yang tertahan.

Desain ini menghindari estetika korporat yang kaku maupun estetika AI yang generik. Semuanya terasa dibuat dengan tangan — proporsi yang sedikit tidak sempurna, tapi justru itu yang membuatnya berkarakter dan hangat.

### Palet Warna

```
Primary       #0A8F8F   -- Teal dalam, seperti kedalaman kolam
Primary Light #E0F5F5   -- Teal sangat muda, untuk background & surface
Accent        #F5A623   -- Amber hangat, untuk CTA & highlight penting
Surface       #FAFCFC   -- Off-white dengan hint teal, bukan putih murni
Text Primary  #1A2E2E   -- Hampir hitam dengan undertone teal
Text Muted    #6B8F8F   -- Abu-abu dengan undertone teal
Border        #D0E8E8   -- Border halus
Success       #2DBD8F   -- Hijau teal untuk status positif
Warning       #F5A623   -- Amber untuk pending/warning
Danger        #E05A5A   -- Merah soft untuk absen/belum bayar
```

### Tipografi

```
Display font  : "DM Serif Display" (Google Fonts) — untuk heading besar & nama app
Body font     : "DM Sans" (Google Fonts) — untuk semua UI text
Mono          : "JetBrains Mono" — untuk token/kode link
```

Kombinasi DM Serif Display + DM Sans menciptakan kontras yang elegan: serif yang klasik bertemu sans yang modern dan bersih — tidak pernah terlihat seperti template AI.

### Animasi

Semua animasi menggunakan Framer Motion dengan prinsip **"air mengalir"** — tidak ada yang patah, semua bergerak dengan ease yang natural.

```
Page transition     : fade + slide up (y: 16px → 0, opacity: 0 → 1, duration: 0.3s)
Card enter          : stagger 0.05s per card, fade + scale (0.97 → 1)
Modal/Sheet         : slide dari bawah (mobile), fade dari kanan (desktop)
Status change       : color transition 0.2s ease
Calendar date hover : scale 1.02, background fill 0.15s
Slot capacity bar   : animasi fill dari kiri saat pertama kali muncul
Number count-up     : untuk stat di dashboard (sesi hari ini, request pending, dll)
```

Tidak ada animasi yang berlebihan — setiap animasi punya alasan fungsional.

### Layout & Komponen

**Mobile-first breakpoints:**
```
Default  : 0–639px   (smartphone, layout utama)
md       : 640–1023px
lg       : 1024px+   (bisa diakses dari laptop, tapi bukan prioritas)
```

**Bottom navigation bar** (admin) — 4 tab: Beranda, Murid, Jadwal, Pembayaran. Ikon Lucide dengan label teks kecil. Tab aktif menggunakan warna primary dengan pill indicator di atas ikon.

**Cards** — `border-radius: 16px`, subtle shadow (`0 2px 12px rgba(10,143,143,0.08)`), background surface. Tidak ada border keras kecuali untuk state aktif/selected.

**Slot capacity indicator** — progress bar horizontal dengan warna fill yang berubah: teal (kosong–setengah) → amber (hampir penuh) → merah soft (penuh).

**Avatar murid** — circle dengan inisial dua huruf, background teal muda, teks teal dalam.

**Status badges** — pill shape, warna sesuai status:
- `scheduled` → teal muda
- `attended` → hijau
- `absent` → merah soft
- `pending` → amber
- `rescheduled` → abu-abu

### Kalender Publik

Tampilan kalender publik sengaja dibuat lebih "airy" dan inviting dibanding dashboard admin — lebih banyak whitespace, heading lebih besar, dan palette yang lebih ringan. Tujuannya agar calon murid merasa nyaman dan tidak overwhelmed.

Slot yang penuh ditampilkan dengan opacity 50% dan label "Penuh" — tidak dihilangkan, tetap kelihatan sebagai bukti sosial bahwa kelas ini aktif.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     -- hanya dipakai di server-side (Server Actions)
NEXT_PUBLIC_BASE_URL=          -- untuk generate link reschedule
```

---

## Folder Structure

```
app/                             -- Next.js App Router (halaman)
├── (admin)/                     -- route group admin
│   └── admin/...
├── calendar/
├── s/[token]/
└── login/

components/
├── ui/                          -- Button, Input, Badge, Modal, Sheet, dll
├── calendar/                    -- CalendarGrid, DaySlots, SlotCard
├── students/                    -- StudentCard, StudentForm, PackageCard
├── schedule/                    -- SlotGrid, SessionCard
├── attendance/                  -- AttendanceList, AttendanceItem
└── payments/                    -- PaymentList, PaymentCard

lib/
├── supabase/
│   ├── client.ts                -- Supabase browser client
│   ├── server.ts                -- Supabase server client (untuk Server Components & Actions)
│   └── middleware.ts            -- session refresh middleware
├── actions/                     -- Next.js Server Actions
│   ├── students.ts
│   ├── sessions.ts
│   ├── packages.ts
│   ├── attendance.ts
│   ├── payments.ts
│   └── reschedule.ts
├── utils.ts                     -- anonymizeName, generateToken, dll
└── constants.ts                 -- DAYS_OF_WEEK, SESSION_STATUS, dll

hooks/                           -- Client-side hooks
├── useStudents.ts
├── useSessions.ts
├── useSlots.ts
└── useReschedule.ts

store/
└── useAppStore.ts               -- Zustand global client state

middleware.ts                    -- Next.js middleware untuk auth (root level)
```

---

## Catatan Penting untuk Agent

1. Semua route `/admin/*` diproteksi di `middleware.ts` (root level) menggunakan `@supabase/ssr` — redirect ke `/login` jika tidak ada sesi aktif.
2. Route `/calendar` dan `/s/[token]` adalah public — tidak masuk dalam middleware auth check.
3. Gunakan dua Supabase client yang berbeda: `lib/supabase/client.ts` untuk Client Components, `lib/supabase/server.ts` untuk Server Components & Server Actions.
4. Semua mutasi data (tambah murid, approve reschedule, tandai lunas, dll) menggunakan Next.js Server Actions di `lib/actions/` — tidak perlu membuat API route terpisah.
5. Saat generate link reschedule, buat token random 16 karakter (alphanumeric) dan simpan di kolom `students.token`. Link format: `${NEXT_PUBLIC_BASE_URL}/s/${token}`.
6. Fungsi `anonymizeName` harus handle nama dengan 1 kata (hanya tampilkan huruf pertama + titik).
7. Saat cek kapasitas slot, exclude sesi dengan status `rescheduled` dari hitungan.
8. Semua timestamp disimpan dalam UTC di Supabase, tampilkan dalam WIB (UTC+7) di frontend menggunakan `date-fns-tz`.
9. `is_public` pada sesi defaultnya `true` — admin bisa ubah ke `false` untuk menyembunyikan dari kalender publik.
10. Reschedule hanya bisa dilakukan jika sesi berstatus `scheduled` dan belum pernah direschedule sebelumnya (`reschedule_from` masih null).
11. Halaman `/calendar` menggunakan ISR dengan `revalidate = 60` — data kalender publik refresh setiap 60 detik tanpa rebuild penuh.