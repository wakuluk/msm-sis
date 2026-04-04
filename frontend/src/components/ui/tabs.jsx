import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs(props) {
  return <TabsPrimitive.Root {...props} />;
}

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-auto w-full flex-wrap items-center gap-2 rounded-none border-b border-[rgba(1,40,85,0.1)] bg-[linear-gradient(180deg,rgba(14,59,115,0.08),rgba(255,255,255,0.96))] px-4 py-3 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "[--button-hover-background:#01163c] [--button-hover-transform:none] inline-flex min-h-0 items-center justify-center rounded-full !border !border-[rgba(1,40,85,0.16)] !bg-[#012855] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] !text-white !shadow-[0_8px_18px_rgba(1,40,85,0.14)] transition-colors hover:!bg-[#01163c] hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(14,59,115,0.25)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:!border-[rgba(29,90,156,0.12)] data-[state=active]:!bg-[rgba(255,255,255,0.94)] data-[state=active]:!font-bold data-[state=active]:!text-[rgba(14,59,115,0.84)] data-[state=active]:!shadow-[0_4px_10px_rgba(1,40,85,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-0 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
