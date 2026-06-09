import { TextToSpeechLayout } from "@/features/views/text-to-speech-layout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <TextToSpeechLayout>{children}</TextToSpeechLayout>;
}
