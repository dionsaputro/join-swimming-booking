"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { markAsPaid } from "@/lib/actions/payments";
import { SESSION_TYPE_LABELS } from "@/lib/constants";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function PaymentsPage() {
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("packages")
        .select("*, students(full_name)")
        .order("is_paid", { ascending: true })
        .order("created_at", { ascending: false });
      setPackages(data ?? []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(packageId: string, amount: number) {
    setActionLoading(packageId);
    try {
      await markAsPaid(packageId, amount);
      await fetchPackages();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  const filteredPackages = packages
    .filter((pkg) => {
      if (filter === "unpaid") return !pkg.is_paid;
      if (filter === "paid") return pkg.is_paid;
      return true;
    })
    .sort((a, b) => (a.is_paid === b.is_paid ? 0 : a.is_paid ? 1 : -1));

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <h1 className="font-display text-2xl text-gray-900">Pembayaran</h1>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: "unpaid", label: "Belum Lunas" },
            { key: "paid", label: "Lunas" },
            { key: "all", label: "Semua" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
              <p className="text-sm text-gray-400">Tidak ada data pembayaran</p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <motion.div key={pkg.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={pkg.students?.full_name ?? ""} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{pkg.students?.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 font-medium">
                          {SESSION_TYPE_LABELS[pkg.session_type]}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          Rp{pkg.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {pkg.is_paid ? (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                      Lunas
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleMarkPaid(pkg.id, pkg.amount)}
                      isLoading={actionLoading === pkg.id}
                    >
                      <Check size={14} />
                      Lunas
                    </Button>
                  )}
                </div>
                {pkg.is_paid && pkg.paid_at && (
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">
                    Dibayar {new Date(pkg.paid_at).toLocaleDateString("id-ID")}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
