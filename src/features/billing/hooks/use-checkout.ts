import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";

export function useCheckout() {
  const router = useRouter();
  const trpc = useTRPC();
  const mutation = useMutation(
    trpc.billing.initializePaystack.mutationOptions(),
  );

  const checkout = useCallback(
    (planId = "starter") => {
      mutation.mutate(
        { planId },
        {
          onSuccess: (data) => {
            window.location.href = data.authorizationUrl;
          },
          onError: () => {
            router.push("/app?billing=1");
          },
        },
      );
    },
    [mutation, router],
  );

  return { checkout, isPending: mutation.isPending };
}
