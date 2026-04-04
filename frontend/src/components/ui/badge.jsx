import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        default: "border-[rgba(14,59,115,0.16)] bg-[rgba(14,59,115,0.08)] text-[var(--brand-blue)]",
        accent: "border-[rgba(29,90,156,0.22)] bg-[rgba(29,90,156,0.1)] text-[#0e4b90]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
