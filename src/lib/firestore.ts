import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { getFirebase } from "./firebase";
import type {
  ActivityAction,
  ActivityLog,
  AppSettings,
  EventDoc,
  ExpenseCategoryDoc,
  ItemDoc,
  MemberDoc,
  RecycleDoc,
  WeddingExpenseDoc,
} from "./types";
import { useEffect, useState } from "react";

export const COL = {
  settings: "settings",
  events: "events",
  members: "family_members",
  items: "items",
  activity: "activity_logs",
  recycle: "recycle_bin",
  expenseCategories: "expense_categories",
  weddingExpenses: "wedding_expenses",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  totalBudget: 500000,
  adminPin: "123456",
  adminEmail: "rahul@work.com",
};

export const DEFAULT_EVENTS = ["বিয়ে", "বস্ত্রালঙ্কার", "গায়ে হলুদ", "কালার ফেস্টিভাল", "বউভাত"];

/** Ensure settings + default events exist (idempotent). */
export async function ensureBootstrap() {
  const { db } = getFirebase();
  if (!db) return;
  const sRef = doc(db, COL.settings, "app");
  const sSnap = await getDoc(sRef);
  if (!sSnap.exists()) {
    await setDoc(sRef, DEFAULT_SETTINGS);
  }
  const eSnap = await getDocs(collection(db, COL.events));
  if (eSnap.empty) {
    await Promise.all(
      DEFAULT_EVENTS.map((name) =>
        addDoc(collection(db, COL.events), {
          name,
          createdAt: serverTimestamp(),
        }),
      ),
    );
  }
}

/* ---------- settings ---------- */

export async function updateSettings(patch: Partial<AppSettings>) {
  const { db } = getFirebase();
  if (!db) return;
  await setDoc(doc(db, COL.settings, "app"), patch, { merge: true });
}

export function useSettings(): AppSettings | null {
  const [data, setData] = useState<AppSettings | null>(null);
  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    return onSnapshot(doc(db, COL.settings, "app"), (snap) => {
      setData((snap.data() as AppSettings) ?? null);
    });
  }, []);
  return data;
}

/* ---------- generic snapshot hook ---------- */

function useCol<T>(name: string, ...constraints: QueryConstraint[]): T[] {
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    const { db } = getFirebase();
    if (!db) return;
    const q = constraints.length
      ? query(collection(db, name), ...constraints)
      : collection(db, name);
    return onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return data;
}

export function useEvents() {
  return useCol<EventDoc>(COL.events, orderBy("createdAt", "asc"));
}
export function useMembers() {
  return useCol<MemberDoc>(COL.members, orderBy("createdAt", "asc"));
}
export function useItems() {
  return useCol<ItemDoc>(COL.items, orderBy("createdAt", "desc"));
}
export function useRecycle() {
  return useCol<RecycleDoc>(COL.recycle, orderBy("deletedAt", "desc"));
}
export function useActivity() {
  return useCol<ActivityLog>(COL.activity, orderBy("createdAt", "desc"), limit(500));
}

/* ---------- activity ---------- */

export async function logActivity(userName: string, action: ActivityAction, detail?: string) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COL.activity), {
    userName: userName || "Unknown",
    action,
    detail: detail ?? "",
    createdAt: serverTimestamp(),
  });
}

/* ---------- events ---------- */

export async function addEvent(name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COL.events), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
  await logActivity(userName, "Event Added", name);
}

export async function updateEvent(id: string, name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await updateDoc(doc(db, COL.events, id), { name: name.trim() });
  // Also update denormalized eventName on existing items
  const itemsSnap = await getDocs(query(collection(db, COL.items), where("eventId", "==", id)));
  await Promise.all(itemsSnap.docs.map((d) => updateDoc(d.ref, { eventName: name.trim() })));
  await logActivity(userName, "Event Edited", name);
}

export async function deleteEvent(id: string, name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const itemsSnap = await getDocs(
    query(collection(db, COL.items), where("eventId", "==", id), limit(1)),
  );
  if (!itemsSnap.empty) {
    throw new Error("Cannot delete: items exist under this event.");
  }
  await deleteDoc(doc(db, COL.events, id));
  await logActivity(userName, "Event Deleted", name);
}

/* ---------- members ---------- */

export async function addMember(name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COL.members), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
  await logActivity(userName, "Member Added", name);
}

export async function updateMember(id: string, name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await updateDoc(doc(db, COL.members, id), { name: name.trim() });
  const itemsSnap = await getDocs(query(collection(db, COL.items), where("memberId", "==", id)));
  await Promise.all(itemsSnap.docs.map((d) => updateDoc(d.ref, { memberName: name.trim() })));
  await logActivity(userName, "Member Edited", name);
}

export async function deleteMember(id: string, name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const itemsSnap = await getDocs(
    query(collection(db, COL.items), where("memberId", "==", id), limit(1)),
  );
  if (!itemsSnap.empty) {
    throw new Error("Cannot delete: items exist under this member.");
  }
  await deleteDoc(doc(db, COL.members, id));
  await logActivity(userName, "Member Deleted", name);
}

/* ---------- items ---------- */

export type ItemInput = Omit<
  ItemDoc,
  "id" | "createdAt" | "updatedAt" | "eventName" | "memberName"
> & { eventName?: string; memberName?: string };

export async function addItem(input: ItemInput, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const payload = {
    ...input,
    addedBy: input.addedBy || userName,
    notes: input.notes ?? "",
    actualPrice: input.actualPrice ?? 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COL.items), payload);
  await logActivity(userName, "Item Added", `${input.name} (${ref.id})`);
  return ref.id;
}

export async function updateItem(id: string, patch: Partial<ItemDoc>, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await updateDoc(doc(db, COL.items, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userName, "Item Edited", `${patch.name ?? id}`);
}

/** Soft delete: move to recycle bin. */
export async function softDeleteItem(item: ItemDoc, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const { id, ...rest } = item;
  await setDoc(doc(db, COL.recycle, id), {
    ...rest,
    deletedBy: userName,
    deletedAt: serverTimestamp(),
  });
  await deleteDoc(doc(db, COL.items, id));
  await logActivity(userName, "Item Deleted", item.name);
}

export async function restoreItem(item: RecycleDoc, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const { id, deletedBy: _db, deletedAt: _da, ...rest } = item;
  await setDoc(doc(db, COL.items, id), {
    ...rest,
    updatedAt: serverTimestamp(),
  });
  await deleteDoc(doc(db, COL.recycle, id));
  await logActivity(userName, "Item Restored", item.name);
}

export async function permanentlyDeleteItem(item: RecycleDoc, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, COL.recycle, item.id));
  await logActivity(userName, "Item Permanently Deleted", item.name);
}

/* ---------- wedding expenses ---------- */

export function useExpenseCategories() {
  return useCol<ExpenseCategoryDoc>(COL.expenseCategories, orderBy("createdAt", "asc"));
}

export function useWeddingExpenses() {
  return useCol<WeddingExpenseDoc>(COL.weddingExpenses, orderBy("createdAt", "desc"));
}

export async function addExpenseCategory(name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COL.expenseCategories), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  });
  await logActivity(userName, "Expense Category Added", name);
}

export async function deleteExpenseCategory(id: string, name: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  const used = await getDocs(
    query(collection(db, COL.weddingExpenses), where("categoryId", "==", id), limit(1)),
  );
  if (!used.empty) {
    throw new Error("Cannot delete: expenses exist under this category.");
  }
  await deleteDoc(doc(db, COL.expenseCategories, id));
  await logActivity(userName, "Expense Category Deleted", name);
}

export type WeddingExpenseInput = Omit<
  WeddingExpenseDoc,
  "id" | "createdAt" | "updatedAt" | "createdBy"
>;

export async function addWeddingExpense(input: WeddingExpenseInput, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await addDoc(collection(db, COL.weddingExpenses), {
    ...input,
    notes: input.notes ?? "",
    createdBy: userName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await logActivity(userName, "Expense Added", input.title);
}

export async function updateWeddingExpense(
  id: string,
  patch: Partial<WeddingExpenseDoc>,
  userName: string,
) {
  const { db } = getFirebase();
  if (!db) return;
  await updateDoc(doc(db, COL.weddingExpenses, id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
  await logActivity(userName, "Expense Edited", patch.title ?? id);
}

export async function deleteWeddingExpense(id: string, title: string, userName: string) {
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, COL.weddingExpenses, id));
  await logActivity(userName, "Expense Deleted", title);
}
