import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/pages/dashboard-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ড্যাশবোর্ড — বিবাহ পরিকল্পনা" },
      {
        name: "description",
        content: "বিবাহের বাজেট সারসংক্ষেপ ও মোট হিসাব।",
      },
    ],
  }),
  component: Dashboard,
});
