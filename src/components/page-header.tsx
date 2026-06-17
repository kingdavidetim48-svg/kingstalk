import { Headphones, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border/40 bg-background/70 px-3 py-2.5 backdrop-blur-xl lg:px-4 lg:py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground transition-colors hover:text-foreground" />
        <h1 className="font-display text-base font-semibold tracking-tight lg:text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-1.5 lg:gap-2">
        <ThemeSwitcher compact />
        <Button variant="outline" size="sm" className="gap-1.5 border-border/40 bg-background/60 px-2 backdrop-blur-sm transition-all hover:border-primary/30 lg:gap-2 lg:px-3" asChild>
          <Link href="mailto:aetim8273@gmail.com">
            <ThumbsUp className="size-3.5 lg:size-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">Feedback</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 border-border/40 bg-background/60 px-2 backdrop-blur-sm transition-all hover:border-primary/30 lg:gap-2 lg:px-3" asChild>
          <Link href="mailto:aetim8273@gmail.com">
            <Headphones className="size-3.5 lg:size-4" />
            <span className="hidden sm:inline text-xs lg:text-sm">Support</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
