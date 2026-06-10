import { useRecycle, restoreItem, permanentlyDeleteItem } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePin } from "@/lib/pin-context";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { RecycleDoc } from "@/lib/types";

export function RecyclePage() {
  const { isAdmin, userName } = useAuth();
  const { requirePin } = usePin();
  const items = useRecycle();

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Trash2}
        title="অ্যাডমিন অ্যাক্সেস প্রয়োজন"
        description="শুধু অ্যাডমিন রিসাইকেল বিন দেখতে পারবেন।"
      />
    );
  }

  const handleRestore = async (item: RecycleDoc) => {
    try {
      await restoreItem(item, userName);
      toast.success("আইটেম পুনরুদ্ধার হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  };

  const handlePermanent = async (item: RecycleDoc) => {
    const ok = await requirePin("স্থায়ীভাবে মুছতে পিন লিখুন");
    if (!ok) return;
    try {
      await permanentlyDeleteItem(item, userName);
      toast.success("স্থায়ীভাবে মুছে ফেলা হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">রিসাইকেল বিন</h1>
        <p className="text-sm text-muted-foreground">{items.length} মুছে ফেলা আইটেম</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="রিসাইকেল বিন খালি"
          description="মুছে ফেলা আইটেম এখানে দেখা যাবে।"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-2xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="bn truncate font-semibold">{item.name}</h3>
                  <p className="bn text-xs text-muted-foreground">
                    {item.eventName} · {item.memberName}
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(item.expectedPrice)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                মুছেছেন <span className="font-medium text-foreground">{item.deletedBy}</span> ·{" "}
                {formatDateTime(item.deletedAt)}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(item)}
                  className="flex-1"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  পুনরুদ্ধার
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handlePermanent(item)}
                  className="flex-1"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  মুছুন
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
