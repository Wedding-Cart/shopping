import { createFileRoute } from "@tanstack/react-router";
import { MembersPage } from "@/components/pages/members-page";

export const Route = createFileRoute("/members")({
  head: () => ({ meta: [{ title: "Members — Wedding Planner" }] }),
  component: MembersPage,
});
