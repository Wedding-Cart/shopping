import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "./login-screen";
import { AppShell } from "./app-shell";
import { ensureBootstrap } from "@/lib/firestore";
import { Loader2 } from "lucide-react";

export function AppGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      ensureBootstrap().catch(() => {});
    }
  }, [user]);

  if (!mounted || loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <AppShell>{children}</AppShell>;
}
