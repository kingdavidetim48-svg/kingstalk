import { OrganizationList } from "@clerk/nextjs";
import { Crown } from "lucide-react";

export default function OrgSelectionPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Mesh Background */}
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-30" />
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="z-10 w-full max-w-md space-y-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md premium-shadow">
            <Crown className="size-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Welcome to KingsTalk
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Select an organization or create a new workspace to access your voice dashboard.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-4 shadow-xl backdrop-blur-md">
          <OrganizationList
            hidePersonal={true}
            afterCreateOrganizationUrl="/"
            afterSelectOrganizationUrl="/"
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                cardBox: "w-full",
                card: "shadow-none bg-transparent border-0 w-full p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                organizationListTrigger: "border border-border bg-background/50 hover:bg-muted/40",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
