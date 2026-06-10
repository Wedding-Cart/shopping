import type { Timestamp } from "firebase/firestore";

export type ItemStatus = "Pending" | "Purchased";

export interface AppSettings {
  totalBudget: number;
  adminPin: string; // 6 digits
  adminEmail: string;
}

export interface EventDoc {
  id: string;
  name: string;
  createdAt?: Timestamp | null;
}

export interface MemberDoc {
  id: string;
  name: string;
  createdAt?: Timestamp | null;
}

export interface ItemDoc {
  id: string;
  name: string;
  eventId: string;
  eventName: string;
  memberId: string;
  memberName: string;
  quantity: number;
  expectedPrice: number;
  actualPrice: number;
  notes?: string;
  status: ItemStatus;
  addedBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface RecycleDoc extends ItemDoc {
  deletedBy: string;
  deletedAt?: Timestamp | null;
}

export type ActivityAction =
  | "Item Added"
  | "Item Edited"
  | "Item Deleted"
  | "Item Restored"
  | "Item Permanently Deleted"
  | "Budget Changed"
  | "PIN Changed"
  | "Event Added"
  | "Event Edited"
  | "Event Deleted"
  | "Member Added"
  | "Member Edited"
  | "Member Deleted"
  | "Expense Added"
  | "Expense Edited"
  | "Expense Deleted"
  | "Expense Category Added"
  | "Expense Category Deleted";

export interface ActivityLog {
  id: string;
  userName: string;
  action: ActivityAction;
  detail?: string;
  createdAt?: Timestamp | null;
}

export interface ExpenseCategoryDoc {
  id: string;
  name: string;
  createdAt?: Timestamp | null;
}

export interface WeddingExpenseDoc {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  notes?: string;
  expenseDate: string; // ISO yyyy-mm-dd
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}