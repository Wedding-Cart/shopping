import { createFileRoute } from "@tanstack/react-router";
import { WeddingExpensesPage } from "@/components/pages/wedding-expenses-page";

export const Route = createFileRoute("/wedding-expenses")({
  head: () => ({ meta: [{ title: "বিয়ের খরচ — Wedding Planner" }] }),
  component: WeddingExpensesPage,
});