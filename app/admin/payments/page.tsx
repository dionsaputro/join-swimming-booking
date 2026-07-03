"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import PageTransition from "@/components/layout/PageTransition";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { markAsPaid } from "@/lib/actions/payments";
import { SESSION_TYPE_LABELS } from "@/lib/constants";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function PaymentsPage() {
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payPkgId, setPayPkgId] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState("");
  const [payStudentName, setPayStudentName] = useState("");
  const [paySessionType, setPaySessionType] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("packages")
        .select("*, students(full_name)")
        .order("is_paid", { ascending: true })
        .order("created_at", { ascending: false });
      setPackages(data ?? []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  function openPayModal(pkg: any) {
    setPayPkgId(pkg.id);
    setPayAmount(pkg.amount);
    setPayStudentName(pkg.students?.full_name ?? "");
    setPaySessionType(pkg.session_type);
    setPayDate(new Date().toISOString().split("T")[0]);
    setShowPayModal(true);
  }

  async function handleConfirmPay() {
    setShowPayModal(false);
    setActionLoading(payPkgId);
    try {
      await markAsPaid(payPkgId, payAmount, new Date(payDate + "T00:00:00").toISOString());
      await fetchPackages();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  function downloadInvoice(pkg: any) {
    const paidDate = pkg.paid_at
      ? new Date(pkg.paid_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
      : "-";
    const createdDate = new Date(pkg.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
    const studentName = pkg.students?.full_name ?? "-";
    const sessionType = SESSION_TYPE_LABELS[pkg.session_type] || pkg.session_type;
    const amount = `Rp${pkg.amount.toLocaleString("id-ID")}`;
    const invoiceNo = `INV-${pkg.id.slice(0, 8).toUpperCase()}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 48px; color: #1a1a1a; max-width: 600px; margin: 0 auto; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; }
  .logo { height: 48px; }
  .invoice-title { font-size: 24px; font-weight: 700; color: #374151; }
  .invoice-no { font-size: 12px; color: #9ca3af; margin-top: 4px; }
  .section { margin-bottom: 32px; }
  .label { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .value { font-size: 14px; color: #374151; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .table th { text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
  .table td { padding: 16px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
  .table .amount { text-align: right; font-weight: 700; font-size: 16px; }
  .total-row td { border-bottom: none; padding-top: 16px; }
  .total-row .amount { font-size: 20px; color: #059669; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  .paid-badge { display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 8px; border: 1px solid #d1fae5; }
  @media print { body { padding: 24px; } }
</style></head><body>
<div class="header">
  <img src="/logo.png" class="logo" alt="Join Swimming" />
  <div style="text-align: right;">
    <div class="invoice-title">Invoice</div>
    <div class="invoice-no">${invoiceNo}</div>
  </div>
</div>
<div class="section">
  <div class="label">Diterbitkan untuk</div>
  <div class="value">${studentName}</div>
</div>
<div class="section">
  <div class="label">Tanggal Bayar</div>
  <div class="value">${paidDate}</div>
</div>
<table class="table">
  <thead><tr><th>Deskripsi</th><th style="text-align:right">Jumlah</th></tr></thead>
  <tbody>
    <tr><td>${sessionType}<br><span style="font-size:12px;color:#9ca3af">Paket dibuat ${createdDate}</span></td><td class="amount">${amount}</td></tr>
    <tr class="total-row"><td><strong>Total</strong></td><td class="amount">${amount}</td></tr>
  </tbody>
</table>
<div style="text-align:right"><span class="paid-badge">LUNAS</span></div>
<div class="footer">Join Swimming &middot; Terima kasih!</div>
</body></html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      // ponytail: let user Cmd+P / save as PDF from the new tab
      setTimeout(() => w.print(), 300);
    }
  }

  const filteredPackages = packages
    .filter((pkg) => {
      if (filter === "unpaid") return !pkg.is_paid;
      if (filter === "paid") return pkg.is_paid;
      return true;
    })
    .sort((a, b) => (a.is_paid === b.is_paid ? 0 : a.is_paid ? 1 : -1));

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-48" />
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
        <h1 className="font-display text-2xl text-gray-900">Pembayaran</h1>

        {/* Filter */}
        <div className="flex gap-2">
          {[
            { key: "unpaid", label: "Belum Lunas" },
            { key: "paid", label: "Lunas" },
            { key: "all", label: "Semua" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as typeof filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {filteredPackages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-10">
              <p className="text-sm text-gray-400">Tidak ada data pembayaran</p>
            </div>
          ) : (
            filteredPackages.map((pkg) => (
              <motion.div key={pkg.id} variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={pkg.students?.full_name ?? ""} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{pkg.students?.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 font-medium">
                          {SESSION_TYPE_LABELS[pkg.session_type]}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          Rp{pkg.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {pkg.is_paid ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadInvoice(pkg)}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                        title="Download Invoice"
                      >
                        <Download size={14} className="text-gray-500" />
                      </button>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Lunas
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openPayModal(pkg)}
                      isLoading={actionLoading === pkg.id}
                    >
                      <Check size={14} />
                      Lunas
                    </Button>
                  )}
                </div>
                {pkg.is_paid && pkg.paid_at && (
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">
                    Dibayar {new Date(pkg.paid_at).toLocaleDateString("id-ID")}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Pay Confirmation Modal */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Tandai Lunas">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-bold">{payStudentName}</span> — {SESSION_TYPE_LABELS[paySessionType] || paySessionType}
          </p>
          <p className="text-lg font-bold text-gray-900">Rp{payAmount.toLocaleString("id-ID")}</p>
          <Input
            label="Tanggal Pembayaran"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />
          <Button className="w-full" onClick={handleConfirmPay}>
            Konfirmasi Lunas
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
