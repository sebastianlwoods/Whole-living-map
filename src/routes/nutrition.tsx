import { createFileRoute } from "@tanstack/react-router";
import { NutritionPage } from "@/components/pages";

export const Route = createFileRoute("/nutrition")({ component: NutritionPage });
