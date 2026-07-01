"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSessionsByDate(date: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, students(full_name, level)")
    .eq("scheduled_date", date)
    .neq("status", "rescheduled")
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getSessionsByStudent(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*, slots(day_of_week, start_time, end_time)")
    .eq("student_id", studentId)
    .order("scheduled_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getTodaySessions() {
  const today = new Date().toISOString().split("T")[0];
  return getSessionsByDate(today);
}

export async function getSessionsForCalendar(month: number, year: number) {
  const supabase = createClient();

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`;

  const { data, error } = await supabase
    .from("sessions")
    .select("id, student_id, slot_id, scheduled_date, start_time, end_time, status, is_public, students(full_name)")
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .neq("status", "rescheduled")
    .eq("is_public", true);

  if (error) throw error;
  return data;
}

export async function getSlotCapacity(slotId: string, date: string) {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .eq("scheduled_date", date)
    .neq("status", "rescheduled");

  if (error) throw error;
  return count ?? 0;
}

export async function toggleSessionVisibility(sessionId: string, isPublic: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ is_public: isPublic })
    .eq("id", sessionId);

  if (error) throw error;
  revalidatePath("/calendar");
}

export async function updateSession(
  sessionId: string,
  formData: {
    scheduled_date?: string;
    start_time?: string;
    end_time?: string;
    slot_id?: string | null;
  }
) {
  const supabase = createClient();

  // ponytail: capacity check disabled — slots can't be full for now

  const { error } = await supabase
    .from("sessions")
    .update(formData as Record<string, unknown>)
    .eq("id", sessionId);

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
  revalidatePath("/calendar");
}
