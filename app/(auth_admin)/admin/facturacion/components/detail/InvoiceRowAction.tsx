"use client";

import GenericMenu, { MenuItem } from "@/components/reusable/GenericMenu";
import { LuFileText, LuReceiptText } from "react-icons/lu";
import { Invoice } from "@/types/admin";
import { useInvoiceDetail } from "./InvoiceDetailProvider";

type InvoiceRowActionProps = {
  invoice: Invoice;
};

// TODO: El backend no tiene notas de crédito; la opción se mantiene para cuando
// exista el modelo y se muestre una u otra según el tipo de documento.
const InvoiceRowAction = ({ invoice }: InvoiceRowActionProps) => {
  const detail = useInvoiceDetail();

  return (
    <GenericMenu>
      <MenuItem
        icon={<LuFileText />}
        onClick={() => detail?.openInvoiceDetail(invoice)}
      >
        Ver detalle de facturación
      </MenuItem>
      <MenuItem
        icon={<LuReceiptText />}
        onClick={() => detail?.openCreditNoteDetail(invoice)}
      >
        Ver detalle de nota de crédito
      </MenuItem>
    </GenericMenu>
  );
};

export default InvoiceRowAction;
