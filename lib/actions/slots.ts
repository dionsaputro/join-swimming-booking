"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getSlots() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getActiveSlots() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateSlotCapacity(slotId: string, maxCapacity: number) {
  const supabase = createClient();

  if (maxCapacity < 1) throw new Error("Kapasitas minimum adalah 1");

  const { error } = await supabase
    .from("slots")
    .update({ max_capacity: maxCapacity })
    .eq("id", slotId);

  if (error) throw error;
  revalidatePath("/admin/schedule");
}

export async function toggleSlotActive(slotId: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("slots")
    .update({ is_active: isActive })
    .eq("id", slotId);

  if (error) throw error;
  revalidatePath("/admin/schedule");
}
