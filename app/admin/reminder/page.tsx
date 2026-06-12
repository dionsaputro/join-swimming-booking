"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Clock, Calendar } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function ReminderPage() {
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [tomorrowSessions, setTomorrowSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

        const [todayRes, tomorrowRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("*, students(full_name, phone)")
            .eq("scheduled_date", today)
            .eq("status", "scheduled")
            .order("start_time", { ascending: true }),
          supabase
            .from("sessions")
            .select("*, students(full_name, phone)")
            .eq("scheduled_date", tomorrow)
            .eq("status", "scheduled")
            .order("start_time", { ascending: true }),
        ]);

        setTodaySessions(todayRes.data ?? []);
        setTomorrowSessions(tomorrowRes.data ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  function buildWaUrl(session: any, dateLabel: string) {
    const phone = session.students?.phone?.replace(/^0/, "62") || "";
    const name = session.students?.full_name || "";
    const time = `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;
    const text = encodeURIComponent(
      `Halo ${name}, reminder jadwal renang kamu ${dateLabel}:\n\n` +
      `${dateLabel === "hari ini" ? "📅 Hari ini" : "📅 Besok"}\n` +
      `⏰ ${time}\n\n` +
      `Kamu juga bisa cek jadwal lengkap di:\n` +
      `https://join-swimming.vercel.app/p\n` +
      `(masukkan 4 digit terakhir nomor HP kamu)\n\n` +
      `Kalau ada jadwal yang salah, tolong kabari ya. Terima kasih!`
    );
    return `https://wa.me/${phone}?text=${text}`;
  }

  function renderSessionGroup(sessions: any[], dateLabel: string) {
    if (sessions.length === 0) {
      return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-8">
          <p className="text-sm text-gray-400">Tidak ada jadwal {dateLabel}</p>
        </div>
      );
    }

    // Group by time
    const grouped: Record<string, any[]> = {};
    sessions.forEach((s) => {
      const key = `${s.start_time}-${s.end_time}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });

    return (
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        {Object.keys(grouped).sort().map((key) => {
          const group = grouped[key];
          const first = group[0];
          return (
            <motion.div key={key} variants={item}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-brand-600" />
                <span className="text-xs font-bold text-gray-500">
                  {formatTime(first.start_time)} – {formatTime(first.end_time)}
                </span>
                <span className="text-[11px] text-gray-400">({group.length} murid)</span>
              </div>
              <div className="space-y-2">
                {group.map((session: any) => (
                  <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={session.students?.full_name ?? ""} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{session.students?.full_name}</p>
                          <p className="text-xs text-gray-400">{session.students?.phone}</p>
                        </div>
                      </div>
                      <a
                        href={buildWaUrl(session, dateLabel)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                      >
                        <MessageCircle size={20} className="text-emerald-600" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="font-display text-2xl text-gray-900">Reminder</h1>

        {/* Today */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-brand-600" />
            <h2 className="text-sm font-bold text-gray-700">
              Hari Ini ({todaySessions.length})
            </h2>
          </div>
          {renderSessionGroup(todaySessions, "hari ini")}
        </section>

        {/* Tomorrow */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Besok ({tomorrowSessions.length})
            </h2>
          </div>
          {renderSessionGroup(tomorrowSessions, "besok")}
        </section>
      </div>
    </PageTransition>
  );
}
