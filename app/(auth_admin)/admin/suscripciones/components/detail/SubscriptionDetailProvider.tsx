"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { Subscription } from "@/types/admin";
import SubscriptionDetailPanel from "./SubscriptionDetailPanel";

const DetailContext = createContext<{
  openDetail: (subscription: Subscription) => void;
} | undefined>(undefined);

export const useSubscriptionDetail = () => useContext(DetailContext);

export default function SubscriptionDetailProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  return (
    <DetailContext.Provider value={{ openDetail: setSubscription }}>
      {children}
      <SubscriptionDetailPanel
        open={!!subscription}
        subscription={subscription}
        onClose={() => setSubscription(null)}
      />
    </DetailContext.Provider>
  );
}
