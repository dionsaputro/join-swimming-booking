"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Calendar, CreditCard, MessageCircle, Bell } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { markAttendance } from "@/lib/actions/attendance";
import { approveReschedule, rejectReschedule } from "@/lib/actions/reschedule";
import { formatTime } from "@/lib/utils";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminDashboard() {
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [tomorrowSessions, setTomorrowSessions] = useState<any[]>([]);
  const [overdueSessions, setOverdueSessions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [unpaidPackages, setUnpaidPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      const [sessionsRes, tomorrowRes, overdueRes, requestsRes, packagesRes] = await Promise.all([
        supabase
          .from("sessions")
          .select("*, students(full_name, phone)")
          .eq("scheduled_date", today)
          .neq("status", "rescheduled")
          .order("start_time", { ascending: true }),
        supabase
          .from("sessions")
          .select("*, students(full_name, phone)")
          .eq("scheduled_date", tomorrow)
          .neq("status", "rescheduled")
          .order("start_time", { ascending: true }),
        supabase
          .from("sessions")
          .select("*, students(full_name)")
          .lt("scheduled_date", today)
          .eq("status", "scheduled")
          .order("scheduled_date", { ascending: false })
          .limit(20),
        supabase
          .from("reschedule_requests")
          .select("*, students(full_name), sessions(scheduled_date, start_time, end_time, slot_id)")
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("packages")
          .select("*, students(full_name)")
          .eq("is_paid", false)
          .eq("status", "active")
          .order("created_at", { ascending: false }),
      ]);

      setTodaySessions(sessionsRes.data ?? []);
      setTomorrowSessions(tomorrowRes.data ?? []);
      setOverdueSessions(overdueRes.data ?? []);
      setPendingRequests(requestsRes.data ?? []);
      setUnpaidPackages(packagesRes.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAttendance(sessionId: string, status: "attended" | "absent") {
    setActionLoading(sessionId);
    try {
      await markAttendance(sessionId, status);
      await fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(requestId: string) {
    setActionLoading(requestId);
    try {
      await approveReschedule(requestId);
      await fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(requestId: string) {
    setActionLoading(requestId);
    try {
      await rejectReschedule(requestId);
      await fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl text-gray-900">Beranda</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Reminder Besok */}
        {tomorrowSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-amber-500" />
              <h2 className="text-sm font-bold text-gray-700">
                Jadwal Besok ({tomorrowSessions.length})
              </h2>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {(() => {
                // Group by time slot
                const grouped: Record<string, typeof tomorrowSessions> = {};
                tomorrowSessions.forEach((session) => {
                  const key = `${session.start_time}-${session.end_time}`;
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(session);
                });
                return Object.keys(grouped).sort().map((key) => {
                  const groupSess = grouped[key];
                  const first = groupSess[0];
                  return (
                    <motion.div key={key} variants={item}>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-amber-500" />
                        <span className="text-xs font-bold text-gray-500">
                          {formatTime(first.start_time)} – {formatTime(first.end_time)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupSess.map((session: any) => {
                          const phone = session.students?.phone?.replace(/^0/, "62") || "";
                          const name = session.students?.full_name || "";
                          const time = `${formatTime(session.start_time)}-${formatTime(session.end_time)}`;
                          const tomorrow_date = new Date(Date.now() + 86400000).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
                          const waText = encodeURIComponent(`Halo ${name}, ini reminder jadwal renang kamu besok ya:\n\n📅 ${tomorrow_date}\n⏰ ${time}\n\nSampai ketemu di kolam! 🏊`);
                          const waUrl = `https://wa.me/${phone}?text=${waText}`;

                          return (
                            <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar name={name} size="sm" />
                                  <p className="text-sm font-semibold text-gray-800">{name}</p>
                                </div>
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                >
                                  <MessageCircle size={18} className="text-emerald-600" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </motion.div>
          </section>
        )}

        {/* Jadwal Hari Ini */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-brand-600" />
            <h2 className="text-sm font-bold text-gray-700">
              Jadwal Hari Ini ({todaySessions.length})
            </h2>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {todaySessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
                <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tidak ada sesi hari ini</p>
              </div>
            ) : (
              (() => {
                // Group sessions by time slot
                const grouped: Record<string, typeof todaySessions> = {};
                todaySessions.forEach((session) => {
                  const key = `${session.start_time}-${session.end_time}`;
                  if (!grouped[key]) grouped[key] = [];
                  grouped[key].push(session);
                });
                const sortedKeys = Object.keys(grouped).sort();

                return sortedKeys.map((key) => {
                  const groupSessions = grouped[key];
                  const firstSession = groupSessions[0];
                  return (
                    <motion.div key={key} variants={item}>
                      {/* Time slot header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-brand-600" />
                        <span className="text-xs font-bold text-gray-500">
                          {formatTime(firstSession.start_time)} – {formatTime(firstSession.end_time)}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          ({groupSessions.length} murid)
                        </span>
                      </div>
                      {/* Students in this slot */}
                      <div className="space-y-2">
                        {groupSessions.map((session) => {
                          const phone = session.students?.phone?.replace(/^0/, "62") || "";
                          const name = session.students?.full_name || "";
                          const time = `${formatTime(session.start_time)}-${formatTime(session.end_time)}`;
                          const todayDate = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
                          const waText = encodeURIComponent(`Halo ${name}, reminder jadwal renang hari ini:\n\n📅 ${todayDate}\n⏰ ${time}\n\nSampai ketemu di kolam!`);
                          const waUrl = `https://wa.me/${phone}?text=${waText}`;

                          return (
                            <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar name={name} size="sm" />
                                  <p className="text-sm font-semibold text-gray-800">{name}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                                  >
                                    <MessageCircle size={16} className="text-emerald-600" />
                                  </a>
                                  {session.status === "scheduled" ? (
                                    <>
                                      <button
                                        onClick={() => handleMarkAttendance(session.id, "attended")}
                                        disabled={actionLoading === session.id}
                                        className="w-9 h-9 rounded-xl bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle size={18} className="text-brand-600" />
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
                                    <Badge variant={session.status}>{session.status === "attended" ? "Hadir" : "Absen"}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        ))}
                      </div>
                    </motion.div>
                  );
                });
              })()
            )}
          </motion.div>
        </section>

        {/* Sesi Belum Diabsen (Overdue) */}
        {overdueSessions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <XCircle size={16} className="text-rose-400" />
              <h2 className="text-sm font-bold text-gray-700">
                Belum Diabsen ({overdueSessions.length})
              </h2>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {overdueSessions.map((session) => (
                <motion.div key={session.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={session.students?.full_name ?? ""} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{session.students?.full_name}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {new Date(session.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })} · {formatTime(session.start_time)} – {formatTime(session.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Request Pending */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-700">
              Request Pending ({pendingRequests.length})
            </h2>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
                <Clock size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tidak ada request pending</p>
              </div>
            ) : (
              pendingRequests.map((req) => (
                <motion.div key={req.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={req.students?.full_name ?? ""} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{req.students?.full_name}</p>
                      <p className="text-xs text-gray-400 font-medium">
                        Minta pindah ke {new Date(req.requested_date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1"
                      onClick={() => handleApprove(req.id)}
                      isLoading={actionLoading === req.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                    >
                      Reject
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </section>

        {/* Belum Lunas */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-rose-400" />
            <h2 className="text-sm font-bold text-gray-700">
              Belum Lunas ({unpaidPackages.length})
            </h2>
          </div>
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {unpaidPackages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
                <CreditCard size={24} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Semua pembayaran lunas</p>
              </div>
            ) : (
              unpaidPackages.map((pkg) => (
                <motion.div key={pkg.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={pkg.students?.full_name ?? ""} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{pkg.students?.full_name}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {pkg.session_type === "trial" ? "Trial" : "Paket"} · Rp{pkg.amount.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      Belum Lunas
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </section>
      </div>
    </PageTransition>
  );
}
