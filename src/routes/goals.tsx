import { createFileRoute } from "@tanstack/react-router";
import { GoalsPage } from "@/components/pages";

export const Route = createFileRoute("/goals")({ component: GoalsPage });
