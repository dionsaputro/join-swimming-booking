"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPrivateSession(formData: {
  student_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  admin_note?: string;
}) {
  const supabase = createClient();

  // Validate that the time doesn't clash with predefined slots on that day
  const dayOfWeek = new Date(formData.scheduled_date + "T00:00:00").getDay();
  const { data: existingSlots } = await supabase
    .from("slots")
    .select("start_time, end_time")
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (existingSlots) {
    for (const slot of existingSlots) {
      // Check overlap: new session overlaps with existing slot
      if (formData.start_time < slot.end_time && formData.end_time > slot.start_time) {
        throw new Error(
          `Waktu bentrok dengan slot yang sudah ada (${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}). Sesi private harus di luar jam slot regular.`
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      student_id: formData.student_id,
      slot_id: null,
      package_id: null,
      scheduled_date: formData.scheduled_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      status: "scheduled",
      is_public: false,
      admin_note: formData.admin_note || null,
      reschedule_from: null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/admin");
  revalidatePath(`/admin/students/${formData.student_id}`);
  revalidatePath("/admin/schedule");

  return data;
}

export async function getPrivateSessionsByStudent(studentId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("student_id", studentId)
    .is("slot_id", null)
    .order("scheduled_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function deletePrivateSession(sessionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId)
    .is("slot_id", null); // Safety: only delete if it's a private session

  if (error) throw error;
  revalidatePath("/admin");
  revalidatePath("/admin/schedule");
}
