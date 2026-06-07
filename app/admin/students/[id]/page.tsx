"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Plus, RefreshCw, Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { createPackage, convertTrialToPackage } from "@/lib/actions/packages";
import { formatTime } from "@/lib/utils";
import { LEVEL_LABELS, SESSION_STATUS, DAYS_OF_WEEK } from "@/lib/constants";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Add Package Modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [pkgType, setPkgType] = useState<"trial" | "paket">("paket");
  const [pkgSlotId, setPkgSlotId] = useState("");
  const [pkgStartDate, setPkgStartDate] = useState("");
  const [pkgAmount, setPkgAmount] = useState("");
  const [pkgError, setPkgError] = useState("");
  const [pkgCreating, setPkgCreating] = useState(false);

  // Convert Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertSlotId, setConvertSlotId] = useState("");
  const [convertStartDate, setConvertStartDate] = useState("");
  const [convertAmount, setConvertAmount] = useState("");
  const [convertError, setConvertError] = useState("");
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const supabase = createClient();
      const [studentRes, packagesRes, sessionsRes, slotsRes] = await Promise.all([
        supabase.from("students").select("*").eq("id", id).single(),
        supabase
          .from("packages")
          .select("*")
          .eq("student_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("sessions")
          .select("*, slots(day_of_week, start_time, end_time)")
          .eq("student_id", id)
          .order("scheduled_date", { ascending: false }),
        supabase
          .from("slots")
          .select("*")
          .eq("is_active", true)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true }),
      ]);
      setStudent(studentRes.data);
      setPackages(packagesRes.data ?? []);
      setSessions(sessionsRes.data ?? []);
      setSlots(slotsRes.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink() {
    if (!student) return;
    const url = `${window.location.origin}/s/${student.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreatePackage() {
    if (!pkgSlotId || !pkgStartDate || !pkgAmount) {
      setPkgError("Semua field wajib diisi");
      return;
    }
    setPkgCreating(true);
    setPkgError("");
    try {
      await createPackage({
        student_id: id,
        session_type: pkgType,
        slot_id: pkgSlotId,
        start_date: pkgStartDate,
        amount: parseInt(pkgAmount),
      });
      setShowPackageModal(false);
      resetPackageForm();
      fetchData();
    } catch (err) {
      setPkgError(err instanceof Error ? err.message : "Gagal membuat paket");
    } finally {
      setPkgCreating(false);
    }
  }

  async function handleConvert() {
    if (!convertSlotId || !convertStartDate || !convertAmount) {
      setConvertError("Semua field wajib diisi");
      return;
    }
    setConverting(true);
    setConvertError("");
    try {
      await convertTrialToPackage({
        student_id: id,
        slot_id: convertSlotId,
        start_date: convertStartDate,
        amount: parseInt(convertAmount),
      });
      setShowConvertModal(false);
      resetConvertForm();
      fetchData();
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : "Gagal convert ke paket");
    } finally {
      setConverting(false);
    }
  }

  function resetPackageForm() {
    setPkgType("paket");
    setPkgSlotId("");
    setPkgStartDate("");
    setPkgAmount("");
    setPkgError("");
  }

  function resetConvertForm() {
    setConvertSlotId("");
    setConvertStartDate("");
    setConvertAmount("");
    setConvertError("");
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </PageTransition>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Murid tidak ditemukan</p>
      </div>
    );
  }

  const activePackage = packages.find((p) => p.status === "active");

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back */}
        <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft size={16} />
          Kembali
        </Link>

        {/* Profile */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-4">
            <Avatar name={student.full_name} size="lg" />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{student.full_name}</h1>
              <Badge variant={student.level}>{LEVEL_LABELS[student.level]}</Badge>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>{student.phone}</p>
            {student.social_handle && <p>{student.social_handle}</p>}
            {student.notes && <p className="text-gray-400 italic">{student.notes}</p>}
            <p className="text-xs text-gray-400">Bergabung {new Date(student.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="mt-4">
            <Button size="sm" variant="secondary" onClick={handleCopyLink}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Tersalin" : "Salin Link Reschedule"}
            </Button>
          </div>
        </div>

        {/* Active Package */}
        {activePackage && (
          <section>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Paket Aktif</h2>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`h-1 ${activePackage.is_paid ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
                    {activePackage.session_type === "trial" ? "Trial" : "Paket"}
                  </span>
                  {activePackage.is_paid ? (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Lunas</span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">Belum Lunas</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sesi</span>
                    <span className="font-bold text-gray-800">{activePackage.used_sessions}/{activePackage.total_sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Berlaku</span>
                    <span className="font-medium text-gray-700">
                      {new Date(activePackage.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      {" – "}
                      {new Date(activePackage.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nominal</span>
                    <span className="font-bold text-gray-800">Rp{activePackage.amount.toLocaleString("id-ID")}</span>
                  </div>
                </div>
                {/* Session dots */}
                <div className="flex items-center gap-2 mt-4">
                  {Array.from({ length: activePackage.total_sessions }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        i < activePackage.used_sessions ? "bg-brand-500" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                {activePackage.session_type === "trial" && (
                  <Button size="sm" variant="secondary" className="mt-4 w-full" onClick={() => setShowConvertModal(true)}>
                    <RefreshCw size={14} />
                    Convert ke Paket
                  </Button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Add Package */}
        <Button variant="primary" className="w-full" onClick={() => setShowPackageModal(true)}>
          <Plus size={16} />
          Tambah Paket Baru
        </Button>

        {/* Session History */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Riwayat Sesi</h2>
          {sessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
              <p className="text-sm text-gray-400">Belum ada riwayat sesi</p>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {sessions.map((session) => (
                <motion.div key={session.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(session.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {formatTime(session.start_time)} – {formatTime(session.end_time)}
                    </p>
                  </div>
                  <Badge variant={session.status}>
                    {SESSION_STATUS[session.status as keyof typeof SESSION_STATUS]}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* Add Package Modal */}
      <Modal isOpen={showPackageModal} onClose={() => setShowPackageModal(false)} title="Tambah Paket Baru">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tipe</label>
            <div className="flex gap-2">
              {(["trial", "paket"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPkgType(type)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    pkgType === type
                      ? "bg-brand-600 text-white"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {type === "trial" ? "Trial" : "Paket (4 sesi)"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Slot</label>
            <select
              value={pkgSlotId}
              onChange={(e) => setPkgSlotId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="">Pilih slot</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {DAYS_OF_WEEK[slot.day_of_week]} {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Tanggal Mulai"
            type="date"
            value={pkgStartDate}
            onChange={(e) => setPkgStartDate(e.target.value)}
          />
          <Input
            label="Nominal (Rp)"
            type="number"
            placeholder="400000"
            value={pkgAmount}
            onChange={(e) => setPkgAmount(e.target.value)}
          />
          {pkgError && (
            <p className="text-xs text-rose-500 font-medium">{pkgError}</p>
          )}
          <Button className="w-full" onClick={handleCreatePackage} isLoading={pkgCreating}>
            Buat Paket
          </Button>
        </div>
      </Modal>

      {/* Convert to Package Modal */}
      <Modal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} title="Convert ke Paket">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Slot</label>
            <select
              value={convertSlotId}
              onChange={(e) => setConvertSlotId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
              <option value="">Pilih slot</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {DAYS_OF_WEEK[slot.day_of_week]} {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Tanggal Mulai"
            type="date"
            value={convertStartDate}
            onChange={(e) => setConvertStartDate(e.target.value)}
          />
          <Input
            label="Nominal (Rp)"
            type="number"
            placeholder="400000"
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
          />
          {convertError && (
            <p className="text-xs text-rose-500 font-medium">{convertError}</p>
          )}
          <Button className="w-full" onClick={handleConvert} isLoading={converting}>
            Convert ke Paket
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
