// Mock data untuk development UI tanpa koneksi Supabase

export interface Slot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_capacity: number;
  is_active: boolean;
}

export interface Student {
  id: string;
  full_name: string;
  phone: string;
  social_handle: string;
  level: "pemula" | "menengah" | "lanjut";
  notes: string;
  joined_at: string;
  session_type: string | null;
  token: string;
}

export interface Package {
  id: string;
  student_id: string;
  session_type: "trial" | "paket";
  total_sessions: number;
  used_sessions: number;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "expired";
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
}

export interface Session {
  id: string;
  package_id: string;
  student_id: string;
  slot_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "attended" | "absent" | "rescheduled";
  is_public: boolean;
  admin_note: string | null;
  reschedule_from: string | null;
}

export interface RescheduleRequest {
  id: string;
  student_id: string;
  session_id: string;
  requested_slot_id: string;
  requested_date: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

// --- SLOTS ---
export const mockSlots: Slot[] = [
  // Senin–Jumat: 17.30–18.30, 18.30–19.30
  { id: "s1", day_of_week: 1, start_time: "17:30:00", end_time: "18:30:00", max_capacity: 7, is_active: true },
  { id: "s2", day_of_week: 1, start_time: "18:30:00", end_time: "19:30:00", max_capacity: 7, is_active: true },
  { id: "s3", day_of_week: 2, start_time: "17:30:00", end_time: "18:30:00", max_capacity: 7, is_active: true },
  { id: "s4", day_of_week: 2, start_time: "18:30:00", end_time: "19:30:00", max_capacity: 7, is_active: true },
  { id: "s5", day_of_week: 3, start_time: "17:30:00", end_time: "18:30:00", max_capacity: 7, is_active: true },
  { id: "s6", day_of_week: 3, start_time: "18:30:00", end_time: "19:30:00", max_capacity: 7, is_active: true },
  { id: "s7", day_of_week: 4, start_time: "17:30:00", end_time: "18:30:00", max_capacity: 7, is_active: true },
  { id: "s8", day_of_week: 4, start_time: "18:30:00", end_time: "19:30:00", max_capacity: 7, is_active: false },
  { id: "s9", day_of_week: 5, start_time: "17:30:00", end_time: "18:30:00", max_capacity: 7, is_active: true },
  { id: "s10", day_of_week: 5, start_time: "18:30:00", end_time: "19:30:00", max_capacity: 7, is_active: true },
  // Sabtu–Minggu: 06.00–07.00, 07.00–08.00, 08.00–09.00
  { id: "s11", day_of_week: 6, start_time: "06:00:00", end_time: "07:00:00", max_capacity: 7, is_active: true },
  { id: "s12", day_of_week: 6, start_time: "07:00:00", end_time: "08:00:00", max_capacity: 7, is_active: true },
  { id: "s13", day_of_week: 6, start_time: "08:00:00", end_time: "09:00:00", max_capacity: 7, is_active: true },
  { id: "s14", day_of_week: 0, start_time: "06:00:00", end_time: "07:00:00", max_capacity: 7, is_active: true },
  { id: "s15", day_of_week: 0, start_time: "07:00:00", end_time: "08:00:00", max_capacity: 7, is_active: true },
  { id: "s16", day_of_week: 0, start_time: "08:00:00", end_time: "09:00:00", max_capacity: 7, is_active: true },
];

// --- STUDENTS ---
export const mockStudents: Student[] = [
  { id: "st1", full_name: "Ahmad Riyadi", phone: "081234567890", social_handle: "@ahmad.riyadi", level: "pemula", notes: "Takut air dalam", joined_at: "2024-01-15", session_type: "paket", token: "AbCd1234EfGh5678" },
  { id: "st2", full_name: "Siti Nurhaliza", phone: "081298765432", social_handle: "@siti.nur", level: "menengah", notes: "", joined_at: "2024-02-01", session_type: "paket", token: "XyZw9876UvTs5432" },
  { id: "st3", full_name: "Budi Santoso", phone: "081356789012", social_handle: "@budi_s", level: "lanjut", notes: "Persiapan kompetisi", joined_at: "2023-11-10", session_type: "paket", token: "MnOp4321QrSt8765" },
  { id: "st4", full_name: "Rina Kartika", phone: "081345678901", social_handle: "@rina.k", level: "pemula", notes: "", joined_at: "2024-03-01", session_type: "trial", token: "JkLm6543WxYz2109" },
  { id: "st5", full_name: "Dimas Prasetyo", phone: "081267890123", social_handle: "@dimas.p", level: "menengah", notes: "Mau improve teknik butterfly", joined_at: "2024-02-15", session_type: "paket", token: "GhIj0987CdEf6543" },
];

// --- PACKAGES ---
export const mockPackages: Package[] = [
  { id: "p1", student_id: "st1", session_type: "paket", total_sessions: 4, used_sessions: 2, start_date: "2024-06-01", end_date: "2024-07-01", status: "active", amount: 400000, is_paid: true, paid_at: "2024-06-01" },
  { id: "p2", student_id: "st2", session_type: "paket", total_sessions: 4, used_sessions: 3, start_date: "2024-06-03", end_date: "2024-07-03", status: "active", amount: 400000, is_paid: false, paid_at: null },
  { id: "p3", student_id: "st3", session_type: "paket", total_sessions: 4, used_sessions: 4, start_date: "2024-05-15", end_date: "2024-06-15", status: "completed", amount: 400000, is_paid: true, paid_at: "2024-05-15" },
  { id: "p4", student_id: "st4", session_type: "trial", total_sessions: 1, used_sessions: 0, start_date: "2024-06-10", end_date: "2024-07-10", status: "active", amount: 100000, is_paid: false, paid_at: null },
  { id: "p5", student_id: "st5", session_type: "paket", total_sessions: 4, used_sessions: 1, start_date: "2024-06-05", end_date: "2024-07-05", status: "active", amount: 400000, is_paid: true, paid_at: "2024-06-05" },
];

// --- SESSIONS ---
const today = new Date().toISOString().split("T")[0];
export const mockSessions: Session[] = [
  { id: "ss1", package_id: "p1", student_id: "st1", slot_id: "s1", scheduled_date: today, start_time: "17:30:00", end_time: "18:30:00", status: "scheduled", is_public: true, admin_note: null, reschedule_from: null },
  { id: "ss2", package_id: "p2", student_id: "st2", slot_id: "s1", scheduled_date: today, start_time: "17:30:00", end_time: "18:30:00", status: "scheduled", is_public: true, admin_note: null, reschedule_from: null },
  { id: "ss3", package_id: "p5", student_id: "st5", slot_id: "s2", scheduled_date: today, start_time: "18:30:00", end_time: "19:30:00", status: "attended", is_public: true, admin_note: "Bagus, teknik improved", reschedule_from: null },
  { id: "ss4", package_id: "p1", student_id: "st1", slot_id: "s3", scheduled_date: "2024-06-11", start_time: "17:30:00", end_time: "18:30:00", status: "attended", is_public: true, admin_note: null, reschedule_from: null },
  { id: "ss5", package_id: "p2", student_id: "st2", slot_id: "s3", scheduled_date: "2024-06-11", start_time: "17:30:00", end_time: "18:30:00", status: "absent", is_public: true, admin_note: "Sakit", reschedule_from: null },
  { id: "ss6", package_id: "p4", student_id: "st4", slot_id: "s11", scheduled_date: "2024-06-15", start_time: "06:00:00", end_time: "07:00:00", status: "scheduled", is_public: true, admin_note: null, reschedule_from: null },
  { id: "ss7", package_id: "p3", student_id: "st3", slot_id: "s5", scheduled_date: "2024-06-12", start_time: "17:30:00", end_time: "18:30:00", status: "rescheduled", is_public: true, admin_note: null, reschedule_from: null },
];

// --- RESCHEDULE REQUESTS ---
export const mockRescheduleRequests: RescheduleRequest[] = [
  { id: "rr1", student_id: "st1", session_id: "ss1", requested_slot_id: "s5", requested_date: "2024-06-19", status: "pending", created_at: "2024-06-08T10:00:00Z" },
  { id: "rr2", student_id: "st2", session_id: "ss2", requested_slot_id: "s11", requested_date: "2024-06-22", status: "pending", created_at: "2024-06-09T14:30:00Z" },
];

// Helper: get student name by ID
export function getStudentName(id: string): string {
  return mockStudents.find((s) => s.id === id)?.full_name ?? "Unknown";
}

// Helper: get slot by ID
export function getSlot(id: string): Slot | undefined {
  return mockSlots.find((s) => s.id === id);
}
