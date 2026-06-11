"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { formatTime, anonymizeName } from "@/lib/utils";
import { DAYS_SHORT, SESSION_STATUS } from "@/lib/constants";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function StudentPortal() {
  const [step, setStep] = useState<"login" | "portal">("login");
  const [digits, setDigits] = useState("");
  const [loginError, setLoginError] = useState("");
  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [isPrivateStudent, setIsPrivateStudent] = useState(false);

  // Portal state
  const [activeTab, setActiveTab] = useState<"training" | "schedule">("training");

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calSessions, setCalSessions] = useState<any[]>([]);
  const [calSlots, setCalSlots] = useState<any[]>([]);

  async function handleLogin() {
    if (digits.length !== 4) {
      setLoginError("Masukkan 4 digit terakhir nomor HP kamu");
      return;
    }
    setLoginError("");
    const supabase = createClient();

    // Find student whose phone ends with these 4 digits
    const { data: students } = await supabase
      .from("students")
      .select("*");

    const match = students?.find((s: any) => s.phone.slice(-4) === digits);
    if (!match) {
      setLoginError("Nomor tidak ditemukan. Pastikan 4 digit terakhir benar.");
      return;
    }

    setStudent(match);

    // Fetch student's data
    const [sessRes, pkgRes, allSessRes] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .eq("student_id", match.id)
        .neq("status", "rescheduled")
        .order("scheduled_date", { ascending: false }),
      supabase
        .from("packages")
        .select("*")
        .eq("student_id", match.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("id, slot_id, student_id, scheduled_date, start_time, end_time, status, is_public")
        .eq("student_id", match.id)
        .neq("status", "rescheduled"),
    ]);

    setSessions(sessRes.data ?? []);
    setPackages(pkgRes.data ?? []);

    // Determine if student is private (has any session with slot_id = null)
    const hasPrivate = (allSessRes.data ?? []).some((s: any) => s.slot_id === null);
    setIsPrivateStudent(hasPrivate);

    setStep("portal");
  }

  // Calendar data fetch
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  useEffect(() => {
    if (step !== "portal" || activeTab !== "schedule") return;
    async function fetchCalendar() {
      const supabase = createClient();
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

      let sessQuery = supabase
        .from("sessions")
        .select("id, student_id, slot_id, scheduled_date, start_time, end_time, status, is_public, students(full_name)")
        .gte("scheduled_date", startDate)
        .lte("scheduled_date", endDate)
        .neq("status", "rescheduled");

      // If group student, only show public sessions
      if (!isPrivateStudent) {
        sessQuery = sessQuery.eq("is_public", true);
      }

      const [sessRes, slotsRes] = await Promise.all([
        sessQuery,
        supabase.from("slots").select("*").eq("is_active", true),
      ]);

      setCalSessions(sessRes.data ?? []);
      setCalSlots(slotsRes.data ?? []);
    }
    fetchCalendar();
  }, [step, activeTab, year, month, daysInMonth, isPrivateStudent]);

  const datesWithSessions = useMemo(() => {
    const dates = new Set<string>();
    calSessions.forEach((s) => dates.add(s.scheduled_date));
    return dates;
  }, [calSessions]);

  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    return calSessions.filter((s) => s.scheduled_date === selectedDate);
  }, [selectedDate, calSessions]);

  // LOGIN SCREEN
  if (step === "login") {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center">
            <div className="inline-flex w-20 h-20 rounded-2xl items-center justify-center mb-4">
              <Image src="/logo.png" alt="Join Swimming" width={80} height={80} className="rounded-2xl" />
            </div>
            <h1 className="font-display text-2xl text-gray-900">Portal Murid</h1>
            <p className="text-sm text-gray-500 mt-2">Masukkan 4 digit terakhir nomor HP kamu</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <input
              type="tel"
              maxLength={4}
              value={digits}
              onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="_ _ _ _"
              className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
            {loginError && <p className="text-sm text-rose-500 font-medium text-center">{loginError}</p>}
            <Button className="w-full" size="lg" onClick={handleLogin}>
              Masuk
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // PORTAL SCREEN
  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <div className="max-w-lg mx-auto px-5 py-6 pb-20">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-display text-xl text-gray-900">Halo, {student?.full_name}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "training", label: "Latihan Saya" },
            { key: "schedule", label: "Jadwal" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.key ? "bg-brand-600 text-white" : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "training" && (
            <motion.div
              key="training"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Payment status */}
              {packages.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-gray-700">Status Pembayaran</h2>
                  {packages.slice(0, 3).map((pkg: any) => (
                    <div key={pkg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {pkg.session_type === "trial" ? "Trial" : "Paket"} · Rp{pkg.amount?.toLocaleString("id-ID")}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(pkg.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – {new Date(pkg.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      {pkg.is_paid ? (
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Lunas</span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">Belum Lunas</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Session History */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-gray-700">Riwayat Latihan</h2>
                {sessions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-8">
                    <p className="text-sm text-gray-400">Belum ada riwayat latihan</p>
                  </div>
                ) : (
                  sessions.map((s: any) => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {new Date(s.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                        </p>
                        <p className="text-xs text-gray-400">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                      </div>
                      <Badge variant={s.status}>{SESSION_STATUS[s.status as keyof typeof SESSION_STATUS]}</Badge>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Calendar */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>
                  <h2 className="text-base font-bold text-gray-800 capitalize">{monthName}</h2>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center">
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_SHORT.map((day) => (
                    <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase py-2">{day}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasSession = datesWithSessions.has(dateStr);
                    const isSelected = selectedDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                          ${isSelected ? "bg-brand-600 text-white shadow-md" : isToday ? "bg-brand-50 text-brand-700 ring-2 ring-brand-200" : "text-gray-700 hover:bg-gray-50"}
                        `}
                      >
                        {day}
                        {hasSession && !isSelected && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected date detail */}
              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 px-1">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                  {selectedSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-8">
                      <p className="text-sm text-gray-400">Tidak ada jadwal</p>
                    </div>
                  ) : (
                    (() => {
                      // Group by time
                      const grouped: Record<string, any[]> = {};
                      selectedSessions.forEach((s) => {
                        const key = `${s.start_time}-${s.end_time}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(s);
                      });
                      return Object.keys(grouped).sort().map((key) => {
                        const group = grouped[key];
                        const first = group[0];
                        return (
                          <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={14} className="text-brand-600" />
                              <span className="text-xs font-bold text-gray-500">
                                {formatTime(first.start_time)} – {formatTime(first.end_time)}
                              </span>
                              <span className="text-[11px] text-gray-400">({group.length} peserta)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.map((s: any) => (
                                <span key={s.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-100">
                                  {anonymizeName(s.students?.full_name ?? "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
