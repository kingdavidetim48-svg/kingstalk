import { auth } from "@clerk/nextjs/server";
import { KingsTalkLanding } from "@/components/kingstalk-landing";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return <KingsTalkLanding isSignedIn={isSignedIn} />;
}
