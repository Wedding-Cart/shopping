import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  purpose: string;
  onSubmit: (pin: string) => boolean;
  onCancel: () => void;
}

export function PinDialog({ open, purpose, onSubmit, onCancel }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastOpen = useRef(open);

  useEffect(() => {
    if (open && !lastOpen.current) {
      setPin("");
      setError(null);
    }
    lastOpen.current = open;
  }, [open]);

  const handle = () => {
    if (pin.length !== 6) {
      setError("সব ৬টি সংখ্যা লিখুন");
      return;
    }
    const ok = onSubmit(pin);
    if (!ok) setError("ভুল পিন");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full gradient-gold">
            <ShieldCheck className="h-6 w-6 text-gold-foreground" />
          </div>
          <DialogTitle className="text-center">পিন লিখুন</DialogTitle>
          <DialogDescription className="text-center">{purpose}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <InputOTP
            maxLength={6}
            value={pin}
            onChange={(v) => {
              setPin(v);
              setError(null);
            }}
            autoFocus
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            বাতিল
          </Button>
          <Button onClick={handle} className="flex-1">
            নিশ্চিত করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
