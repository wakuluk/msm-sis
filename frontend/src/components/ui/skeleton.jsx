import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[rgba(14,59,115,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
