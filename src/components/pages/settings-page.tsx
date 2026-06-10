import { useEffect, useState } from "react";
import { useSettings, updateSettings, logActivity } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { usePin } from "@/lib/pin-context";
import { EmptyState } from "@/components/empty-state";
import { Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export function SettingsPage() {
  const { isAdmin, userName } = useAuth();
  const { requirePin } = usePin();
  const settings = useSettings();
  const [budget, setBudget] = useState("");
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (settings) {
      setBudget(String(settings.totalBudget ?? 0));
      setPin(settings.adminPin ?? "");
    }
  }, [settings]);

  if (!isAdmin) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="অ্যাডমিন অ্যাক্সেস প্রয়োজন"
        description="শুধু অ্যাডমিন সেটিংস পরিবর্তন করতে পারবেন।"
      />
    );
  }

  const saveBudget = async () => {
    const n = Number(budget);
    if (!Number.isFinite(n) || n < 0) return toast.error("ভুল পরিমাণ");
    await updateSettings({ totalBudget: n });
    await logActivity(userName, "Budget Changed", `New: ${n}`);
    toast.success("বাজেট আপডেট হয়েছে");
  };

  const savePin = async () => {
    if (!/^\d{6}$/.test(pin)) return toast.error("পিন অবশ্যই ৬ সংখ্যার হতে হবে");
    const ok = await requirePin("পরিবর্তন নিশ্চিত করতে বর্তমান পিন লিখুন");
    if (!ok) return;
    await updateSettings({ adminPin: pin });
    await logActivity(userName, "PIN Changed");
    toast.success("পিন আপডেট হয়েছে");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">সেটিংস</h1>
        <p className="text-sm text-muted-foreground">
          মূল বাজেট ও অ্যাডমিন পিন
        </p>
      </div>

      <div className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold">মূল বাজেট</h2>
        <p className="text-sm text-muted-foreground">
          ড্যাশবোর্ডে প্রদর্শিত মোট বিবাহ বাজেট।
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="b">মোট বাজেট (₹)</Label>
            <Input
              id="b"
              type="number"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <Button onClick={saveBudget} className="sm:self-end">
            বাজেট সংরক্ষণ
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold">অ্যাডমিন পিন</h2>
        <p className="text-sm text-muted-foreground">
          সম্পাদনা ও মুছে ফেলার জন্য ৬ সংখ্যার পিন প্রয়োজন। ডিফল্ট 123456।
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="p">নতুন পিন (৬ সংখ্যা)</Label>
            <Input
              id="p"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button onClick={savePin} className="sm:self-end">
            পিন আপডেট
          </Button>
        </div>
      </div>
    </div>
  );
}