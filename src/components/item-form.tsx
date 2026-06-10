import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvents, useMembers, addItem, updateItem } from "@/lib/firestore";
import { useAuth } from "@/lib/auth-context";
import type { ItemDoc, ItemStatus } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ItemDoc | null;
  quickMode?: boolean;
}

export function ItemForm({ open, onOpenChange, initial, quickMode }: Props) {
  const events = useEvents();
  const members = useMembers();
  const { userName } = useAuth();

  const [name, setName] = useState("");
  const [eventId, setEventId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [quantity, setQuantity] = useState<string>("1");
  const [expected, setExpected] = useState<string>("");
  const [actual, setActual] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<ItemStatus>("Pending");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setEventId(initial.eventId);
      setMemberId(initial.memberId);
      setQuantity(String(initial.quantity));
      setExpected(String(initial.expectedPrice));
      setActual(String(initial.actualPrice ?? ""));
      setNotes(initial.notes ?? "");
      setStatus(initial.status);
    } else {
      setName("");
      setEventId("");
      setMemberId("");
      setQuantity("1");
      setExpected("");
      setActual("");
      setNotes("");
      setStatus("Pending");
    }
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("আইটেমের নাম প্রয়োজন");
    if (!eventId) return toast.error("একটি অনুষ্ঠান নির্বাচন করুন");
    if (!memberId) return toast.error("একজন পরিবার সদস্য নির্বাচন করুন");
    const exp = Number(expected) || 0;
    const act = Number(actual) || 0;
    const qty = Math.max(1, Number(quantity) || 1);
    if (status === "Purchased" && act <= 0) {
      return toast.error("কেনা হলে প্রকৃত মূল্য প্রয়োজন");
    }
    const evt = events.find((e) => e.id === eventId);
    const mem = members.find((m) => m.id === memberId);
    setBusy(true);
    try {
      if (initial) {
        await updateItem(
          initial.id,
          {
            name: name.trim(),
            eventId,
            eventName: evt?.name ?? "",
            memberId,
            memberName: mem?.name ?? "",
            quantity: qty,
            expectedPrice: exp,
            actualPrice: act,
            notes: notes.trim(),
            status,
          },
          userName,
        );
        toast.success("আইটেম আপডেট হয়েছে");
      } else {
        await addItem(
          {
            name: name.trim(),
            eventId,
            eventName: evt?.name ?? "",
            memberId,
            memberName: mem?.name ?? "",
            quantity: qty,
            expectedPrice: exp,
            actualPrice: act,
            notes: notes.trim(),
            status,
            addedBy: userName,
          },
          userName,
        );
        toast.success("আইটেম যোগ হয়েছে");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "সংরক্ষণ ব্যর্থ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "আইটেম সম্পাদনা" : quickMode ? "দ্রুত যোগ" : "আইটেম যোগ"}
          </DialogTitle>
          <DialogDescription>
            {quickMode
              ? "দ্রুত এন্ট্রি — বাকিটা পরে পূরণ করতে পারবেন।"
              : "বিবাহের বাজেটের প্রতিটি আইটেম ট্র্যাক করুন।"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>আইটেমের নাম</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. শাড়ি / Sherwani"
              className="bn"
            />
          </div>

          <div className="space-y-1.5">
            <Label>পরিবারের সদস্য</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="সদস্য নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="bn">
                    {m.name}
                  </SelectItem>
                ))}
                {members.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    প্রথমে সদস্য যোগ করুন
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>অনুষ্ঠান</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger>
                <SelectValue placeholder="অনুষ্ঠান নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="bn">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>পরিমাণ</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>প্রত্যাশিত মূল্য (₹)</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              placeholder="0"
            />
          </div>

          {!quickMode && (
            <>
              <div className="space-y-1.5">
                <Label>প্রকৃত মূল্য (₹)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>অবস্থা</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ItemStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">বাকি</SelectItem>
                    <SelectItem value="Purchased">কেনা হয়েছে</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>নোট</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ঐচ্ছিক নোট"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "সংরক্ষণ হচ্ছে..." : initial ? "পরিবর্তন সংরক্ষণ" : "আইটেম যোগ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}