"use client";

import { createContext, ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/reusable/Alert";
import {
  getSubscriptionPaymentRetryStatus,
  SubscriptionPaymentRetryStatus,
} from "../services/subscriptionActions";

const POLLING_INTERVAL_MS = 2_000;
const MAX_POLLING_DURATION_MS = 30_000;

type PaymentRetryContextValue = {
  isPaymentRetryProcessing: (subscriptionPublicId: string) => boolean;
  startPaymentRetryPolling: (
    subscriptionPublicId: string,
    previousPaymentAttemptId: number | null,
  ) => void;
};

type SubscriptionPaymentRetryProviderProps = {
  children: ReactNode;
};

type RetryAlert = {
  title: string;
  message: string;
  type: "success" | "error";
} | null;

const PaymentRetryContext = createContext<PaymentRetryContextValue | undefined>(
  undefined,
);

export const useSubscriptionPaymentRetry = () => {
  const context = useContext(PaymentRetryContext);

  if (context === undefined) {
    throw new Error(
      "useSubscriptionPaymentRetry debe usarse dentro de SubscriptionPaymentRetryProvider.",
    );
  }

  return context;
};

const SubscriptionPaymentRetryProvider = ({
  children,
}: SubscriptionPaymentRetryProviderProps) => {
  const router = useRouter();
  const pollingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [processingSubscriptionIds, setProcessingSubscriptionIds] = useState<
    Record<string, true>
  >({});
  const [retryAlert, setRetryAlert] = useState<RetryAlert>(null);

  const stopPaymentRetryPolling = useCallback((subscriptionPublicId: string) => {
    const timer = pollingTimers.current[subscriptionPublicId];

    if (timer !== undefined) {
      clearTimeout(timer);
      delete pollingTimers.current[subscriptionPublicId];
    }

    setProcessingSubscriptionIds((currentIds) => {
      const { [subscriptionPublicId]: _removedSubscription, ...remainingIds } = currentIds;

      return remainingIds;
    });
  }, []);

  const handleCompletedPaymentRetry = useCallback(
    (
      subscriptionPublicId: string,
      retryStatus: SubscriptionPaymentRetryStatus["retry_status"],
    ) => {
      stopPaymentRetryPolling(subscriptionPublicId);
      router.refresh();

      if (retryStatus === "approved") {
        setRetryAlert({
          type: "success",
          title: "Cobro aprobado correctamente",
          message: "La suscripción fue renovada y ya se encuentra activa.",
        });

        return;
      }

      setRetryAlert({
        type: "error",
        title: "El método de pago no aceptó el cobro",
        message: "La suscripción permanecerá vencida.",
      });
    },
    [router, stopPaymentRetryPolling],
  );

  const startPaymentRetryPolling = useCallback(
    (
      subscriptionPublicId: string,
      previousPaymentAttemptId: number | null,
    ) => {
      stopPaymentRetryPolling(subscriptionPublicId);
      setProcessingSubscriptionIds((currentIds) => ({
        ...currentIds,
        [subscriptionPublicId]: true,
      }));

      const startedAt = Date.now();

      const poll = async () => {
        try {
          const result = await getSubscriptionPaymentRetryStatus(
            subscriptionPublicId,
            previousPaymentAttemptId,
          );

          if (result.retry_status === "approved") {
            handleCompletedPaymentRetry(subscriptionPublicId, "approved");

            return;
          }

          if (
            result.retry_status === "rejected"
            || result.retry_status === "error"
            || result.retry_status === "requires_review"
          ) {
            handleCompletedPaymentRetry(subscriptionPublicId, result.retry_status);

            return;
          }
        } catch {
          // El siguiente intento puede encontrar el resultado cuando el worker termine.
        }

        if (Date.now() - startedAt >= MAX_POLLING_DURATION_MS) {
          stopPaymentRetryPolling(subscriptionPublicId);
          router.refresh();

          return;
        }

        pollingTimers.current[subscriptionPublicId] = setTimeout(
          poll,
          POLLING_INTERVAL_MS,
        );
      };

      pollingTimers.current[subscriptionPublicId] = setTimeout(
        poll,
        POLLING_INTERVAL_MS,
      );
    },
    [handleCompletedPaymentRetry, router, stopPaymentRetryPolling],
  );

  useEffect(() => () => {
    Object.values(pollingTimers.current).forEach(clearTimeout);
  }, []);

  return (
    <PaymentRetryContext.Provider
      value={{
        isPaymentRetryProcessing: (subscriptionPublicId) => (
          processingSubscriptionIds[subscriptionPublicId] === true
        ),
        startPaymentRetryPolling,
      }}
    >
      {children}
      <Alert
        open={retryAlert !== null}
        onClose={() => setRetryAlert(null)}
        title={retryAlert?.title ?? ""}
        type={retryAlert?.type ?? "success"}
        duration={5_000}
      >
        {retryAlert?.message}
      </Alert>
    </PaymentRetryContext.Provider>
  );
};

export default SubscriptionPaymentRetryProvider;
