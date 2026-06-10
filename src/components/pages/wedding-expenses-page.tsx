import { useMemo, useState } from "react";
import {
  useExpenseCategories,
  useWeddingExpenses,
  addExpenseCategory,
  deleteExpenseCategory,
  addWeddingExpense,
  updateWeddingExpense,
  deleteWeddingExpense,
} from "@/lib/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  Plus,
  Edit,
  Trash2,
  Search,
  FileDown,
  FolderPlus,
  Tag,
  CalendarDays,
  ReceiptText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { usePin } from "@/lib/pin-context";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { exportExpensesPdf, exportExpensesExcel } from "@/lib/expense-export";
import type { WeddingExpenseDoc } from "@/lib/types";

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function WeddingExpensesPage() {
  const { isAdmin, userName } = useAuth();
  const { requirePin } = usePin();
  const categories = useExpenseCategories();
  const expenses = useWeddingExpenses();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WeddingExpenseDoc | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [notes, setNotes] = useState("");

  const [catMgrOpen, setCatMgrOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<WeddingExpenseDoc | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (catFilter !== "all" && e.categoryId !== catFilter) return false;
      if (fromDate && e.expenseDate < fromDate) return false;
      if (toDate && e.expenseDate > toDate) return false;
      if (!q) return true;
      return e.title.toLowerCase().includes(q);
    });
  }, [expenses, search, catFilter, fromDate, toDate]);

  const totals = useMemo(() => {
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const filteredTotal = filtered.reduce((s, e) => s + (e.amount || 0), 0);
    const latest = expenses[0];
    return { total, filteredTotal, latest };
  }, [expenses, filtered]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    for (const e of expenses) {
      const cur = map.get(e.categoryId) ?? {
        name: e.categoryName,
        total: 0,
        count: 0,
      };
      cur.total += e.amount || 0;
      cur.count += 1;
      map.set(e.categoryId, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [expenses]);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setCategoryId(categories[0]?.id ?? "");
    setAmount("");
    setExpenseDate(todayIso());
    setNotes("");
  };

  const openAdd = async () => {
    if (!isAdmin) return;
    const ok = await requirePin("খরচ যোগ করতে পিন লিখুন");
    if (!ok) return;
    if (categories.length === 0) {
      toast.error("প্রথমে একটি ক্যাটাগরি যোগ করুন");
      return;
    }
    resetForm();
    setCategoryId(categories[0]?.id ?? "");
    setFormOpen(true);
  };

  const openEdit = async (e: WeddingExpenseDoc) => {
    if (!isAdmin) return;
    const ok = await requirePin("খরচ সম্পাদনায় পিন লিখুন");
    if (!ok) return;
    setEditing(e);
    setTitle(e.title);
    setCategoryId(e.categoryId);
    setAmount(String(e.amount));
    setExpenseDate(e.expenseDate);
    setNotes(e.notes ?? "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("শিরোনাম প্রয়োজন");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 0) return toast.error("সঠিক পরিমাণ দিন");
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return toast.error("ক্যাটাগরি নির্বাচন করুন");
    if (!expenseDate) return toast.error("তারিখ প্রয়োজন");
    try {
      const payload = {
        title: title.trim(),
        categoryId: cat.id,
        categoryName: cat.name,
        amount: amt,
        notes: notes.trim(),
        expenseDate,
      };
      if (editing) {
        await updateWeddingExpense(editing.id, payload, userName);
        toast.success("খরচ আপডেট হয়েছে");
      } else {
        await addWeddingExpense(payload, userName);
        toast.success("খরচ যোগ হয়েছে");
      }
      setFormOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    }
  };

  const handleDeleteRequest = async (e: WeddingExpenseDoc) => {
    if (!isAdmin) return;
    const ok = await requirePin("খরচ মুছতে পিন লিখুন");
    if (!ok) return;
    setConfirmDelete(e);
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;
    try {
      await deleteWeddingExpense(confirmDelete.id, confirmDelete.title, userName);
      toast.success("মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    } finally {
      setConfirmDelete(null);
    }
  };

  const openCatMgr = async () => {
    if (!isAdmin) return;
    const ok = await requirePin("ক্যাটাগরি পরিচালনায় পিন লিখুন");
    if (!ok) return;
    setNewCatName("");
    setCatMgrOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return toast.error("নাম দিন");
    try {
      await addExpenseCategory(newCatName, userName);
      setNewCatName("");
      toast.success("ক্যাটাগরি যোগ হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteExpenseCategory(id, name, userName);
      toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ব্যর্থ");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">বিয়ের খরচ</h1>
          <p className="text-sm text-muted-foreground">
            মোট {formatNumber(expenses.length)} এন্ট্রি · {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                এক্সপোর্ট
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>রিপোর্ট</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (filtered.length === 0) return toast.error("কোনো ডেটা নেই");
                  exportExpensesPdf(filtered);
                }}
              >
                PDF এক্সপোর্ট
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (filtered.length === 0) return toast.error("কোনো ডেটা নেই");
                  exportExpensesExcel(filtered);
                }}
              >
                Excel এক্সপোর্ট
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isAdmin && (
            <>
              <Button variant="outline" onClick={openCatMgr}>
                <FolderPlus className="mr-2 h-4 w-4" />
                ক্যাটাগরি
              </Button>
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                খরচ যোগ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Wallet} label="মোট খরচ" value={formatCurrency(totals.total)} />
        <StatCard icon={Tag} label="ক্যাটাগরি" value={formatNumber(categories.length)} />
        <StatCard icon={ReceiptText} label="মোট এন্ট্রি" value={formatNumber(expenses.length)} />
        <StatCard
          icon={CalendarDays}
          label="সর্বশেষ খরচ"
          value={totals.latest ? formatCurrency(totals.latest.amount) : "—"}
          hint={totals.latest?.title}
        />
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-3 shadow-soft sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="শিরোনাম দিয়ে খুঁজুন"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger>
              <SelectValue placeholder="ক্যাটাগরি" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="bn">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            aria-label="শুরুর তারিখ"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="শেষ তারিখ"
          />
        </div>
        {(catFilter !== "all" || fromDate || toDate || search) && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              ফিল্টার করা: {formatNumber(filtered.length)} এন্ট্রি ·{" "}
              <b className="text-foreground">{formatCurrency(totals.filteredTotal)}</b>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCatFilter("all");
                setFromDate("");
                setToDate("");
              }}
            >
              রিসেট
            </Button>
          </div>
        )}
      </div>

      {/* Category summary */}
      {categoryTotals.length > 0 && (
        <div className="glass rounded-2xl p-4 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            ক্যাটাগরি অনুযায়ী সারাংশ
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTotals.map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-3 py-2"
              >
                <div>
                  <p className="bn text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(c.count)} এন্ট্রি</p>
                </div>
                <span className="font-semibold">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="কোনো খরচ নেই"
          description={
            isAdmin
              ? "নতুন খরচ যোগ করতে 'খরচ যোগ' বাটন ব্যবহার করুন।"
              : "এখনো কোনো খরচ যোগ করা হয়নি।"
          }
        />
      ) : (
        <div className="glass overflow-hidden rounded-2xl shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">শিরোনাম</th>
                  <th className="px-3 py-2 text-left font-medium">ক্যাটাগরি</th>
                  <th className="px-3 py-2 text-right font-medium">পরিমাণ</th>
                  <th className="px-3 py-2 text-left font-medium">তারিখ</th>
                  <th className="px-3 py-2 text-left font-medium">নোট</th>
                  <th className="px-3 py-2 text-left font-medium">যোগকারী</th>
                  {isAdmin && <th className="px-3 py-2 text-right font-medium">ক্রিয়া</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="bn px-3 py-2 font-medium">{e.title}</td>
                    <td className="bn px-3 py-2 text-muted-foreground">{e.categoryName}</td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{e.expenseDate}</td>
                    <td className="bn max-w-[220px] truncate px-3 py-2 text-muted-foreground">
                      {e.notes || "—"}
                    </td>
                    <td className="bn px-3 py-2 text-muted-foreground">{e.createdBy}</td>
                    {isAdmin && (
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(e)}
                            aria-label="সম্পাদনা"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteRequest(e)}
                            aria-label="মুছুন"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Expense */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "খরচ সম্পাদনা" : "নতুন খরচ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>শিরোনাম</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: ক্যাটারিং অগ্রিম"
                className="bn"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ক্যাটাগরি</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="ক্যাটাগরি নির্বাচন" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="bn">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>পরিমাণ (₹)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label>তারিখ</Label>
                <Input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>নোট</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ঐচ্ছিক বিবরণ"
                className="bn"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={handleSave}>সংরক্ষণ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Manager */}
      <Dialog open={catMgrOpen} onOpenChange={setCatMgrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ক্যাটাগরি পরিচালনা</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="নতুন ক্যাটাগরি"
                className="bn"
              />
              <Button onClick={handleAddCategory}>যোগ</Button>
            </div>
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">কোনো ক্যাটাগরি নেই</p>
              ) : (
                categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="bn text-sm">{c.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCatMgrOpen(false)}>বন্ধ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>খরচ মুছবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="bn">{confirmDelete?.title}</span> স্থায়ীভাবে মুছে যাবে।
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
