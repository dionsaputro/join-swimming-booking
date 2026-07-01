"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getRescheduleRequests(status?: "pending" | "approved" | "rejected") {
  const supabase = createClient();
  let query = supabase
    .from("reschedule_requests")
    .select("*, students(full_name), sessions(scheduled_date, start_time, end_time, slot_id)")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createRescheduleRequest(formData: {
  student_id: string;
  session_id: string;
  requested_slot_id: string;
  requested_date: string;
}) {
  const supabase = createClient();

  // Validate: session must be "scheduled" and not already rescheduled from
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("status, reschedule_from")
    .eq("id", formData.session_id)
    .single();

  if (sessionError || !session) throw new Error("Sesi tidak ditemukan");
  if (session.status !== "scheduled") throw new Error("Sesi ini tidak bisa direschedule");
  if (session.reschedule_from !== null) throw new Error("Sesi ini sudah pernah direschedule");

  // ponytail: capacity check disabled — slots can't be full for now

  // Check no existing pending request for this session
  const { count: existingCount } = await supabase
    .from("reschedule_requests")
    .select("*", { count: "exact", head: true })
    .eq("session_id", formData.session_id)
    .eq("status", "pending");

  if ((existingCount ?? 0) > 0) {
    throw new Error("Sudah ada request pending untuk sesi ini");
  }

  const { data, error } = await supabase
    .from("reschedule_requests")
    .insert({
      student_id: formData.student_id,
      session_id: formData.session_id,
      requested_slot_id: formData.requested_slot_id,
      requested_date: formData.requested_date,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin");
  return data;
}

export async function approveReschedule(requestId: string) {
  const supabase = createClient();

  // Get the request
  const { data: request, error: reqError } = await supabase
    .from("reschedule_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqError || !request) throw new Error("Request tidak ditemukan");

  // Get original session
  const { data: originalSession, error: origError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", request.session_id)
    .single();

  if (origError || !originalSession) throw new Error("Sesi asal tidak ditemukan");

  // Get slot details
  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", request.requested_slot_id)
    .single();

  if (!slot) throw new Error("Slot tidak ditemukan");

  // ponytail: capacity check disabled — slots can't be full for now

  // Mark original session as rescheduled
  await supabase
    .from("sessions")
    .update({ status: "rescheduled" })
    .eq("id", request.session_id);

  // Create new session
  await supabase.from("sessions").insert({
    package_id: originalSession.package_id,
    student_id: originalSession.student_id,
    slot_id: request.requested_slot_id,
    scheduled_date: request.requested_date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    status: "scheduled",
    is_public: true,
    reschedule_from: request.session_id,
  });

  // Update request status
  await supabase
    .from("reschedule_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  revalidatePath("/admin");
  revalidatePath("/calendar");
}

export async function rejectReschedule(requestId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("reschedule_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (error) throw error;
  revalidatePath("/admin");
}

export async function adminReschedule(formData: {
  session_id: string;
  new_slot_id: string;
  new_date: string;
}) {
  const supabase = createClient();

  // Get original session
  const { data: originalSession, error: origError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", formData.session_id)
    .single();

  if (origError || !originalSession) throw new Error("Sesi tidak ditemukan");

  // Get new slot
  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", formData.new_slot_id)
    .single();

  if (!slot) throw new Error("Slot tidak ditemukan");

  // ponytail: capacity check disabled — slots can't be full for now

  // Check date is within package end_date
  const { data: pkg } = await supabase
    .from("packages")
    .select("end_date")
    .eq("id", originalSession.package_id)
    .single();

  if (pkg && formData.new_date > pkg.end_date) {
    throw new Error("Tanggal baru melampaui periode paket");
  }

  // Mark old session as rescheduled
  await supabase
    .from("sessions")
    .update({ status: "rescheduled" })
    .eq("id", formData.session_id);

  // Create new session
  await supabase.from("sessions").insert({
    package_id: originalSession.package_id,
    student_id: originalSession.student_id,
    slot_id: formData.new_slot_id,
    scheduled_date: formData.new_date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    status: "scheduled",
    is_public: true,
    reschedule_from: formData.session_id,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/students/${originalSession.student_id}`);
  revalidatePath("/calendar");
}
