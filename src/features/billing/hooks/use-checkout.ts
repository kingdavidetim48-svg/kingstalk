import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useCheckout() {
  const router = useRouter();

  const checkout = useCallback(
    (planId = "starter") => {
      router.push(`/app/billing?planId=${planId}`);
    },
    [router],
  );

  return { checkout, isPending: false };
}
