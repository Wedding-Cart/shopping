export function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) n = 0;
  return new Intl.NumberFormat("bn-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) n = 0;
  return new Intl.NumberFormat("bn-IN").format(n);
}

export function formatDateTime(ts: { toDate?: () => Date } | null | undefined) {
  if (!ts?.toDate) return "—";
  const d = ts.toDate();
  return new Intl.DateTimeFormat("bn-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}