import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="truncate font-display text-xl font-semibold uppercase tracking-wide sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm sm:mt-1">{subtitle}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "destructive";
}) {
  const toneClass = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone];

  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("size-4 shrink-0", toneClass)} />
      </div>
      <p className={cn("num mt-2 font-display text-2xl font-semibold sm:mt-3 sm:text-3xl", toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel overflow-hidden", className)}>
      <header className="border-b border-border px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="font-display text-base font-semibold uppercase tracking-wide sm:text-lg">
          {title}
        </h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

