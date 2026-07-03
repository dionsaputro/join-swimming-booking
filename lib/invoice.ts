// Shared invoice generator — opens a printable invoice in a new tab.
// ponytail: browser print-to-PDF instead of a PDF lib dependency.

export interface InvoiceData {
  id: string;
  studentName: string;
  isPrivate: boolean;
  totalSessions: number;
  amount: number;
  paidAt: string | null;
}

export function openInvoice(data: InvoiceData) {
  const paidDate = data.paidAt
    ? new Date(data.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const sessionLabel = data.isPrivate
    ? `Private Renang (${data.totalSessions}) pertemuan`
    : `Group Renang (${data.totalSessions}) pertemuan`;
  const amount = `Rp${data.amount.toLocaleString("id-ID")}`;
  const invoiceNo = `INV-${data.id.slice(0, 8).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #f1f5f9; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; padding: 40px 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(15,23,42,0.08); }

  .top { background: linear-gradient(135deg, #1E3A6E 0%, #2563EB 100%); padding: 40px 48px; color: #fff; display: flex; align-items: center; justify-content: space-between; }
  .brand-wrap { display: flex; align-items: center; gap: 16px; }
  .logo { height: 64px; width: auto; background: #fff; padding: 8px; border-radius: 14px; }
  .brand-name { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
  .brand-tag { font-size: 12px; opacity: 0.75; margin-top: 2px; }
  .doc { text-align: right; }
  .doc-title { font-size: 26px; font-weight: 800; letter-spacing: 0.04em; }
  .doc-no { font-size: 12px; opacity: 0.8; margin-top: 4px; font-weight: 500; }

  .body { padding: 40px 48px; }
  .meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .meta-right { text-align: right; }
  .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
  .value { font-size: 16px; color: #1e293b; font-weight: 600; }
  .badge-wrap { text-align: right; margin-top: 12px; }
  .paid-badge { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #059669; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 999px; border: 1.5px solid #a7f3d0; letter-spacing: 0.05em; }
  .paid-badge .dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; }

  .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  .table th { text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; padding: 0 0 12px; border-bottom: 1.5px solid #e2e8f0; }
  .table th:last-child { text-align: right; }
  .table td { padding: 22px 0; font-size: 15px; color: #334155; border-bottom: 1px solid #f1f5f9; }
  .table td:last-child { text-align: right; font-weight: 600; }

  .total { display: flex; justify-content: flex-end; margin-top: 28px; }
  .total-inner { width: 260px; }
  .total-line { display: flex; justify-content: space-between; align-items: baseline; padding-top: 16px; border-top: 2px solid #1e293b; }
  .total-label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; }
  .total-amount { font-size: 24px; font-weight: 800; color: #1E3A6E; }

  .note { margin-top: 40px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; font-size: 12px; color: #64748b; line-height: 1.6; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.7; }
  .footer .brand { font-weight: 700; color: #64748b; }

  @media print {
    html, body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; border-radius: 0; max-width: 100%; }
    @page { margin: 0.4in; }
  }
</style></head><body>
<div class="sheet">
  <div class="top">
    <div class="brand-wrap">
      <img src="/logo.png" class="logo" alt="Join Swimming" />
      <div>
        <div class="brand-name">Join Swimming</div>
        <div class="brand-tag">Swimming Class</div>
      </div>
    </div>
    <div class="doc">
      <div class="doc-title">INVOICE</div>
      <div class="doc-no">${invoiceNo}</div>
    </div>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-left">
        <div class="label">Diterbitkan untuk</div>
        <div class="value">${data.studentName}</div>
      </div>
      <div class="meta-right">
        <div class="label">Tanggal Pembayaran</div>
        <div class="value">${paidDate}</div>
        <div class="badge-wrap"><span class="paid-badge"><span class="dot"></span>LUNAS</span></div>
      </div>
    </div>
    <table class="table">
      <thead><tr><th>Deskripsi</th><th>Jumlah</th></tr></thead>
      <tbody>
        <tr>
          <td>${sessionLabel}</td>
          <td>${amount}</td>
        </tr>
      </tbody>
    </table>
    <div class="total">
      <div class="total-inner">
        <div class="total-line">
          <span class="total-label">Total</span>
          <span class="total-amount">${amount}</span>
        </div>
      </div>
    </div>
    <div class="note">Pembayaran telah diterima dan diverifikasi. Invoice ini merupakan bukti pembayaran yang sah.</div>
    <div class="footer">
      <p><span class="brand">Join Swimming</span> &middot; Terima kasih atas kepercayaannya!</p>
    </div>
  </div>
</div>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }
}
