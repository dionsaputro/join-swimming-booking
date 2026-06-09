"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Plus, RefreshCw, Check, Pencil, Trash2, Lock } from "lucide-react";
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
import { updateStudent, deleteStudent } from "@/lib/actions/students";
import { createPrivatePackage } from "@/lib/actions/private-sessions";
import { updateSession } from "@/lib/actions/sessions";
import { formatTime } from "@/lib/utils";
import { LEVEL_LABELS, LEVELS, SESSION_STATUS, DAYS_OF_WEEK } from "@/lib/constants";

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
  const router = useRouter();
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

  // Edit Student Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSocial, setEditSocial] = useState("");
  const [editLevel, setEditLevel] = useState<"pemula" | "menengah" | "lanjut">("pemula");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [editing, setEditing] = useState(false);

  // Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Private Session Modal
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [pvtType, setPvtType] = useState<"trial" | "paket">("paket");
  const [pvtSessions, setPvtSessions] = useState<Array<{ date: string; start_time: string; end_time: string }>>([
    { date: "", start_time: "", end_time: "" },
    { date: "", start_time: "", end_time: "" },
    { date: "", start_time: "", end_time: "" },
    { date: "", start_time: "", end_time: "" },
  ]);
  const [pvtAmount, setPvtAmount] = useState("");
  const [pvtError, setPvtError] = useState("");
  const [pvtCreating, setPvtCreating] = useState(false);

  // Edit Session Modal
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editSessionId, setEditSessionId] = useState("");
  const [editSessionDate, setEditSessionDate] = useState("");
  const [editSessionStart, setEditSessionStart] = useState("");
  const [editSessionEnd, setEditSessionEnd] = useState("");
  const [editSessionError, setEditSessionError] = useState("");
  const [editingSession, setEditingSession] = useState(false);

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

  function openEditModal() {
    if (!student) return;
    setEditName(student.full_name);
    setEditPhone(student.phone);
    setEditSocial(student.social_handle || "");
    setEditLevel(student.level);
    setEditNotes(student.notes || "");
    setEditError("");
    setShowEditModal(true);
  }

  async function handleEdit() {
    if (!editName.trim() || !editPhone.trim()) {
      setEditError("Nama dan nomor HP wajib diisi");
      return;
    }
    setEditing(true);
    setEditError("");
    try {
      await updateStudent(id, {
        full_name: editName.trim(),
        phone: editPhone.trim(),
        social_handle: editSocial.trim() || null,
        level: editLevel,
        notes: editNotes.trim() || null,
      });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Gagal mengubah data");
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteStudent(id);
      router.push("/admin/students");
    } catch {
      setDeleting(false);
    }
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

  async function handleCreatePrivate() {
    const count = pvtType === "trial" ? 1 : 4;
    const sessionsToUse = pvtSessions.slice(0, count);

    // Validate
    for (let i = 0; i < count; i++) {
      const s = sessionsToUse[i];
      if (!s.date || !s.start_time || !s.end_time) {
        setPvtError(`Sesi ${i + 1}: tanggal dan waktu wajib diisi`);
        return;
      }
      if (s.start_time >= s.end_time) {
        setPvtError(`Sesi ${i + 1}: waktu mulai harus sebelum waktu selesai`);
        return;
      }
    }
    if (!pvtAmount) {
      setPvtError("Nominal wajib diisi");
      return;
    }

    setPvtCreating(true);
    setPvtError("");
    try {
      await createPrivatePackage({
        student_id: id,
        session_type: pvtType,
        sessions: sessionsToUse.map((s) => ({
          date: s.date,
          start_time: s.start_time + ":00",
          end_time: s.end_time + ":00",
        })),
        amount: parseInt(pvtAmount),
      });
      setShowPrivateModal(false);
      resetPrivateForm();
      fetchData();
    } catch (err) {
      setPvtError(err instanceof Error ? err.message : "Gagal membuat paket private");
    } finally {
      setPvtCreating(false);
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

  function resetPrivateForm() {
    setPvtType("paket");
    setPvtSessions([
      { date: "", start_time: "", end_time: "" },
      { date: "", start_time: "", end_time: "" },
      { date: "", start_time: "", end_time: "" },
      { date: "", start_time: "", end_time: "" },
    ]);
    setPvtAmount("");
    setPvtError("");
  }

  function openEditSession(session: any) {
    setEditSessionId(session.id);
    setEditSessionDate(session.scheduled_date);
    setEditSessionStart(session.start_time.slice(0, 5));
    setEditSessionEnd(session.end_time.slice(0, 5));
    setEditSessionError("");
    setShowEditSessionModal(true);
  }

  async function handleEditSession() {
    if (!editSessionDate || !editSessionStart || !editSessionEnd) {
      setEditSessionError("Semua field wajib diisi");
      return;
    }
    if (editSessionStart >= editSessionEnd) {
      setEditSessionError("Jam mulai harus sebelum jam selesai");
      return;
    }
    setEditingSession(true);
    setEditSessionError("");
    try {
      await updateSession(editSessionId, {
        scheduled_date: editSessionDate,
        start_time: editSessionStart + ":00",
        end_time: editSessionEnd + ":00",
      });
      setShowEditSessionModal(false);
      fetchData();
    } catch (err) {
      setEditSessionError(err instanceof Error ? err.message : "Gagal mengubah jadwal");
    } finally {
      setEditingSession(false);
    }
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
            {/* Edit & Delete */}
            <div className="flex gap-1.5">
              <button onClick={openEditModal} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-brand-50 flex items-center justify-center transition-colors">
                <Pencil size={15} className="text-gray-500" />
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-rose-50 flex items-center justify-center transition-colors">
                <Trash2 size={15} className="text-gray-500" />
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>{student.phone}</p>
            {student.social_handle && <p>{student.social_handle}</p>}
            {student.notes && <p className="text-gray-400 italic">{student.notes}</p>}
            <p className="text-xs text-gray-400">Bergabung {new Date(student.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="mt-4 flex gap-2">
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

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" onClick={() => setShowPackageModal(true)}>
            <Plus size={16} />
            Paket Baru
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => setShowPrivateModal(true)}>
            <Lock size={16} />
            Sesi Private
          </Button>
        </div>

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
                <motion.div
                  key={session.id}
                  variants={item}
                  className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${
                    session.status === "scheduled" ? "cursor-pointer hover:shadow-md transition-shadow" : ""
                  }`}
                  onClick={() => session.status === "scheduled" && openEditSession(session)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {new Date(session.scheduled_date + "T00:00:00").toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {!session.slot_id && (
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                          Private
                        </span>
                      )}
                      {session.status === "scheduled" && (
                        <Pencil size={12} className="text-gray-300" />
                      )}
                    </div>
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

      {/* Edit Student Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Data Murid">
        <div className="space-y-4">
          <Input label="Nama Lengkap" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="No. HP / WhatsApp" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          <Input label="Social Handle" value={editSocial} onChange={(e) => setEditSocial(e.target.value)} placeholder="@username" />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Level</label>
            <div className="flex gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEditLevel(level)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    editLevel === level ? "bg-brand-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
          <Input label="Catatan" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Catatan untuk murid" />
          {editError && <p className="text-xs text-rose-500 font-medium">{editError}</p>}
          <Button className="w-full" onClick={handleEdit} isLoading={editing}>Simpan Perubahan</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hapus Murid">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Yakin ingin menghapus <span className="font-bold">{student.full_name}</span>? Semua data paket dan sesi murid ini akan ikut terhapus.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={deleting}>Hapus</Button>
          </div>
        </div>
      </Modal>

      {/* Private Session Modal */}
      <Modal isOpen={showPrivateModal} onClose={() => setShowPrivateModal(false)} title="Paket Private">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Sesi private menggunakan jam custom di luar slot regular. Tidak tampil di kalender publik.</p>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tipe</label>
            <div className="flex gap-2">
              {(["trial", "paket"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPvtType(type)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    pvtType === type ? "bg-brand-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {type === "trial" ? "Trial (1 sesi)" : "Paket (4 sesi)"}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Jadwal Sesi</label>
            {Array.from({ length: pvtType === "trial" ? 1 : 4 }).map((_, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <p className="text-[11px] font-bold text-gray-500">Sesi {idx + 1}</p>
                <input
                  type="date"
                  value={pvtSessions[idx]?.date || ""}
                  onChange={(e) => {
                    const updated = [...pvtSessions];
                    updated[idx] = { ...updated[idx], date: e.target.value };
                    setPvtSessions(updated);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={pvtSessions[idx]?.start_time || ""}
                    onChange={(e) => {
                      const updated = [...pvtSessions];
                      updated[idx] = { ...updated[idx], start_time: e.target.value };
                      setPvtSessions(updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <input
                    type="time"
                    value={pvtSessions[idx]?.end_time || ""}
                    onChange={(e) => {
                      const updated = [...pvtSessions];
                      updated[idx] = { ...updated[idx], end_time: e.target.value };
                      setPvtSessions(updated);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Amount */}
          <Input label="Nominal (Rp)" type="number" placeholder="400000" value={pvtAmount} onChange={(e) => setPvtAmount(e.target.value)} />

          {pvtError && <p className="text-xs text-rose-500 font-medium">{pvtError}</p>}
          <Button className="w-full" onClick={handleCreatePrivate} isLoading={pvtCreating}>Buat Paket Private</Button>
        </div>
      </Modal>

      {/* Edit Session Modal */}
      <Modal isOpen={showEditSessionModal} onClose={() => setShowEditSessionModal(false)} title="Edit Jadwal Sesi">
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Ubah tanggal atau jam sesi ini.</p>
          <Input label="Tanggal" type="date" value={editSessionDate} onChange={(e) => setEditSessionDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jam Mulai" type="time" value={editSessionStart} onChange={(e) => setEditSessionStart(e.target.value)} />
            <Input label="Jam Selesai" type="time" value={editSessionEnd} onChange={(e) => setEditSessionEnd(e.target.value)} />
          </div>
          {editSessionError && <p className="text-xs text-rose-500 font-medium">{editSessionError}</p>}
          <Button className="w-full" onClick={handleEditSession} isLoading={editingSession}>Simpan Perubahan</Button>
        </div>
      </Modal>

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
                    pkgType === type ? "bg-brand-600 text-white" : "bg-gray-50 text-gray-500 border border-gray-200"
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
          <Input label="Tanggal Mulai" type="date" value={pkgStartDate} onChange={(e) => setPkgStartDate(e.target.value)} />
          <Input label="Nominal (Rp)" type="number" placeholder="400000" value={pkgAmount} onChange={(e) => setPkgAmount(e.target.value)} />
          {pkgError && <p className="text-xs text-rose-500 font-medium">{pkgError}</p>}
          <Button className="w-full" onClick={handleCreatePackage} isLoading={pkgCreating}>Buat Paket</Button>
        </div>
      </Modal>

      {/* Convert Modal */}
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
          <Input label="Tanggal Mulai" type="date" value={convertStartDate} onChange={(e) => setConvertStartDate(e.target.value)} />
          <Input label="Nominal (Rp)" type="number" placeholder="400000" value={convertAmount} onChange={(e) => setConvertAmount(e.target.value)} />
          {convertError && <p className="text-xs text-rose-500 font-medium">{convertError}</p>}
          <Button className="w-full" onClick={handleConvert} isLoading={converting}>Convert ke Paket</Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
