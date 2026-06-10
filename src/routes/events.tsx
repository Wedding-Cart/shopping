import { createFileRoute } from "@tanstack/react-router";
import { EventsPage } from "@/components/pages/events-page";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [{ title: "Events — Wedding Planner" }] }),
  component: EventsPage,
});
