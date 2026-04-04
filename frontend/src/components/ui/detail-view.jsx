import { createElement } from "react";
import { cva } from "class-variance-authority";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent } from "@/components/ui/tabs";
import { formatDisplayValue } from "@/lib/formatDisplayValue";
import { cn } from "@/lib/utils";

const detailStateIconVariants = cva(
  "flex h-16 w-16 items-center justify-center rounded-3xl",
  {
    variants: {
      tone: {
        default: "bg-[rgba(14,59,115,0.1)] text-[var(--brand-blue)]",
        danger: "bg-[rgba(161,40,40,0.12)] text-[#a12828]",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  },
);

const detailStatusBadgeVariants = cva(
  "w-fit shadow-[0_6px_16px_rgba(14,75,144,0.08)]",
  {
    variants: {
      tone: {
        cool: "border-[rgba(29,90,156,0.18)] bg-[rgba(216,233,251,0.92)] text-[#0d4b90]",
        warm: "border-[rgba(171,122,34,0.18)] bg-[rgba(255,245,214,0.96)] text-[#8c5a12] shadow-[0_6px_16px_rgba(140,90,18,0.08)]",
      },
    },
    defaultVariants: {
      tone: "cool",
    },
  },
);

export function DetailPage({ className, ...props }) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 py-1", className)}
      {...props}
    />
  );
}

export function DetailHeaderCard({ eyebrow, title, badges, summary }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            {eyebrow ? <Badge className="w-fit">{eyebrow}</Badge> : null}
            <div className="space-y-4">
              <CardTitle className="text-3xl sm:text-4xl">
                {formatDisplayValue(title)}
              </CardTitle>
              {badges ? <div className="flex flex-wrap gap-3">{badges}</div> : null}
            </div>
          </div>

          {summary}
        </div>
      </CardHeader>
    </Card>
  );
}

export function DetailStatusBadge({ className, tone, ...props }) {
  return (
    <Badge
      variant={tone === "cool" ? "accent" : "default"}
      className={cn(detailStatusBadgeVariants({ tone }), className)}
      {...props}
    />
  );
}

export function DetailSummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(1,40,85,0.08)] bg-white/72 px-4 py-4 shadow-[0_6px_18px_rgba(1,40,85,0.06)]">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[rgba(1,40,85,0.56)]">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-[var(--text-strong)]">
        {formatDisplayValue(value)}
      </p>
    </div>
  );
}

export function DetailField({ label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(1,40,85,0.08)] bg-white/78 px-4 py-4 shadow-[0_6px_16px_rgba(1,40,85,0.04)]">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[rgba(1,40,85,0.56)]">
        {label}
      </p>
      <p className="mt-2 text-[0.98rem] font-medium leading-6 text-[var(--text-strong)]">
        {formatDisplayValue(value)}
      </p>
    </div>
  );
}

export function DetailSection({ icon: Icon, title, description, children }) {
  const iconElement = createElement(Icon, { className: "h-5 w-5" });
  const hasDescription = typeof description === "string" && description.trim().length > 0;

  return (
    <section className="rounded-[22px] border border-[rgba(1,40,85,0.1)] bg-[linear-gradient(180deg,rgba(14,59,115,0.05),rgba(255,255,255,0.92))] p-5 shadow-[0_10px_22px_rgba(1,40,85,0.05)] sm:p-6">
      <div className={hasDescription ? "flex items-start gap-3" : "flex items-center gap-3"}>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(14,59,115,0.1)] text-[var(--brand-blue)]">
          {iconElement}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h2>
          {hasDescription ? (
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function DetailStateCard({ icon: Icon, title, description, tone = "default" }) {
  const iconElement = createElement(Icon, { className: "h-7 w-7" });

  return (
    <DetailPage>
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:px-10">
          <div className={detailStateIconVariants({ tone })}>
            {iconElement}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[var(--text-strong)]">{title}</h1>
            <p className="max-w-xl text-sm leading-7 text-[var(--text-muted)]">{description}</p>
          </div>
        </CardContent>
      </Card>
    </DetailPage>
  );
}

export function DetailPageLoading() {
  return (
    <DetailPage>
      <Card className="overflow-hidden">
        <CardHeader className="gap-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-12 w-full max-w-md" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
            <div className="rounded-[22px] border border-[rgba(1,40,85,0.1)] bg-[rgba(255,255,255,0.82)] px-5 py-4 shadow-[0_10px_24px_rgba(1,40,85,0.06)]">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-32" />
              <Skeleton className="mt-4 h-4 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[rgba(1,40,85,0.1)] px-6 py-4 sm:px-8">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>

        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[22px] border border-[rgba(1,40,85,0.1)] bg-white/78 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full max-w-xs" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((__, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="rounded-2xl border border-[rgba(1,40,85,0.08)] bg-white/72 px-4 py-4"
                  >
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-3 h-5 w-full max-w-[10rem]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </DetailPage>
  );
}

export function DetailTabPanel({ className, ...props }) {
  return (
    <TabsContent
      className={cn("px-6 pb-6 pt-6 sm:px-8 sm:pb-8", className)}
      {...props}
    />
  );
}
