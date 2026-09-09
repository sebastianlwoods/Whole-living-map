import { createFileRoute } from "@tanstack/react-router";
import { HealthPage } from "@/components/pages";

export const Route = createFileRoute("/health")({ component: HealthPage });
