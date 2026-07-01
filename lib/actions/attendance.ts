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

/**
 * Change attendance status on an already-marked session.
 * Handles used_sessions increment/decrement on the package.
 */
export async function changeAttendanceStatus(
  sessionId: string,
  newStatus: "attended" | "absent" | "scheduled"
) {
  const supabase = createClient();

  // Get current session to know old status & package
  const { data: session, error: fetchErr } = await supabase
    .from("sessions")
    .select("status, package_id")
    .eq("id", sessionId)
    .single();

  if (fetchErr || !session) throw fetchErr || new Error("Session not found");

  const oldStatus = session.status;
  if (oldStatus === newStatus) return; // noop

  // Update session status
  const { error } = await supabase
    .from("sessions")
    .update({ status: newStatus })
    .eq("id", sessionId);

  if (error) throw error;

  // Adjust used_sessions on package
  // attended counts as +1, anything else is 0
  const wasCounted = oldStatus === "attended";
  const willCount = newStatus === "attended";

  if (wasCounted !== willCount && session.package_id) {
    const { data: pkg } = await supabase
      .from("packages")
      .select("used_sessions, total_sessions")
      .eq("id", session.package_id)
      .single();

    if (pkg) {
      const delta = willCount ? 1 : -1;
      const newUsed = Math.max(0, pkg.used_sessions + delta);
      await supabase
        .from("packages")
        .update({
          used_sessions: newUsed,
          status: newUsed >= pkg.total_sessions ? "completed" : "active",
        })
        .eq("id", session.package_id);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/students");
}
