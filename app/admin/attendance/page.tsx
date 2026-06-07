"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { markAttendance } from "@/lib/actions/attendance";
import { formatTime, formatDateID } from "@/lib/utils";
import { SESSION_STATUS } from "@/lib/constants";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("sessions")
        .select("*, students(full_name, level)")
        .eq("scheduled_date", date)
        .neq("status", "rescheduled")
        .order("start_time", { ascending: true });
      setSessions(data ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(selectedDate);
  }, [selectedDate, fetchSessions]);

  async function handleMarkAttendance(sessionId: string, status: "attended" | "absent") {
    setActionLoading(sessionId);
    try {
      await markAttendance(sessionId, status);
      await fetchSessions(selectedDate);
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        <h1 className="font-display text-2xl text-gray-900">Absensi</h1>

        {/* Date Picker */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
        />

        <p className="text-sm text-gray-400 font-medium">
          {formatDateID(new Date(selectedDate + "T00:00:00"))} · {sessions.length} sesi
        </p>

        {/* Sessions */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
                <p className="text-sm text-gray-400">Tidak ada sesi di tanggal ini</p>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div key={session.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={session.students?.full_name ?? ""} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{session.students?.full_name}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {formatTime(session.start_time)} – {formatTime(session.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {session.status === "scheduled" ? (
                        <>
                          <button
                            onClick={() => handleMarkAttendance(session.id, "attended")}
                            disabled={actionLoading === session.id}
                            className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={18} className="text-emerald-500" />
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(session.id, "absent")}
                            disabled={actionLoading === session.id}
                            className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <XCircle size={18} className="text-rose-400" />
                          </button>
                        </>
                      ) : (
                        <Badge variant={session.status}>{SESSION_STATUS[session.status as keyof typeof SESSION_STATUS]}</Badge>
                      )}
                    </div>
                  </div>
                  {session.admin_note && (
                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                      <MessageSquare size={12} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>{session.admin_note}</span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
