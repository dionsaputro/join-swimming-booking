"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { markAttendance } from "@/lib/actions/attendance";
import { formatTime } from "@/lib/utils";
import { SESSION_STATUS, DAYS_OF_WEEK } from "@/lib/constants";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function AttendancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // Note modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteSessionId, setNoteSessionId] = useState("");
  const [noteStatus, setNoteStatus] = useState<"attended" | "absent">("attended");
  const [noteText, setNoteText] = useState("");
  const [noteStudentName, setNoteStudentName] = useState("");

  // Calculate week start (Monday) based on offset
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + weekOffset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const startStr = weekStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const endStr = weekEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} – ${endStr}`;
  }, [weekStart, weekEnd]);

  useEffect(() => {
    fetchSessions();
  }, [weekOffset]);

  async function fetchSessions() {
    setLoading(true);
    try {
      const supabase = createClient();
      const startDate = weekStart.toISOString().split("T")[0];
      const endDate = weekEnd.toISOString().split("T")[0];

      const { data } = await supabase
        .from("sessions")
        .select("*, students(full_name, level)")
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .neq("status", "rescheduled")
        .order("scheduled_date", { ascending: true })
        .order("start_time", { ascending: true });

      setSessions(data ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  function openNoteModal(sessionId: string, status: "attended" | "absent", studentName: string) {
    setNoteSessionId(sessionId);
    setNoteStatus(status);
    setNoteStudentName(studentName);
    setNoteText("");
    setShowNoteModal(true);
  }

  async function handleConfirmAttendance() {
    setShowNoteModal(false);
    setActionLoading(noteSessionId);
    try {
      await markAttendance(noteSessionId, noteStatus, noteText.trim() || undefined);
      await fetchSessions();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkAttendance(sessionId: string, status: "attended" | "absent") {
    setActionLoading(sessionId);
    try {
      await markAttendance(sessionId, status);
      await fetchSessions();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  // Group sessions by date, then by time slot
  const groupedByDay = useMemo(() => {
    const days: Record<string, any[]> = {};
    sessions.forEach((s) => {
      if (!days[s.scheduled_date]) days[s.scheduled_date] = [];
      days[s.scheduled_date].push(s);
    });
    return Object.entries(days).sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  return (
    <PageTransition>
      <div className="space-y-5">
        <h1 className="font-display text-2xl text-gray-900">Absensi</h1>

        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{weekLabel}</p>
            {weekOffset === 0 && <p className="text-[11px] text-brand-600 font-medium">Minggu ini</p>}
          </div>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : groupedByDay.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
            <p className="text-sm text-gray-400">Tidak ada sesi di minggu ini</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            {groupedByDay.map(([date, daySessions]) => {
              const dateObj = new Date(date + "T00:00:00");
              const dayName = DAYS_OF_WEEK[dateObj.getDay()];
              const dateLabel = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
              const today = new Date().toISOString().split("T")[0];
              const isToday = date === today;
              const isPast = date < today;

              // Group by time slot
              const timeGroups: Record<string, any[]> = {};
              daySessions.forEach((s: any) => {
                const key = `${s.start_time}-${s.end_time}`;
                if (!timeGroups[key]) timeGroups[key] = [];
                timeGroups[key].push(s);
              });

              return (
                <motion.div key={date} variants={item}>
                  {/* Day header */}
                  <div className={`flex items-center gap-2 mb-2 px-1 ${isToday ? "text-brand-600" : "text-gray-700"}`}>
                    <span className={`text-sm font-bold ${isToday ? "text-brand-600" : ""}`}>
                      {dayName}, {dateLabel}
                    </span>
                    {isToday && (
                      <span className="text-[10px] font-bold bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full border border-brand-100">
                        Hari ini
                      </span>
                    )}
                  </div>

                  {/* Time groups */}
                  <div className="space-y-3">
                    {Object.keys(timeGroups).sort().map((timeKey) => {
                      const timeSessions = timeGroups[timeKey];
                      const [startTime, endTime] = timeKey.split("-");
                      return (
                        <div key={timeKey} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          {/* Time header */}
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-bold text-gray-500">
                              {formatTime(startTime)} – {formatTime(endTime)} · {timeSessions.length} murid
                            </span>
                          </div>
                          {/* Students */}
                          <div className="divide-y divide-gray-50">
                            {timeSessions.map((session: any) => (
                              <div key={session.id} className="px-4 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar name={session.students?.full_name ?? ""} size="sm" />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{session.students?.full_name}</p>
                                    {session.admin_note && (
                                      <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                        <MessageSquare size={10} />
                                        {session.admin_note}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {session.status === "scheduled" && (isPast || isToday) ? (
                                    <>
                                      <button
                                        onClick={() => openNoteModal(session.id, "attended", session.students?.full_name ?? "")}
                                        disabled={actionLoading === session.id}
                                        className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle size={16} className="text-emerald-500" />
                                      </button>
                                      <button
                                        onClick={() => openNoteModal(session.id, "absent", session.students?.full_name ?? "")}
                                        disabled={actionLoading === session.id}
                                        className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors disabled:opacity-50"
                                      >
                                        <XCircle size={16} className="text-rose-400" />
                                      </button>
                                    </>
                                  ) : session.status === "scheduled" ? (
                                    <Badge variant="scheduled">Terjadwal</Badge>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <Badge variant={session.status}>
                                        {SESSION_STATUS[session.status as keyof typeof SESSION_STATUS]}
                                      </Badge>
                                      <button
                                        onClick={() => openNoteModal(session.id, session.status, session.students?.full_name ?? "")}
                                        disabled={actionLoading === session.id}
                                        className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50"
                                        title="Edit catatan"
                                      >
                                        <MessageSquare size={12} className="text-gray-400" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title={noteStatus === "attended" ? "Tandai Hadir" : "Tandai Tidak Hadir"}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {noteStudentName} — {noteStatus === "attended" ? "Hadir" : "Tidak Hadir"}
          </p>
          <Input
            label="Catatan (opsional)"
            placeholder="Contoh: Teknik butterfly sudah improve"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Button className="w-full" onClick={handleConfirmAttendance}>
            Simpan
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
