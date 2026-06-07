"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, Users, Waves } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { anonymizeName, formatTime } from "@/lib/utils";
import { DAYS_SHORT } from "@/lib/constants";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const chipColors = [
  "bg-brand-100 text-brand-700 border-brand-200",
  "bg-sky-100 text-sky-700 border-sky-200",
  "bg-violet-100 text-violet-700 border-violet-200",
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
];

export default function PublicCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessions, setSessions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [slots, setSlots] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  useEffect(() => {
    async function fetchData() {
      setFetching(true);
      try {
        const supabase = createClient();

        const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        const [sessionsRes, slotsRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("id, student_id, slot_id, scheduled_date, start_time, end_time, status, is_public, students(full_name)")
            .gte("scheduled_date", startDate)
            .lte("scheduled_date", endDate)
            .neq("status", "rescheduled")
            .eq("is_public", true),
          supabase
            .from("slots")
            .select("*")
            .eq("is_active", true)
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true }),
        ]);

        setSessions(sessionsRes.data ?? []);
        setSlots(slotsRes.data ?? []);
      } catch {
        setSessions([]);
        setSlots([]);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [year, month, daysInMonth]);

  const datesWithSessions = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach((s) => dates.add(s.scheduled_date));
    return dates;
  }, [sessions]);

  const selectedSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((s) => s.scheduled_date === selectedDate);
  }, [selectedDate, sessions]);

  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();
    return slots.filter((s) => s.day_of_week === dayOfWeek);
  }, [selectedDate, slots]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <div className="max-w-lg mx-auto px-5 py-8 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex w-20 h-20 rounded-2xl items-center justify-center mb-4">
            <Image src="/logo.png" alt="Join Swimming" width={80} height={80} className="rounded-2xl" />
          </div>
          <h1 className="font-display text-3xl text-gray-900 mb-1">Join Swimming</h1>
          <p className="text-sm text-gray-500 font-medium">Jadwal Kelas Renang</p>
        </motion.div>

        {/* Calendar Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </motion.button>
            <h2 className="text-base font-bold text-gray-800 capitalize">{monthName}</h2>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </motion.button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS_SHORT.map((day) => (
              <div key={day} className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-wide py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasSession = datesWithSessions.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().split("T")[0];

              return (
                <motion.button
                  key={day}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`
                    relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-200
                    ${isSelected
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                      : isToday
                        ? "bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  {day}
                  {hasSession && !isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-500" />
                  )}
                  {hasSession && isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Selected Date Detail */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="space-y-4"
            >
              {/* Date header */}
              <div className="px-1">
                <h3 className="text-lg font-bold text-gray-800">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {selectedDaySlots.length} slot tersedia
                </p>
              </div>

              {fetching ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-400">Memuat...</p>
                </div>
              ) : selectedDaySlots.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm"
                >
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Waves size={24} className="text-gray-300" />
                  </div>
                  <p className="text-base font-bold text-gray-700 mb-1">Tidak ada kelas</p>
                  <p className="text-sm text-gray-400">Hari ini tidak ada jadwal renang</p>
                </motion.div>
              ) : (
                selectedDaySlots.map((slot, slotIndex) => {
                  const slotSessions = selectedSessions.filter((s) => s.slot_id === slot.id);
                  const isFull = slotSessions.length >= slot.max_capacity;
                  const fillPercentage = (slotSessions.length / slot.max_capacity) * 100;
                  const spotsLeft = slot.max_capacity - slotSessions.length;

                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22, delay: slotIndex * 0.1 }}
                      className={`
                        rounded-3xl border overflow-hidden
                        ${isFull
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white border-gray-100 shadow-sm"
                        }
                      `}
                    >
                      {/* Top accent line */}
                      <div className={`h-1 ${
                        isFull
                          ? "bg-rose-300"
                          : fillPercentage >= 60
                            ? "bg-amber-400"
                            : "bg-brand-500"
                      }`} />

                      <div className="p-5">
                        {/* Time row */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                              isFull ? "bg-gray-100" : "bg-brand-50"
                            }`}>
                              <Clock size={20} className={isFull ? "text-gray-400" : "text-brand-600"} />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-800 tracking-tight">
                                {formatTime(slot.start_time)}
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                sampai {formatTime(slot.end_time)}
                              </p>
                            </div>
                          </div>
                          {isFull ? (
                            <span className="bg-rose-50 text-rose-500 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-rose-100">
                              Penuh
                            </span>
                          ) : (
                            <span className="bg-brand-50 text-brand-600 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-brand-100">
                              {spotsLeft} sisa
                            </span>
                          )}
                        </div>

                        {/* Capacity dots */}
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {Array.from({ length: slot.max_capacity }).map((_, dotIdx) => (
                              <motion.div
                                key={dotIdx}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                  delay: slotIndex * 0.1 + 0.2 + dotIdx * 0.04,
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 15,
                                }}
                                className={`w-5 h-5 rounded-full border-2 ${
                                  dotIdx < slotSessions.length
                                    ? isFull
                                      ? "bg-rose-400 border-rose-400"
                                      : fillPercentage >= 60
                                        ? "bg-amber-400 border-amber-400"
                                        : "bg-brand-500 border-brand-500"
                                    : "bg-transparent border-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium mt-2">
                            {slotSessions.length} dari {slot.max_capacity} terisi
                          </p>
                        </div>

                        {/* Participants */}
                        {slotSessions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Users size={12} className="text-gray-400" />
                              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Peserta</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {slotSessions.map((s, idx) => (
                                <motion.div
                                  key={s.id}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    delay: slotIndex * 0.1 + 0.4 + idx * 0.07,
                                    type: "spring",
                                    stiffness: 350,
                                    damping: 18,
                                  }}
                                  className={`
                                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                                    border ${chipColors[idx % chipColors.length]}
                                  `}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full bg-current opacity-20" />
                                  {anonymizeName(s.students?.full_name ?? "")}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer hint */}
        {!selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-10"
          >
            <p className="text-sm text-gray-400 font-medium">
              Pilih tanggal untuk lihat jadwal
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
