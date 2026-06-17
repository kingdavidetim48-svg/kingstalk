import { cn } from "@/lib/utils";

export function GradientInputShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-[22px] p-[3px] transition-all duration-500",
        "bg-[linear-gradient(185deg,var(--gradient-from)_15%,var(--gradient-via)_39%,var(--gradient-to)_85%)]",
        "shadow-[0_0_0_3px_var(--gradient-inner),0_4px_24px_-8px_var(--glow)]",
        "hover:shadow-[0_0_0_3px_var(--gradient-inner),0_12px_48px_-12px_var(--glow)]",
        className,
      )}
    >
      <div className="rounded-[19px] bg-(--gradient-shell) p-1 transition-colors duration-300">
        {children}
      </div>
    </div>
  );
}
