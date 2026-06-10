import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useSettings } from "./firestore";
import { PinDialog } from "../components/pin-dialog";

interface PinContextValue {
  requirePin: (purpose?: string) => Promise<boolean>;
}

const PinCtx = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("Confirm action");
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const requirePin = useCallback(
    (p?: string) =>
      new Promise<boolean>((resolve) => {
        setPurpose(p || "Confirm action");
        resolverRef.current = resolve;
        setOpen(true);
      }),
    [],
  );

  const handleSubmit = (pin: string) => {
    const expected = settings?.adminPin ?? "123456";
    const ok = pin === expected;
    resolverRef.current?.(ok);
    resolverRef.current = null;
    setOpen(false);
    return ok;
  };

  const handleCancel = () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setOpen(false);
  };

  return (
    <PinCtx.Provider value={{ requirePin }}>
      {children}
      <PinDialog open={open} purpose={purpose} onSubmit={handleSubmit} onCancel={handleCancel} />
    </PinCtx.Provider>
  );
}

export function usePin() {
  const c = useContext(PinCtx);
  if (!c) throw new Error("usePin must be inside PinProvider");
  return c;
}
