import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  accent?: "primary" | "gold" | "success" | "warning" | "destructive";
  hint?: ReactNode;
  index?: number;
}

const accentMap = {
  primary: "bg-primary/15 text-primary",
  gold: "bg-gold/20 text-gold",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  hint,
  index = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="glass rounded-2xl p-5 shadow-soft"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}