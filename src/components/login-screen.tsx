import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Heart, Loader2 } from "lucide-react";

export function LoginScreen() {
  const { signIn, userName } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(userName);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("অনুগ্রহ করে আপনার নাম লিখুন");
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password, name);
      toast.success(`স্বাগতম, ${name.trim()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সাইন ইন ব্যর্থ";
      toast.error(msg.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass shadow-soft rounded-3xl p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-gold shadow-soft">
              <Heart className="h-7 w-7 text-gold-foreground" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              বিবাহ পরিকল্পনা
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              উৎসব পরিকল্পনা চালিয়ে যেতে সাইন ইন করুন
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">আপনার নাম</Label>
              <Input
                id="name"
                placeholder="Rahul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "সাইন ইন"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            অ্যাডমিন অ্যাক্সেস প্রদান করা হয়েছে{" "}
            <span className="text-gold font-medium">rahul@work.com</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}