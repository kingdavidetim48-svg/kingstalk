import { auth, clerkClient } from "@clerk/nextjs/server";
import { env } from "./env";

export async function requireAdmin(): Promise<{ userId: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email =
    user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!email || email !== env.ADMIN_EMAIL) {
    throw new Error("FORBIDDEN");
  }

  return { userId };
}
