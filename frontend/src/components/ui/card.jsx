import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-[rgba(1,40,85,0.14)] bg-[linear-gradient(180deg,rgba(14,59,115,0.06),rgba(255,255,255,0)_180px),var(--card-background)] text-[var(--text-strong)] shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col gap-2 px-6 py-6 sm:px-8", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h2
      className={cn("text-2xl font-semibold tracking-tight text-[var(--text-strong)]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm leading-6 text-[var(--text-muted)]", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return (
    <div
      className={cn("px-6 pb-6 sm:px-8 sm:pb-8", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
