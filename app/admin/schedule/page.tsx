"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/utils";
import { DAYS_SHORT } from "@/lib/constants";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [slots, setSlots] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClient();

        const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
        const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

        const [slotsRes, sessionsRes] = await Promise.all([
          supabase
            .from("slots")
            .select("*")
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("sessions")
            .select("id, slot_id, scheduled_date, status, student_id, students(full_name)")
            .gte("scheduled_date", startDate)
            .lte("scheduled_date", endDate)
            .neq("status", "rescheduled")
            .not("slot_id", "is", null),
        ]);

        setSlots(slotsRes.data ?? []);
        setSessions(sessionsRes.data ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year, month, daysInMonth]);

  // Dates that have sessions
  const datesWithSessions = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach((s) => dates.add(s.scheduled_date));
    return dates;
  }, [sessions]);

  // Slots for selected date's day of week + unmatched sessions
  const selectedDaySlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();
    const daySlots = slots.filter((s) => s.day_of_week === dayOfWeek);

    const coveredSessionIds = new Set<string>();

    const slotData = daySlots.map((slot) => {
      const slotSessions = selectedDateSessions.filter((s) =>
        s.slot_id === slot.id || (s.start_time === slot.start_time && s.end_time === slot.end_time)
      );
      slotSessions.forEach((s: any) => coveredSessionIds.add(s.id));
      return { ...slot, slotSessions, isVirtual: false };
    });

    // Uncovered sessions (edited to this day but time doesn't match any slot)
    const uncovered = selectedDateSessions.filter((s) => !coveredSessionIds.has(s.id));
    const timeGroups: Record<string, any[]> = {};
    uncovered.forEach((s) => {
      const key = `${s.start_time}-${s.end_time}`;
      if (!timeGroups[key]) timeGroups[key] = [];
      timeGroups[key].push(s);
    });

    const virtualSlots = Object.entries(timeGroups).map(([key, groupSessions]) => ({
      id: `virtual-${key}`,
      start_time: groupSessions[0].start_time,
      end_time: groupSessions[0].end_time,
      max_capacity: groupSessions.length,
      is_active: true,
      slotSessions: groupSessions,
      isVirtual: true,
    }));

    return [...slotData, ...virtualSlots];
  }, [selectedDate, slots, selectedDateSessions]);

  // Sessions for selected date
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter((s) => s.scheduled_date === selectedDate);
  }, [selectedDate, sessions]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="font-display text-2xl text-gray-900">Jadwal</h1>

        {/* Calendar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h2 className="text-base font-bold text-gray-800 capitalize">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

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
        </div>

        {/* Selected Date Slots */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={selectedDate}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="space-y-4"
            >
              <div className="px-1">
                <h3 className="text-lg font-bold text-gray-800">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {selectedDaySlots.length} slot · {selectedDateSessions.length} sesi terdaftar
                </p>
              </div>

              {selectedDaySlots.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
                  <p className="text-sm text-gray-400">Tidak ada slot di hari ini</p>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                  {selectedDaySlots.map((slot) => {
                    const slotSessions: any[] = slot.slotSessions;
                    const fillPercentage = (slotSessions.length / slot.max_capacity) * 100;
                    const isFull = slotSessions.length >= slot.max_capacity;

                    return (
                      <motion.div
                        key={slot.id}
                        variants={item}
                        className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
                          !slot.is_active ? "opacity-50" : ""
                        }`}
                      >
                        <div className={`h-1 ${
                          !slot.is_active
                            ? "bg-gray-200"
                            : isFull
                              ? "bg-rose-400"
                              : fillPercentage >= 60
                                ? "bg-amber-400"
                                : "bg-brand-500"
                        }`} />
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                                <Clock size={16} className="text-gray-400" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-gray-800">
                                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                </span>
                                {!slot.is_active && (
                                  <p className="text-[11px] text-gray-400 font-medium">Nonaktif</p>
                                )}
                              </div>
                            </div>
                            {isFull ? (
                              <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                                Penuh
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                                {slot.max_capacity - slotSessions.length} sisa
                              </span>
                            )}
                          </div>

                          {/* Capacity dots */}
                          <div className="flex items-center gap-1.5 mb-3">
                            {Array.from({ length: slot.max_capacity }).map((_, dotIdx) => (
                              <div
                                key={dotIdx}
                                className={`w-4 h-4 rounded-full border-2 ${
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
                            <span className="text-[11px] text-gray-400 font-medium ml-1.5">
                              {slotSessions.length}/{slot.max_capacity}
                            </span>
                          </div>

                          {/* Enrolled students */}
                          {slotSessions.length > 0 && (
                            <div className="space-y-1.5">
                              {slotSessions.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 text-xs text-gray-600">
                                  <div className="w-5 h-5 rounded-lg bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand-700">
                                    {(s.students?.full_name ?? "?")[0]}
                                  </div>
                                  <span className="font-medium">{s.students?.full_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
