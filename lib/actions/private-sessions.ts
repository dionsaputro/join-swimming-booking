"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addDays, format } from "date-fns";

interface PrivateSessionSchedule {
  date: string;       // "2024-06-10"
  start_time: string; // "15:00:00"
  end_time: string;   // "16:00:00"
}

export async function createPrivatePackage(formData: {
  student_id: string;
  session_type: "trial" | "paket" | "paket8";
  sessions: PrivateSessionSchedule[];
  amount: number;
}) {
  const supabase = createClient();

  const totalSessions = formData.session_type === "trial" ? 1 : formData.session_type === "paket8" ? 8 : 4;

  if (formData.sessions.length !== totalSessions) {
    throw new Error(`Harus ada ${totalSessions} sesi untuk tipe ${formData.session_type}`);
  }

  // Validate each session time doesn't clash with regular slots
  for (const sess of formData.sessions) {
    const dayOfWeek = new Date(sess.date + "T00:00:00").getDay();
    const { data: existingSlots } = await supabase
      .from("slots")
      .select("start_time, end_time")
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true);

    if (existingSlots) {
      for (const slot of existingSlots) {
        if (sess.start_time < slot.end_time && sess.end_time > slot.start_time) {
          throw new Error(
            `Sesi tanggal ${sess.date} (${sess.start_time.slice(0, 5)}-${sess.end_time.slice(0, 5)}) bentrok dengan slot regular (${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}).`
          );
        }
      }
    }
  }

  // Determine start_date and end_date
  const sortedDates = formData.sessions.map((s) => s.date).sort();
  const startDate = sortedDates[0];
  const endDate = format(addDays(new Date(startDate), 30), "yyyy-MM-dd");

  // Create package
  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .insert({
      student_id: formData.student_id,
      session_type: formData.session_type === "trial" ? "trial" : "paket",
      total_sessions: totalSessions,
      used_sessions: 0,
      start_date: startDate,
      end_date: endDate,
      status: "active",
      amount: formData.amount,
      is_paid: false,
    })
    .select()
    .single();

  if (pkgError) throw pkgError;

  // Create sessions (private: slot_id = null, is_public = false)
  const sessionsToInsert = formData.sessions.map((sess) => ({
    package_id: pkg.id,
    student_id: formData.student_id,
    slot_id: null,
    scheduled_date: sess.date,
    start_time: sess.start_time,
    end_time: sess.end_time,
    status: "scheduled" as const,
    is_public: false,
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

  revalidatePath("/admin");
  revalidatePath(`/admin/students/${formData.student_id}`);
  revalidatePath("/admin/payments");

  return pkg;
}
