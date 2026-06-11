"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Users, CalendarDays, CreditCard, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/admin", label: "Beranda", icon: Home },
  { href: "/admin/students", label: "Murid", icon: Users },
  { href: "/admin/schedule", label: "Jadwal", icon: CalendarDays },
  { href: "/admin/attendance", label: "Absensi", icon: ClipboardCheck },
  { href: "/admin/payments", label: "Bayar", icon: CreditCard },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchPendingCount() {
      const supabase = createClient();
      const { count } = await supabase
        .from("reschedule_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    }
    fetchPendingCount();
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center gap-0.5 py-2 px-4"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 w-8 h-1 bg-brand-600 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="relative">
                <tab.icon
                  size={22}
                  className={isActive ? "text-brand-600" : "text-gray-400"}
                />
                {tab.href === "/admin" && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? "text-brand-600" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
