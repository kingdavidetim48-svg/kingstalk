import { OrganizationList } from "@clerk/nextjs";
import Image from "next/image";

export default function OrgSelectionPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 mesh-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-48 -top-48 size-[36rem] rounded-full bg-gradient-to-br from-primary/8 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 -right-48 size-[36rem] rounded-full bg-gradient-to-br from-primary/8 to-transparent blur-3xl" />
      </div>
      <div className="relative flex flex-col items-center gap-8 px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Image src="/kingstalkLogo.png" alt="KingsTalk" width={36} height={36} className="rounded-lg" />
            <div className="absolute -inset-1 -z-10 rounded-lg bg-primary/20 blur-md" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">KingsTalk</span>
        </div>
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/app"
          afterSelectOrganizationUrl="/app"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl border border-border/40 backdrop-blur-xl rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}
