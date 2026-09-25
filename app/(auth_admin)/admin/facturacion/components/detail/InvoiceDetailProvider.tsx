"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { Invoice } from "@/types/admin";
import InvoiceDetailPanel from "./InvoiceDetailPanel";
import CreditNoteDetailPanel from "./CreditNoteDetailPanel";

type InvoiceDetailView = "invoice" | "credit_note";

type SelectedInvoiceDetail = {
  view: InvoiceDetailView;
  invoice: Invoice;
} | null;

type InvoiceDetailContextValue = {
  openInvoiceDetail: (invoice: Invoice) => void;
  openCreditNoteDetail: (invoice: Invoice) => void;
};

const InvoiceDetailContext = createContext<
  InvoiceDetailContextValue | undefined
>(undefined);

export const useInvoiceDetail = () => useContext(InvoiceDetailContext);

type InvoiceDetailProviderProps = {
  children: ReactNode;
};

const InvoiceDetailProvider = ({ children }: InvoiceDetailProviderProps) => {
  const [selectedDetail, setSelectedDetail] =
    useState<SelectedInvoiceDetail>(null);

  const closeDetail = () => setSelectedDetail(null);

  return (
    <InvoiceDetailContext.Provider
      value={{
        openInvoiceDetail: (invoice) =>
          setSelectedDetail({ view: "invoice", invoice }),
        openCreditNoteDetail: (invoice) =>
          setSelectedDetail({ view: "credit_note", invoice }),
      }}
    >
      {children}
      <InvoiceDetailPanel
        open={selectedDetail?.view === "invoice"}
        invoice={
          selectedDetail?.view === "invoice" ? selectedDetail.invoice : null
        }
        onClose={closeDetail}
      />
      <CreditNoteDetailPanel
        open={selectedDetail?.view === "credit_note"}
        invoice={
          selectedDetail?.view === "credit_note" ? selectedDetail.invoice : null
        }
        onClose={closeDetail}
      />
    </InvoiceDetailContext.Provider>
  );
};

export default InvoiceDetailProvider;
