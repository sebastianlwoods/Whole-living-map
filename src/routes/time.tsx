import { createFileRoute } from "@tanstack/react-router";
import { TimePage } from "@/components/pages";

export const Route = createFileRoute("/time")({ component: TimePage });
