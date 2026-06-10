import type { WeddingExpenseDoc } from "./types";
import { formatCurrency, formatNumber } from "./format";

function esc(s: string | number | undefined | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportExpensesPdf(expenses: WeddingExpenseDoc[]) {
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const byCat = new Map<string, { name: string; total: number; count: number }>();
  for (const e of expenses) {
    const k = e.categoryId || "—";
    const cur = byCat.get(k) ?? { name: e.categoryName || "—", total: 0, count: 0 };
    cur.total += e.amount || 0;
    cur.count += 1;
    byCat.set(k, cur);
  }

  const now = new Intl.DateTimeFormat("bn-IN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const catRows = Array.from(byCat.values())
    .sort((a, b) => b.total - a.total)
    .map(
      (c) => `
      <tr>
        <td class="bn">${esc(c.name)}</td>
        <td class="num">${formatNumber(c.count)}</td>
        <td class="num">${formatCurrency(c.total)}</td>
      </tr>`,
    )
    .join("");

  const rows = expenses
    .map(
      (e, idx) => `
      <tr>
        <td>${formatNumber(idx + 1)}</td>
        <td class="bn">${esc(e.title)}</td>
        <td class="bn">${esc(e.categoryName)}</td>
        <td class="num">${formatCurrency(e.amount || 0)}</td>
        <td>${esc(e.expenseDate)}</td>
        <td class="bn">${esc(e.notes || "—")}</td>
        <td class="bn">${esc(e.createdBy)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<title>বিয়ের খরচ রিপোর্ট</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans Bengali', system-ui, sans-serif; color: #0b3d2e; padding: 24px; margin:0; }
  header { border-bottom: 2px solid #0d7a5f; padding-bottom: 12px; margin-bottom: 16px; display:flex; justify-content:space-between; align-items:flex-end; }
  header h1 { font-family: 'Cormorant Garamond', serif; margin: 0; font-size: 28px; color: #064e3b; }
  .sub { color:#555; font-size: 12px; }
  .gold { color:#c9a84c; }
  .summary { display:grid; grid-template-columns: repeat(3, 1fr); gap:8px; margin-bottom: 18px; }
  .card { border:1px solid #e5e7eb; border-radius:8px; padding:10px; background:#f8faf9; }
  .label { font-size:11px; color:#666; }
  .value { font-size:16px; font-weight:600; color:#064e3b; margin-top:2px; }
  h2 { font-size: 16px; color: #064e3b; border-left: 3px solid #c9a84c; padding-left: 8px; margin: 16px 0 8px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { border:1px solid #e5e7eb; padding:6px 8px; text-align:left; vertical-align: top; }
  thead th { background:#ecfdf5; color:#064e3b; font-weight:600; }
  td.num, th.num { text-align:right; white-space:nowrap; }
  footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size:11px; color:#666; text-align:center; }
  .toolbar { position: fixed; top: 12px; right: 12px; display:flex; gap:8px; }
  .toolbar button { background:#064e3b; color:#fff; border:0; padding:8px 14px; border-radius:6px; cursor:pointer; font-family: inherit; }
  .toolbar button.secondary { background:#c9a84c; color:#1a1a1a; }
  @media print { .no-print { display:none !important; } @page { size: A4; margin: 10mm; } body { padding: 12mm; } }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">প্রিন্ট / PDF</button>
    <button class="secondary" onclick="window.close()">বন্ধ</button>
  </div>
  <header>
    <div>
      <h1>বিয়ের খরচ <span class="gold">·</span> রিপোর্ট</h1>
      <div class="sub">${now}</div>
    </div>
    <div class="sub">মোট এন্ট্রি: <b>${formatNumber(expenses.length)}</b></div>
  </header>
  <div class="summary">
    <div class="card"><div class="label">মোট খরচ</div><div class="value">${formatCurrency(total)}</div></div>
    <div class="card"><div class="label">এন্ট্রি সংখ্যা</div><div class="value">${formatNumber(expenses.length)}</div></div>
    <div class="card"><div class="label">ক্যাটাগরি</div><div class="value">${formatNumber(byCat.size)}</div></div>
  </div>

  <h2>ক্যাটাগরি অনুযায়ী সারাংশ</h2>
  <table>
    <thead><tr><th>ক্যাটাগরি</th><th class="num">এন্ট্রি</th><th class="num">মোট</th></tr></thead>
    <tbody>${catRows || '<tr><td colspan="3">—</td></tr>'}</tbody>
  </table>

  <h2>সম্পূর্ণ তালিকা</h2>
  <table>
    <thead><tr><th>#</th><th>শিরোনাম</th><th>ক্যাটাগরি</th><th class="num">পরিমাণ</th><th>তারিখ</th><th>নোট</th><th>যোগকারী</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7">কোনো খরচ নেই</td></tr>'}</tbody>
  </table>

  <footer>বিবাহ পরিকল্পনা · বিয়ের খরচ রিপোর্ট</footer>
  <script>window.addEventListener('load', () => setTimeout(() => { try { window.print(); } catch(e){} }, 600));</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) {
    alert("পপ-আপ ব্লক করা হয়েছে। অনুগ্রহ করে অনুমতি দিন।");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function exportExpensesExcel(expenses: WeddingExpenseDoc[]) {
  const header = ["শিরোনাম", "ক্যাটাগরি", "পরিমাণ", "তারিখ", "নোট", "যোগকারী"];
  const rows = expenses.map((e) => [
    e.title,
    e.categoryName,
    e.amount,
    e.expenseDate,
    e.notes ?? "",
    e.createdBy,
  ]);

  const escCell = (v: string | number) =>
    `<td>${String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</td>`;

  const tableHtml = `
    <table>
      <thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${r.map((c) => escCell(c)).join("")}</tr>`).join("")}</tbody>
    </table>`;

  const xls = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8" /></head>
    <body>${tableHtml}</body></html>`;

  const blob = new Blob(["\ufeff" + xls], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wedding-expenses-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
