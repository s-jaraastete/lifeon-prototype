"use client";

import GenericMenu, { MenuItem } from "@/components/reusable/GenericMenu";
import { LuEye } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import { useBillingDetail } from "./BillingDetailProvider";

type BillingRowActionProps = {
  subscription: Subscription;
};

// TODO: Con datos reales de la API de facturación, mostrar solo la opción
// correspondiente según el tipo de documento (factura o nota de crédito)
const BillingRowAction = ({ subscription }: BillingRowActionProps) => {
  const detail = useBillingDetail();

  return (
    <GenericMenu>
      <MenuItem
        icon={<LuEye />}
        onClick={() => detail?.openBillingDetail(subscription)}
      >
        Ver detalle de facturación
      </MenuItem>
      <MenuItem
        icon={<LuEye />}
        onClick={() => detail?.openCreditNoteDetail(subscription)}
      >
        Ver detalle de Nota de crédito
      </MenuItem>
    </GenericMenu>
  );
};

export default BillingRowAction;
