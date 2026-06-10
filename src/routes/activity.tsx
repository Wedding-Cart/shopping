import { createFileRoute } from "@tanstack/react-router";
import { ActivityPage } from "@/components/pages/activity-page";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity — Wedding Planner" }] }),
  component: ActivityPage,
});
