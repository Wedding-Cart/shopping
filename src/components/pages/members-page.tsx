import { useState } from "react";
import { useMembers, useItems, addMember, updateMember, deleteMember } from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePin } from "@/lib/pin-context";
import { EmptyState } from "@/components/empty-state";
import type { MemberDoc } from "@/lib/types";

export function MembersPage() {
  const { isAdmin, userName } = useAuth();
  const { requirePin } = usePin();
  const members = useMembers();
  const items = useItems();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MemberDoc | null>(null);
  const [name, setName] = useState("");

  if (!isAdmin) {
    return (
      <EmptyState
        icon={Users}
        title="অ্যাডমিন অ্যাক্সেস প্রয়োজন"
        description="শুধু অ্যাডমিন পরিবারের সদস্য পরিচালনা করতে পারবেন।"
      />
    );
  }

  const openAdd = () => {
    setEditing(null);
    setName("");
    setOpen(true);
  };
  const openEdit = (m: MemberDoc) => {
    setEditing(m);
    setName(m.name);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("নাম প্রয়োজন");
    try {
      if (editing) await updateMember(editing.id, name, userName);
      else await addMember(name, userName);
      toast.success("সংরক্ষিত");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ব্যর্থ");
    }
  };

  const handleDelete = async (m: MemberDoc) => {
    const ok = await requirePin("সদস্য মুছতে পিন লিখুন");
    if (!ok) return;
    try {
      await deleteMember(m.id, m.name, userName);
      toast.success("সদস্য মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">পরিবারের সদস্য</h1>
          <p className="text-sm text-muted-foreground">{members.length} জন সদস্য</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          সদস্য যোগ
        </Button>
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="এখনও কোনো সদস্য নেই"
          description="যাদের আইটেম ট্র্যাক করবেন, তাদের যোগ করুন।"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const count = items.filter((i) => i.memberId === m.id).length;
            return (
              <div
                key={m.id}
                className="glass flex items-center justify-between rounded-2xl p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full gradient-gold text-gold-foreground font-semibold">
                    {m.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="bn font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{count} আইটেম</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEdit(m)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(m)}
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
            <DialogTitle>{editing ? "সদস্য সম্পাদনা" : "সদস্য যোগ"}</DialogTitle>
          </DialogHeader>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="সদস্যের নাম"
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
