import { createFileRoute } from "@tanstack/react-router";
import { RecyclePage } from "@/components/pages/recycle-page";

export const Route = createFileRoute("/recycle")({
  head: () => ({ meta: [{ title: "Recycle Bin — Wedding Planner" }] }),
  component: RecyclePage,
});