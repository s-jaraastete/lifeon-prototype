"use client";

import { LuEllipsis } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import { useBillingDetail } from "./BillingDetailProvider";

type BillingRowActionProps = {
  subscription: Subscription;
};

// TODO: Reemplazar por menú de acciones cuando exista la API de facturación.
const BillingRowAction = ({ subscription }: BillingRowActionProps) => {
  const detail = useBillingDetail();

  return (
    <button
      type="button"
      onClick={() => detail?.openDetail(subscription)}
      aria-label="Ver detalle de facturación"
      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-100"
    >
      <LuEllipsis className="size-4" />
    </button>
  );
};

export default BillingRowAction;
