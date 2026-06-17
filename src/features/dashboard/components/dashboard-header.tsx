"use client";
import { useUser } from "@clerk/nextjs";
import { Headphones, Sparkles, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardHeader() {
  const { isLoaded, user } = useUser();

  return (
    <div className="flex items-start justify-between gap-4 animate-fade-in-up">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-3 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Nice to see you</p>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight lg:text-4xl">
          {isLoaded ? (
            <>
              Hello,{" "}
              <span className="text-gradient">
                {user?.fullName ?? user?.firstName ?? "there"}
              </span>
            </>
          ) : (
            <Skeleton className="inline-block h-9 w-48 align-middle" />
          )}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Transform your words into studio-quality speech in seconds.
        </p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 lg:flex">
        <ThemeSwitcher />
        <Button variant="outline" size="sm" className="gap-2 border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:border-primary/30" asChild>
          <Link href="mailto:aetim8273@gmail.com">
            <ThumbsUp className="size-4" />
            <span>Feedback</span>
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 border-border/40 bg-background/60 backdrop-blur-sm transition-all hover:border-primary/30" asChild>
          <Link href="mailto:aetim8273@gmail.com">
            <Headphones className="size-4" />
            <span>Support</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
