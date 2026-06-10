import { useMemo } from "react";
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Clock,
  Package,
  CheckCircle2,
  CircleDashed,
  Users,
  CalendarHeart,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/stat-card";
import { useEvents, useItems, useMembers, useSettings } from "@/lib/firestore";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { Progress } from "@/components/ui/progress";

export function Dashboard() {
  const settings = useSettings();
  const items = useItems();
  const members = useMembers();
  const events = useEvents();
  const { userName, isAdmin } = useAuth();

  const stats = useMemo(() => {
    const total = settings?.totalBudget ?? 0;
    const purchased = items.filter((i) => i.status === "Purchased");
    const pending = items.filter((i) => i.status === "Pending");
    const spent = purchased.reduce((s, i) => s + (i.actualPrice || 0) * (i.quantity || 1), 0);
    const pendingCost = pending.reduce((s, i) => s + (i.expectedPrice || 0) * (i.quantity || 1), 0);
    const remaining = total - spent;
    return {
      total,
      spent,
      remaining,
      pendingCost,
      pct: total > 0 ? Math.min(100, (spent / total) * 100) : 0,
      purchasedCount: purchased.length,
      pendingCount: pending.length,
    };
  }, [settings, items]);

  const lowBudget = stats.total > 0 && stats.remaining / stats.total < 0.15;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">
            আবার স্বাগতম{userName ? `, ${userName}` : ""}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">বিবাহ ড্যাশবোর্ড</h1>
        </div>
        {isAdmin && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-medium text-gold">
            অ্যাডমিন অ্যাক্সেস
          </span>
        )}
      </motion.div>

      {lowBudget && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <p className="font-medium">বাজেট কমে আসছে</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(stats.total)} এর মধ্যে কেবল {formatCurrency(stats.remaining)} বাকি।
            </p>
          </div>
        </motion.div>
      )}

      <div className="glass rounded-3xl p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">মূল বাজেট</p>
            <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {formatCurrency(stats.total)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:gap-8">
            <div>
              <p className="text-muted-foreground">খরচ</p>
              <p className="font-semibold">{formatCurrency(stats.spent)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">বাকি</p>
              <p
                className={`font-semibold ${stats.remaining < 0 ? "text-destructive" : "text-success"}`}
              >
                {formatCurrency(stats.remaining)}
              </p>
            </div>
          </div>
        </div>
        <Progress value={stats.pct} className="mt-5 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          মোট বাজেটের {stats.pct.toFixed(1)}% খরচ হয়েছে
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="মোট বাজেট"
          value={formatCurrency(stats.total)}
          icon={Wallet}
          accent="primary"
          index={0}
        />
        <StatCard
          label="খরচ"
          value={formatCurrency(stats.spent)}
          icon={TrendingDown}
          accent="destructive"
          index={1}
        />
        <StatCard
          label="বাকি"
          value={formatCurrency(stats.remaining)}
          icon={PiggyBank}
          accent="success"
          index={2}
        />
        <StatCard
          label="বাকি খরচ"
          value={formatCurrency(stats.pendingCost)}
          icon={Clock}
          accent="warning"
          index={3}
        />
        <StatCard
          label="মোট আইটেম"
          value={formatNumber(items.length)}
          icon={Package}
          accent="primary"
          index={4}
        />
        <StatCard
          label="কেনা হয়েছে"
          value={formatNumber(stats.purchasedCount)}
          icon={CheckCircle2}
          accent="success"
          index={5}
        />
        <StatCard
          label="বাকি আইটেম"
          value={formatNumber(stats.pendingCount)}
          icon={CircleDashed}
          accent="warning"
          index={6}
        />
        <StatCard
          label="সদস্য"
          value={formatNumber(members.length)}
          icon={Users}
          accent="gold"
          index={7}
          hint={`${events.length} অনুষ্ঠান`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">অনুষ্ঠান অনুযায়ী</h3>
            <CalendarHeart className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {events.length === 0 && (
              <li className="text-sm text-muted-foreground">এখনও কোনো অনুষ্ঠান নেই।</li>
            )}
            {events.map((ev) => {
              const evItems = items.filter((i) => i.eventId === ev.id);
              const evSpent = evItems
                .filter((i) => i.status === "Purchased")
                .reduce((s, i) => s + (i.actualPrice || 0) * (i.quantity || 1), 0);
              return (
                <li key={ev.id} className="flex items-center justify-between text-sm">
                  <span className="bn">{ev.name}</span>
                  <span className="text-muted-foreground">
                    {evItems.length} আইটেম · {formatCurrency(evSpent)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-2xl p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">সদস্য অনুযায়ী</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {members.length === 0 && (
              <li className="text-sm text-muted-foreground">
                সদস্য ট্যাবে পরিবারের সদস্য যোগ করুন।
              </li>
            )}
            {members.map((m) => {
              const mItems = items.filter((i) => i.memberId === m.id);
              const mSpent = mItems
                .filter((i) => i.status === "Purchased")
                .reduce((s, i) => s + (i.actualPrice || 0) * (i.quantity || 1), 0);
              return (
                <li key={m.id} className="flex items-center justify-between text-sm">
                  <span className="bn">{m.name}</span>
                  <span className="text-muted-foreground">
                    {mItems.length} আইটেম · {formatCurrency(mSpent)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
