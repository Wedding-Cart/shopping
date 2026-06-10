import { useState } from "react";
import { useEvents, useItems, addEvent, updateEvent, deleteEvent } from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarHeart, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePin } from "@/lib/pin-context";
import { EmptyState } from "@/components/empty-state";
import type { EventDoc } from "@/lib/types";

export function EventsPage() {
  const { isAdmin, userName } = useAuth();
  const { requirePin } = usePin();
  const events = useEvents();
  const items = useItems();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventDoc | null>(null);
  const [name, setName] = useState("");

  if (!isAdmin) {
    return (
      <EmptyState
        icon={CalendarHeart}
        title="অ্যাডমিন অ্যাক্সেস প্রয়োজন"
        description="শুধু অ্যাডমিন অনুষ্ঠান পরিচালনা করতে পারবেন।"
      />
    );
  }

  const openAdd = () => {
    setEditing(null);
    setName("");
    setOpen(true);
  };
  const openEdit = (e: EventDoc) => {
    setEditing(e);
    setName(e.name);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("নাম প্রয়োজন");
    try {
      if (editing) await updateEvent(editing.id, name, userName);
      else await addEvent(name, userName);
      toast.success("সংরক্ষিত");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  };

  const handleDelete = async (e: EventDoc) => {
    const ok = await requirePin("অনুষ্ঠান মুছতে পিন লিখুন");
    if (!ok) return;
    try {
      await deleteEvent(e.id, e.name, userName);
      toast.success("অনুষ্ঠান মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">অনুষ্ঠান</h1>
          <p className="text-sm text-muted-foreground">{events.length} অনুষ্ঠান</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          অনুষ্ঠান যোগ
        </Button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarHeart}
          title="কোনো অনুষ্ঠান নেই"
          description="আইটেম ট্র্যাক শুরু করতে একটি অনুষ্ঠান যোগ করুন।"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const count = items.filter((i) => i.eventId === e.id).length;
            return (
              <div
                key={e.id}
                className="glass flex items-center justify-between rounded-2xl p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl gradient-emerald text-primary-foreground">
                    <CalendarHeart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="bn font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{count} আইটেম</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEdit(e)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "অনুষ্ঠান সম্পাদনা" : "অনুষ্ঠান যোগ"}</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            placeholder="অনুষ্ঠানের নাম"
            className="bn"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={handleSave}>সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
