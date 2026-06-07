"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, ChevronLeft, ChevronRight, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { createRescheduleRequest } from "@/lib/actions/reschedule";
import { formatTime } from "@/lib/utils";
import { DAYS_SHORT } from "@/lib/constants";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ReschedulePage() {
  const { token } = useParams<{ token: string }>();

  const [student, setStudent] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Get student by token
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("token", token)
          .single();

        if (studentError || !studentData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setStudent(studentData);

        // Fetch sessions, slots, and packages
        const [sessionsRes, slotsRes, packagesRes, allSessionsRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("*")
            .eq("student_id", studentData.id)
            .eq("status", "scheduled")
            .is("reschedule_from", null)
            .order("scheduled_date", { ascending: true }),
          supabase
            .from("slots")
            .select("*")
            .eq("is_active", true)
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("packages")
            .select("*")
            .eq("student_id", studentData.id)
            .eq("status", "active"),
          supabase
            .from("sessions")
            .select("id, slot_id, scheduled_date, status")
            .neq("status", "rescheduled"),
        ]);

        setSessions(sessionsRes.data ?? []);
        setSlots(slotsRes.data ?? []);
        setPackages(packagesRes.data ?? []);
        setAllSessions(allSessionsRes.data ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  const activePackage = packages[0] ?? null;

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();
    return slots
      .filter((slot) => slot.day_of_week === dayOfWeek)
      .map((slot) => {
        const count = allSessions.filter(
          (s) => s.slot_id === slot.id && s.scheduled_date === selectedDate
        ).length;
        return { ...slot, currentCount: count, isFull: count >= slot.max_capacity };
      });
  }, [selectedDate, slots, allSessions]);

  const handleSubmit = async () => {
    if (!student || !selectedSession || !selectedSlot || !selectedDate) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      await createRescheduleRequest({
        student_id: student.id,
        session_id: selectedSession,
        requested_slot_id: selectedSlot,
        requested_date: selectedDate,
      });
      setSubmitted(true);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-brand-50 rounded-2xl flex items-center justify-center animate-pulse">
            <Waves size={24} className="text-brand-300" />
          </div>
          <p className="text-sm text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Waves size={24} className="text-gray-300" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">Link tidak valid</h1>
          <p className="text-sm text-gray-400 mt-2">Token tidak ditemukan. Hubungi pelatih Anda.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <CheckCircle size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">Request Terkirim</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
            Permintaan reschedule kamu sudah dikirim. Pelatih akan mengonfirmasi via WhatsApp.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <div className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-3">
            <Image src="/logo.png" alt="Join Swimming" width={64} height={64} className="rounded-2xl" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mt-2">Reschedule Sesi</h1>
          <p className="text-sm text-gray-400 font-medium">Halo, {student.full_name}</p>
        </div>

        {/* Step 1 */}
        <section>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
            <h2 className="text-sm font-bold text-gray-700">Pilih sesi yang ingin dipindah</h2>
          </div>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-8">
              <p className="text-sm text-gray-400">Tidak ada sesi yang bisa direschedule</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isSelected = selectedSession === session.id;
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`w-full bg-white rounded-2xl border shadow-sm p-4 text-left transition-all ${
                      isSelected ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-brand-50" : "bg-gray-50"}`}>
                          <Clock size={16} className={isSelected ? "text-brand-600" : "text-gray-400"} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {new Date(session.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {formatTime(session.start_time)} – {formatTime(session.end_time)}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={20} className="text-brand-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 2 */}
        <AnimatePresence>
          {selectedSession && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                <h2 className="text-sm font-bold text-gray-700">Pilih tanggal dan jam baru</h2>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-3">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronLeft size={16} className="text-gray-500" />
                  </button>
                  <span className="text-sm font-bold text-gray-700 capitalize">
                    {currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <ChevronRight size={16} className="text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_SHORT.map((d) => (
                    <div key={d} className="text-center text-[10px] text-gray-400 font-bold uppercase py-1.5">{d}</div>
                  ))}
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isDateSelected = selectedDate === dateStr;
                    const isToday = dateStr === new Date().toISOString().split("T")[0];
                    const isInRange = activePackage
                      ? dateStr >= activePackage.start_date && dateStr <= activePackage.end_date
                      : true;
                    const isPast = dateStr < new Date().toISOString().split("T")[0];

                    return (
                      <button
                        key={day}
                        disabled={isPast || !isInRange}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`
                          aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-all
                          ${isDateSelected ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : ""}
                          ${isToday && !isDateSelected ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : ""}
                          ${isPast || !isInRange ? "text-gray-300 cursor-not-allowed" : !isDateSelected ? "text-gray-700 hover:bg-gray-50" : ""}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots */}
              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div
                    key={selectedDate}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {availableSlots.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-6">
                        <p className="text-xs text-gray-400 font-medium">Tidak ada slot tersedia di hari ini</p>
                      </div>
                    ) : (
                      availableSlots.map((slot) => {
                        const spotsLeft = slot.max_capacity - slot.currentCount;
                        return (
                          <button
                            key={slot.id}
                            disabled={slot.isFull}
                            onClick={() => setSelectedSlot(slot.id)}
                            className={`w-full bg-white rounded-2xl border shadow-sm p-4 text-left transition-all ${
                              selectedSlot === slot.id ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-100"
                            } ${slot.isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedSlot === slot.id ? "bg-brand-50" : "bg-gray-50"}`}>
                                  <Clock size={14} className={selectedSlot === slot.id ? "text-brand-600" : "text-gray-400"} />
                                </div>
                                <span className="text-sm font-bold text-gray-800">
                                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                </span>
                              </div>
                              {slot.isFull ? (
                                <span className="text-[11px] font-bold text-rose-500">Penuh</span>
                              ) : (
                                <span className="text-[11px] font-bold text-brand-600">{spotsLeft} sisa</span>
                              )}
                            </div>
                            {/* Dots */}
                            <div className="flex items-center gap-1 ml-[42px]">
                              {Array.from({ length: slot.max_capacity }).map((_, dotIdx) => (
                                <div
                                  key={dotIdx}
                                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                                    dotIdx < slot.currentCount
                                      ? "bg-brand-500 border-brand-500"
                                      : "bg-transparent border-gray-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Error */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3">
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Submit */}
        {selectedSession && selectedDate && selectedSlot && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Button className="w-full" size="lg" onClick={handleSubmit} isLoading={submitting}>
              Kirim Permintaan Reschedule
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
