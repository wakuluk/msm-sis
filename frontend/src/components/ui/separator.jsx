import { cn } from "@/lib/utils";

function Separator({ className, orientation = "horizontal", ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "shrink-0 bg-[rgba(1,40,85,0.12)]",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
