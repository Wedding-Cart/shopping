import type { ItemDoc } from "./types";
import { formatCurrency, formatNumber } from "./format";

export type PdfFilter = "all" | "Pending" | "Purchased";

const TITLES: Record<PdfFilter, string> = {
  all: "সম্পূর্ণ তালিকা",
  Pending: "বাকি আইটেম",
  Purchased: "কেনা হয়েছে",
};

function esc(s: string | number | undefined | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportItemsPdf(
  items: ItemDoc[],
  filter: PdfFilter,
  totalBudget: number,
) {
  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

  // Group by event
  const groups = new Map<string, ItemDoc[]>();
  for (const i of filtered) {
    const k = i.eventName || "—";
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(i);
  }

  const totalExpected = filtered.reduce(
    (s, i) => s + (i.expectedPrice || 0) * (i.quantity || 1),
    0,
  );
  const totalActual = filtered.reduce(
    (s, i) => s + (i.actualPrice || 0) * (i.quantity || 1),
    0,
  );

  const now = new Intl.DateTimeFormat("bn-IN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const groupsHtml = Array.from(groups.entries())
    .map(([eventName, list]) => {
      const sub = list.reduce(
        (s, i) =>
          s +
          (i.status === "Purchased"
            ? (i.actualPrice || i.expectedPrice || 0)
            : i.expectedPrice || 0) *
            (i.quantity || 1),
        0,
      );
      const rows = list
        .map(
          (i, idx) => `
        <tr>
          <td>${formatNumber(idx + 1)}</td>
          <td class="bn">${esc(i.name)}</td>
          <td class="bn">${esc(i.memberName)}</td>
          <td class="num">${formatNumber(i.quantity || 0)}</td>
          <td class="num">${formatCurrency(i.expectedPrice || 0)}</td>
          <td class="num">${i.actualPrice ? formatCurrency(i.actualPrice) : "—"}</td>
          <td><span class="badge ${
            i.status === "Purchased" ? "ok" : "warn"
          }">${i.status === "Purchased" ? "কেনা হয়েছে" : "বাকি"}</span></td>
          <td class="bn">${esc(i.addedBy)}</td>
        </tr>`,
        )
        .join("");
      return `
        <section class="group">
          <div class="group-head">
            <h2 class="bn">${esc(eventName)}</h2>
            <span class="muted">${formatNumber(list.length)} আইটেম · ${formatCurrency(sub)}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th><th>আইটেম</th><th>সদস্য</th><th>পরিমাণ</th>
                <th>প্রত্যাশিত</th><th>প্রকৃত</th><th>অবস্থা</th><th>যোগকারী</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<title>${TITLES[filter]} — বিবাহ পরিকল্পনা</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans Bengali', system-ui, sans-serif;
    color: #0b3d2e; background: #fff; padding: 24px;
  }
  .bn { font-family: 'Noto Sans Bengali', sans-serif; }
  header {
    border-bottom: 2px solid #0d7a5f; padding-bottom: 12px; margin-bottom: 16px;
    display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;
  }
  header h1 {
    font-family: 'Cormorant Garamond', serif;
    margin: 0; font-size: 28px; color: #064e3b;
  }
  header .sub { color: #555; font-size: 12px; margin-top: 4px; }
  .gold { color: #c9a84c; }
  .summary {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    margin-bottom: 18px;
  }
  .summary .card {
    border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px;
    background: #f8faf9;
  }
  .summary .label { font-size: 11px; color: #666; }
  .summary .value { font-size: 16px; font-weight: 600; color: #064e3b; margin-top: 2px; }
  .group { margin-bottom: 18px; page-break-inside: avoid; }
  .group-head {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 6px;
  }
  .group-head h2 {
    margin: 0; font-size: 16px; color: #064e3b;
    border-left: 3px solid #c9a84c; padding-left: 8px;
  }
  .muted { color: #666; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td {
    border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left;
    vertical-align: top;
  }
  thead th { background: #ecfdf5; color: #064e3b; font-weight: 600; }
  td.num { text-align: right; white-space: nowrap; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
  }
  .badge.ok { background: #d1fae5; color: #065f46; }
  .badge.warn { background: #fef3c7; color: #92400e; }
  footer {
    margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb;
    font-size: 11px; color: #666; text-align: center;
  }
  @media print {
    body { padding: 12mm; }
    .no-print { display: none !important; }
    @page { size: A4; margin: 10mm; }
  }
  .toolbar {
    position: fixed; top: 12px; right: 12px; display: flex; gap: 8px;
  }
  .toolbar button {
    background: #064e3b; color: #fff; border: 0; padding: 8px 14px;
    border-radius: 6px; cursor: pointer; font-family: inherit;
  }
  .toolbar button.secondary { background: #c9a84c; color: #1a1a1a; }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()">প্রিন্ট / PDF</button>
    <button class="secondary" onclick="window.close()">বন্ধ</button>
  </div>
  <header>
    <div>
      <h1>বিবাহ পরিকল্পনা <span class="gold">·</span> ${TITLES[filter]}</h1>
      <div class="sub">${now}</div>
    </div>
    <div class="sub">মোট রেকর্ড: <b>${formatNumber(filtered.length)}</b></div>
  </header>

  <div class="summary">
    <div class="card"><div class="label">মোট বাজেট</div><div class="value">${formatCurrency(totalBudget)}</div></div>
    <div class="card"><div class="label">প্রত্যাশিত খরচ</div><div class="value">${formatCurrency(totalExpected)}</div></div>
    <div class="card"><div class="label">প্রকৃত খরচ</div><div class="value">${formatCurrency(totalActual)}</div></div>
    <div class="card"><div class="label">আইটেম সংখ্যা</div><div class="value">${formatNumber(filtered.length)}</div></div>
  </div>

  ${groupsHtml || '<p class="muted">কোনো আইটেম নেই।</p>'}

  <footer>বিবাহ পরিকল্পনা ও বাজেট ব্যবস্থাপনা · স্বয়ংক্রিয়ভাবে তৈরি</footer>
  <script>
    window.addEventListener('load', () => {
      // Give fonts a moment, then auto-open print dialog
      setTimeout(() => { try { window.print(); } catch(e){} }, 600);
    });
  </script>
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