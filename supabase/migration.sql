-- Join Swimming Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- SLOTS - Template jadwal mingguan
-- ============================================
create table public.slots (
  id uuid primary key default uuid_generate_v4(),
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  max_capacity int not null default 7,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================
-- STUDENTS - Data murid
-- ============================================
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  social_handle text,
  level text not null check (level in ('pemula', 'menengah', 'lanjut')),
  notes text,
  joined_at date not null default current_date,
  session_type text,
  token text unique not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- PACKAGES - Paket renang per murid
-- ============================================
create table public.packages (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_type text not null check (session_type in ('trial', 'paket')),
  total_sessions int not null default 4,
  used_sessions int not null default 0,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  amount numeric not null,
  is_paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- SESSIONS - Sesi konkret
-- ============================================
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  package_id uuid not null references public.packages(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  slot_id uuid not null references public.slots(id),
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'attended', 'absent', 'rescheduled')),
  is_public boolean not null default true,
  admin_note text,
  reschedule_from uuid references public.sessions(id),
  created_at timestamptz not null default now()
);

-- ============================================
-- RESCHEDULE REQUESTS
-- ============================================
create table public.reschedule_requests (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  requested_slot_id uuid not null references public.slots(id),
  requested_date date not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_sessions_date on public.sessions(scheduled_date);
create index idx_sessions_student on public.sessions(student_id);
create index idx_sessions_slot_date on public.sessions(slot_id, scheduled_date);
create index idx_packages_student on public.packages(student_id);
create index idx_packages_status on public.packages(status);
create index idx_students_token on public.students(token);
create index idx_reschedule_status on public.reschedule_requests(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table public.slots enable row level security;
alter table public.students enable row level security;
alter table public.packages enable row level security;
alter table public.sessions enable row level security;
alter table public.reschedule_requests enable row level security;

-- Admin (authenticated) can do everything
create policy "Admin full access on slots" on public.slots
  for all using (auth.role() = 'authenticated');

create policy "Admin full access on students" on public.students
  for all using (auth.role() = 'authenticated');

create policy "Admin full access on packages" on public.packages
  for all using (auth.role() = 'authenticated');

create policy "Admin full access on sessions" on public.sessions
  for all using (auth.role() = 'authenticated');

create policy "Admin full access on reschedule_requests" on public.reschedule_requests
  for all using (auth.role() = 'authenticated');

-- Public read access for calendar (slots + sessions with is_public = true)
create policy "Public can read active slots" on public.slots
  for select using (is_active = true);

create policy "Public can read public sessions" on public.sessions
  for select using (is_public = true);

-- Public access for reschedule via token (students can read their own data)
create policy "Public can read students by token" on public.students
  for select using (true);

create policy "Public can read packages" on public.packages
  for select using (true);

-- Anon can insert reschedule requests
create policy "Anon can insert reschedule requests" on public.reschedule_requests
  for insert with check (true);

create policy "Public can read reschedule requests" on public.reschedule_requests
  for select using (true);

-- ============================================
-- SEED DATA - Default slots
-- ============================================
insert into public.slots (day_of_week, start_time, end_time, max_capacity) values
  -- Senin–Jumat: 17.30–18.30, 18.30–19.30
  (1, '17:30:00', '18:30:00', 7),
  (1, '18:30:00', '19:30:00', 7),
  (2, '17:30:00', '18:30:00', 7),
  (2, '18:30:00', '19:30:00', 7),
  (3, '17:30:00', '18:30:00', 7),
  (3, '18:30:00', '19:30:00', 7),
  (4, '17:30:00', '18:30:00', 7),
  (4, '18:30:00', '19:30:00', 7),
  (5, '17:30:00', '18:30:00', 7),
  (5, '18:30:00', '19:30:00', 7),
  -- Sabtu–Minggu: 06.00–07.00, 07.00–08.00, 08.00–09.00
  (6, '06:00:00', '07:00:00', 7),
  (6, '07:00:00', '08:00:00', 7),
  (6, '08:00:00', '09:00:00', 7),
  (0, '06:00:00', '07:00:00', 7),
  (0, '07:00:00', '08:00:00', 7),
  (0, '08:00:00', '09:00:00', 7);
