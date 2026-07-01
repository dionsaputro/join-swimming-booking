"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays, format, addWeeks } from "date-fns";

export async function getPackagesByStudent(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createPackage(formData: {
  student_id: string;
  session_type: "trial" | "paket";
  slot_id: string;
  start_date: string;
  amount: number;
}) {
  const supabase = createClient();

  const totalSessions = formData.session_type === "trial" ? 1 : 4;
  const startDate = new Date(formData.start_date);
  const endDate = addDays(startDate, 30);

  // Get slot details
  const { data: slot, error: slotError } = await supabase
    .from("slots")
    .select("*")
    .eq("id", formData.slot_id)
    .single();

  if (slotError || !slot) throw new Error("Slot tidak ditemukan");

  // Generate session dates
  const sessionDates: string[] = [];
  let currentDate = startDate;
  let found = 0;

  // Find the next occurrences of slot.day_of_week starting from start_date
  while (found < totalSessions) {
    if (currentDate.getDay() === slot.day_of_week) {
      sessionDates.push(format(currentDate, "yyyy-MM-dd"));
      found++;
      if (found < totalSessions) {
        currentDate = addWeeks(currentDate, 1);
      }
    } else {
      currentDate = addDays(currentDate, 1);
    }
  }

  // ponytail: capacity check disabled — slots can't be full for now

  // Create package
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .insert({
      student_id: formData.student_id,
      session_type: formData.session_type,
      total_sessions: totalSessions,
      used_sessions: 0,
      start_date: formData.start_date,
      end_date: format(endDate, "yyyy-MM-dd"),
      status: "active",
      amount: formData.amount,
      is_paid: false,
    })
    .select()
    .single();

  if (pkgError) throw pkgError;

  // Create sessions
  const sessionsToInsert = sessionDates.map((date) => ({
    package_id: pkg.id,
    student_id: formData.student_id,
    slot_id: formData.slot_id,
    scheduled_date: date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    status: "scheduled" as const,
    is_public: true,
  }));

  const { error: sessionsError } = await supabase
    .from("sessions")
    .insert(sessionsToInsert);

  if (sessionsError) throw sessionsError;

  // Update student session_type
  await supabase
    .from("students")
    .update({ session_type: formData.session_type })
    .eq("id", formData.student_id);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${formData.student_id}`);
  revalidatePath("/admin");
  revalidatePath("/calendar");

  return pkg;
}

export async function convertTrialToPackage(formData: {
  student_id: string;
  slot_id: string;
  start_date: string;
  amount: number;
}) {
  return createPackage({
    student_id: formData.student_id,
    session_type: "paket",
    slot_id: formData.slot_id,
    start_date: formData.start_date,
    amount: formData.amount,
  });
}
