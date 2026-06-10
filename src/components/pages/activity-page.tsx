import { useActivity } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/empty-state";
import { Activity } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function ActivityPage() {
  const { isAdmin } = useAuth();
  const logs = useActivity();

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Activity}
        title="অ্যাডমিন অ্যাক্সেস প্রয়োজন"
        description="শুধু অ্যাডমিন কার্যকলাপ লগ দেখতে পারবেন।"
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">কার্যকলাপ লগ</h1>
        <p className="text-sm text-muted-foreground">সর্বশেষ {logs.length} কার্যকলাপ</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="এখনও কোনো কার্যকলাপ নেই"
          description="অ্যাপের সব কার্যকলাপ এখানে দেখা যাবে।"
        />
      ) : (
        <div className="glass divide-y divide-border/60 rounded-2xl shadow-soft">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-emerald text-xs font-semibold text-primary-foreground">
                {(log.userName || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{log.userName}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {log.action}
                  </Badge>
                </div>
                {log.detail && (
                  <p className="bn mt-0.5 truncate text-sm text-muted-foreground">{log.detail}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
