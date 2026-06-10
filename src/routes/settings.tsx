import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/pages/settings-page";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Wedding Planner" }] }),
  component: SettingsPage,
});