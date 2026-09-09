import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="rise-in mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-primary">{eyebrow}</p>
        )}
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  hint,
  actions,
  children,
  className,
}: {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "soft-card rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 sm:p-6",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && (
              <h2 className="font-display text-lg font-semibold text-card-foreground">{title}</h2>
            )}
            {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  tone?: "default" | "primary" | "info" | "warning";
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "info"
        ? "text-info"
        : tone === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-display text-2xl font-semibold leading-none", toneClass)}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "info" | "warning" | "success";
}) {
  const map: Record<string, string> = {
    muted: "bg-secondary text-secondary-foreground border-border",
    primary: "bg-primary/12 text-primary border-primary/25",
    info: "bg-info/12 text-info border-info/25",
    warning: "bg-warning/18 text-warning-foreground border-warning/35",
    success: "bg-success/12 text-success border-success/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}
