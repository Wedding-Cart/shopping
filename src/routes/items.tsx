import { createFileRoute } from "@tanstack/react-router";
import { ItemsPage } from "@/components/pages/items-page";

export const Route = createFileRoute("/items")({
  head: () => ({ meta: [{ title: "Items — Wedding Planner" }] }),
  component: ItemsPage,
});