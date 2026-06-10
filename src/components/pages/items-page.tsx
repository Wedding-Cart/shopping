import { useMemo, useState } from "react";
import { useEvents, useItems, useMembers, softDeleteItem, useSettings } from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Package, User, CalendarHeart, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportItemsPdf, type PdfFilter } from "@/lib/pdf-export";
import { motion } from "framer-motion";
import { ItemForm } from "@/components/item-form";
import { EmptyState } from "@/components/empty-state";
import { formatCurrency } from "@/lib/format";
import { usePin } from "@/lib/pin-context";
import { useAuth } from "@/lib/auth-context";
import type { ItemDoc } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ItemsPage() {
  const items = useItems();
  const events = useEvents();
  const members = useMembers();
  const settings = useSettings();
  const { requirePin } = usePin();
  const { userName } = useAuth();

  const [search, setSearch] = useState("");
  const [eventF, setEventF] = useState("all");
  const [memberF, setMemberF] = useState("all");
  const [statusF, setStatusF] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ItemDoc | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ItemDoc | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (eventF !== "all" && i.eventId !== eventF) return false;
      if (memberF !== "all" && i.memberId !== memberF) return false;
      if (statusF !== "all" && i.status !== statusF) return false;
      if (!q) return true;
      return (
        i.name.toLowerCase().includes(q) ||
        (i.memberName ?? "").toLowerCase().includes(q) ||
        (i.addedBy ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, eventF, memberF, statusF]);

  const handleEdit = async (item: ItemDoc) => {
    const ok = await requirePin("এই আইটেম সম্পাদনার জন্য পিন লিখুন");
    if (!ok) return;
    setEditing(item);
    setFormOpen(true);
  };

  const handleDeleteRequest = async (item: ItemDoc) => {
    const ok = await requirePin("এই আইটেম মুছতে পিন লিখুন");
    if (!ok) return;
    setConfirmDelete(item);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    try {
      await softDeleteItem(confirmDelete, userName);
      toast.success("রিসাইকেল বিনে সরানো হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "মুছতে ব্যর্থ");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = (f: PdfFilter) => {
    if (items.length === 0) {
      toast.error("রপ্তানি করার মতো কোনো আইটেম নেই");
      return;
    }
    exportItemsPdf(items, f, settings?.totalBudget ?? 0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">আইটেম</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} এর মধ্যে {filtered.length} আইটেম
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                PDF এক্সপোর্ট
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>রিপোর্ট বাছাই</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("all")}>
                সম্পূর্ণ তালিকা
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("Pending")}>শুধু বাকি</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("Purchased")}>
                শুধু কেনা হয়েছে
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            আইটেম যোগ
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-3 shadow-soft sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="আইটেম, সদস্য বা যোগকারী দিয়ে খুঁজুন"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={eventF} onValueChange={setEventF}>
            <SelectTrigger>
              <SelectValue placeholder="অনুষ্ঠান" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব অনুষ্ঠান</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id} className="bn">
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={memberF} onValueChange={setMemberF}>
            <SelectTrigger>
              <SelectValue placeholder="সদস্য" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব সদস্য</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id} className="bn">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger>
              <SelectValue placeholder="অবস্থা" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব অবস্থা</SelectItem>
              <SelectItem value="Pending">বাকি</SelectItem>
              <SelectItem value="Purchased">কেনা হয়েছে</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="এখনও কোনো আইটেম নেই"
          description="আইটেম যোগ করতে 'আইটেম যোগ' বা ভাসমান + বাটন ব্যবহার করুন।"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
              className="glass group rounded-2xl p-4 shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="bn truncate text-base font-semibold">{item.name}</h3>
                  <p className="bn mt-0.5 text-xs text-muted-foreground">
                    <CalendarHeart className="mr-1 inline h-3 w-3" />
                    {item.eventName} · <User className="mr-1 inline h-3 w-3" />
                    {item.memberName}
                  </p>
                </div>
                <Badge
                  variant={item.status === "Purchased" ? "default" : "secondary"}
                  className={
                    item.status === "Purchased"
                      ? "bg-success/20 text-success hover:bg-success/20"
                      : "bg-warning/20 text-warning hover:bg-warning/20"
                  }
                >
                  {item.status === "Purchased" ? "কেনা হয়েছে" : "বাকি"}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">পরিমাণ</p>
                  <p className="font-medium">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">প্রত্যাশিত</p>
                  <p className="font-medium">{formatCurrency(item.expectedPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">প্রকৃত</p>
                  <p className="font-medium">
                    {item.actualPrice ? formatCurrency(item.actualPrice) : "—"}
                  </p>
                </div>
              </div>

              {item.notes && (
                <p className="bn mt-2 line-clamp-2 text-xs text-muted-foreground">{item.notes}</p>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                <span className="text-muted-foreground">
                  যোগ করেছেন{" "}
                  <span className="font-medium text-foreground">{item.addedBy || "—"}</span>
                </span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                    aria-label="সম্পাদনা"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRequest(item)}
                    aria-label="মুছুন"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ItemForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>রিসাইকেল বিনে সরাবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="bn">{confirmDelete?.name}</span> রিসাইকেল বিনে সরানো হবে। পরে
              পুনরুদ্ধার করতে পারবেন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
