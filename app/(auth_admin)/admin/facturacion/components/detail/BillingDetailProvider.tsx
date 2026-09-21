"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { Subscription } from "@/types/admin";
import BillingDetailPanel from "./BillingDetailPanel";
import CreditNoteDetailPanel from "./CreditNoteDetailPanel";

type BillingDetailView = "invoice" | "credit_note";

type SelectedBillingDetail = {
  view: BillingDetailView;
  subscription: Subscription;
} | null;

type BillingDetailContextValue = {
  openBillingDetail: (subscription: Subscription) => void;
  openCreditNoteDetail: (subscription: Subscription) => void;
};

const BillingDetailContext = createContext<
  BillingDetailContextValue | undefined
>(undefined);

export const useBillingDetail = () => useContext(BillingDetailContext);

type BillingDetailProviderProps = {
  children: ReactNode;
};

const BillingDetailProvider = ({ children }: BillingDetailProviderProps) => {
  const [selectedDetail, setSelectedDetail] =
    useState<SelectedBillingDetail>(null);

  const closeDetail = () => setSelectedDetail(null);

  return (
    <BillingDetailContext.Provider
      value={{
        openBillingDetail: (subscription) =>
          setSelectedDetail({ view: "invoice", subscription }),
        openCreditNoteDetail: (subscription) =>
          setSelectedDetail({ view: "credit_note", subscription }),
      }}
    >
      {children}
      <BillingDetailPanel
        open={selectedDetail?.view === "invoice"}
        subscription={
          selectedDetail?.view === "invoice" ? selectedDetail.subscription : null
        }
        onClose={closeDetail}
      />
      <CreditNoteDetailPanel
        open={selectedDetail?.view === "credit_note"}
        subscription={
          selectedDetail?.view === "credit_note"
            ? selectedDetail.subscription
            : null
        }
        onClose={closeDetail}
      />
    </BillingDetailContext.Provider>
  );
};

export default BillingDetailProvider;
