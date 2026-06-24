"use client";
import { useUser } from "@clerk/nextjs";
import { Headphones, Sparkles, ThumbsUp, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function DashboardHeader() {
  const { isLoaded, user } = useUser();
  const trpc = useTRPC();
  
  const { data: billingStatus } = useQuery(trpc.billing.getStatus.queryOptions());
  
  const plan = billingStatus?.plan;
  const usage = billingStatus?.usage;
  
  const monthlyLimit = plan?.monthlyCharacterLimit ?? 10000;
  const monthlyUsed = usage?.currentUsageCharacters ?? 0;
  const monthlyRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const usagePercent = Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100));
  
  const showWarning = usagePercent >= 80;
  const warningLevel = usagePercent >= 100 ? 'critical' : usagePercent >= 90 ? 'high' : 'medium';

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
        
        {plan && showWarning && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${
            warningLevel === 'critical' 
              ? 'border-destructive/50 bg-destructive/10' 
              : warningLevel === 'high'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-primary/50 bg-primary/10'
          }`}>
            {warningLevel === 'critical' ? (
              <AlertTriangle className="size-4 text-destructive" />
            ) : (
              <TrendingUp className={`size-4 ${warningLevel === 'high' ? 'text-amber-500' : 'text-primary'}`} />
            )}
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${
                warningLevel === 'critical' 
                  ? 'text-destructive' 
                  : warningLevel === 'high'
                    ? 'text-amber-500'
                    : 'text-primary'
              }`}>
                {warningLevel === 'critical' 
                  ? 'Monthly limit reached' 
                  : warningLevel === 'high'
                    ? `${usagePercent}% quota used`
                    : `${usagePercent}% quota used`
                }
              </span>
              <span className="text-[10px] text-muted-foreground">
                {monthlyRemaining.toLocaleString()} chars remaining
              </span>
            </div>
          </div>
        )}
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
