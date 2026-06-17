import { PageHeader } from "@/components/page-header";

export function TextToSpeechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader title="Text to speech" />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {children}
      </div>
    </div>
  );
}
