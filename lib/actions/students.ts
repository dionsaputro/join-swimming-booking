"use server";

import { createClient } from "@/lib/supabase/server";
import { generateToken } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function getStudents() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStudent(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getStudentByToken(token: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("token", token)
    .single();

  if (error) return null;
  return data;
}

export async function createStudent(formData: {
  full_name: string;
  phone: string;
  social_handle?: string;
  level: "pemula" | "menengah" | "lanjut";
  notes?: string;
  joined_at: string;
}) {
  const supabase = createClient();
  const token = generateToken();

  const { data, error } = await supabase
    .from("students")
    .insert({
      full_name: formData.full_name,
      phone: formData.phone,
      social_handle: formData.social_handle || null,
      level: formData.level,
      notes: formData.notes || null,
      joined_at: formData.joined_at,
      token,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/students");
  return data;
}

export async function updateStudent(
  id: string,
  formData: {
    full_name?: string;
    phone?: string;
    social_handle?: string | null;
    level?: "pemula" | "menengah" | "lanjut";
    notes?: string | null;
    joined_at?: string;
  }
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("students")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${id}`);
  return data;
}

export async function deleteStudent(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/students");
}
