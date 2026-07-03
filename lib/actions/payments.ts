"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPayments(filter?: "paid" | "unpaid") {
  const supabase = createClient();
  let query = supabase
    .from("packages")
    .select("*, students(full_name)")
    .order("is_paid", { ascending: true })
    .order("created_at", { ascending: false });

  if (filter === "paid") {
    query = query.eq("is_paid", true);
  } else if (filter === "unpaid") {
    query = query.eq("is_paid", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function markAsPaid(packageId: string, amount: number, paidAt?: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("packages")
    .update({
      is_paid: true,
      paid_at: paidAt || new Date().toISOString(),
      amount,
    })
    .eq("id", packageId);

  if (error) throw error;
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
}
