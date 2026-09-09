import { createFileRoute } from "@tanstack/react-router";
import { InsightsPage } from "@/components/pages";

export const Route = createFileRoute("/insights")({ component: InsightsPage });
