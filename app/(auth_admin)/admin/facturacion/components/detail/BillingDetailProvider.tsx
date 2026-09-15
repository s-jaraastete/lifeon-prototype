"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { Subscription } from "@/types/admin";
import BillingDetailPanel from "./BillingDetailPanel";

type BillingDetailContextValue = {
  openDetail: (subscription: Subscription) => void;
};

const BillingDetailContext = createContext<
  BillingDetailContextValue | undefined
>(undefined);

export const useBillingDetail = () => useContext(BillingDetailContext);

type BillingDetailProviderProps = {
  children: ReactNode;
};

const BillingDetailProvider = ({ children }: BillingDetailProviderProps) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  return (
    <BillingDetailContext.Provider
      value={{ openDetail: (subscription) => setSubscription(subscription) }}
    >
      {children}
      <BillingDetailPanel
        open={subscription !== null}
        subscription={subscription}
        onClose={() => setSubscription(null)}
      />
    </BillingDetailContext.Provider>
  );
};

export default BillingDetailProvider;
