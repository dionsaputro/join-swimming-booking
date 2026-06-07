"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { createStudent } from "@/lib/actions/students";
import { LEVEL_LABELS, LEVELS } from "@/lib/constants";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [students, setStudents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formSocial, setFormSocial] = useState("");
  const [formLevel, setFormLevel] = useState<"pemula" | "menengah" | "lanjut">("pemula");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const supabase = createClient();
      const [studentsRes, packagesRes] = await Promise.all([
        supabase
          .from("students")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("packages")
          .select("*")
          .eq("status", "active"),
      ]);
      setStudents(studentsRes.data ?? []);
      setPackages(packagesRes.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formName.trim() || !formPhone.trim()) {
      setFormError("Nama dan nomor HP wajib diisi");
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      await createStudent({
        full_name: formName.trim(),
        phone: formPhone.trim(),
        social_handle: formSocial.trim() || undefined,
        level: formLevel,
        notes: formNotes.trim() || undefined,
        joined_at: new Date().toISOString().split("T")[0],
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menambah murid");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormPhone("");
    setFormSocial("");
    setFormLevel("pemula");
    setFormNotes("");
    setFormError("");
  }

  const filteredStudents = students.filter((student) => {
    const matchSearch = student.full_name.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === "all" || student.level === filterLevel;
    return matchSearch && matchLevel;
  });

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-gray-900">Murid</h1>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            Tambah
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama murid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {["all", "pemula", "menengah", "lanjut"].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filterLevel === level
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {level === "all" ? "Semua" : LEVEL_LABELS[level]}
            </button>
          ))}
        </div>

        {/* Student List */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
              <p className="text-sm text-gray-400">Tidak ada murid ditemukan</p>
            </div>
          ) : (
            filteredStudents.map((student) => {
              const activePkg = packages.find(
                (p) => p.student_id === student.id
              );
              return (
                <motion.div key={student.id} variants={item}>
                  <Link href={`/admin/students/${student.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.full_name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{student.full_name}</p>
                            <Badge variant={student.level}>{LEVEL_LABELS[student.level]}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {activePkg ? (
                              <>
                                <span className="text-xs text-gray-400 font-medium">
                                  {activePkg.session_type === "trial" ? "Trial" : "Paket"} · {activePkg.used_sessions}/{activePkg.total_sessions} sesi
                                </span>
                                {!activePkg.is_paid && (
                                  <span className="text-[11px] text-rose-500 font-bold">Belum lunas</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">Belum ada paket</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Create Student Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Murid Baru">
        <div className="space-y-4">
          <Input
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <Input
            label="No. HP / WhatsApp"
            placeholder="08xxxxxxxxxx"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />
          <Input
            label="Social Handle (opsional)"
            placeholder="@username"
            value={formSocial}
            onChange={(e) => setFormSocial(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Level</label>
            <div className="flex gap-2">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormLevel(level)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    formLevel === level
                      ? "bg-brand-600 text-white"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Catatan (opsional)"
            placeholder="Catatan untuk murid"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
          {formError && (
            <p className="text-xs text-rose-500 font-medium">{formError}</p>
          )}
          <Button className="w-full" onClick={handleCreate} isLoading={creating}>
            Simpan
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
