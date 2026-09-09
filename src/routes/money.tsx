import { createFileRoute } from "@tanstack/react-router";
import { MoneyPage } from "@/components/pages";

export const Route = createFileRoute("/money")({ component: MoneyPage });
