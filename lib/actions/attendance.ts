"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAttendance(
  sessionId: string,
  status: "attended" | "absent",
  adminNote?: string
) {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase
    .from("sessions")
    .update({
      status,
      admin_note: adminNote || null,
    } as Record<string, unknown>)
    .eq("id", sessionId));

  if (error) throw error;

  // Increment used_sessions on the package if marked attended
  if (status === "attended") {
    const { data: session } = await supabase
      .from("sessions")
      .select("package_id")
      .eq("id", sessionId)
      .single();

    if (session) {
      const { data: pkg } = await supabase
        .from("packages")
        .select("used_sessions, total_sessions")
        .eq("id", session.package_id)
        .single();

      if (pkg) {
        const newUsed = pkg.used_sessions + 1;
        await supabase
          .from("packages")
          .update({
            used_sessions: newUsed,
            status: newUsed >= pkg.total_sessions ? "completed" : "active",
          })
          .eq("id", session.package_id);
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
}

export async function updateSessionNote(sessionId: string, note: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ admin_note: note || null })
    .eq("id", sessionId);

  if (error) throw error;
  revalidatePath("/admin/attendance");
}
