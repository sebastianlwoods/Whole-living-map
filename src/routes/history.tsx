import { createFileRoute } from "@tanstack/react-router";
import { HistoryPage } from "@/components/pages";

export const Route = createFileRoute("/history")({ component: HistoryPage });
