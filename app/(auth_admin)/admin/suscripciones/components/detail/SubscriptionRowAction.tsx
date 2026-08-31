"use client";

import { EyeIcon } from "@heroicons/react/24/outline";
import { Subscription } from "@/types/admin";
import GenericMenu, { MenuItem } from "@/components/reusable/GenericMenu";
import { useSubscriptionDetail } from "./SubscriptionDetailProvider";

const SubscriptionRowAction = ({ subscription }: { subscription: Subscription }) => {
  const detail = useSubscriptionDetail();

  return (
    <div className="flex justify-end">
      <GenericMenu>
        <MenuItem
          icon={<EyeIcon />}
          onClick={() => detail?.openDetail(subscription)}
        >
          Ver detalle
        </MenuItem>
        {/* <MenuItem
          icon={<EyeIcon />}
          onClick={() => removeSub(subscription.plublic_id)}
        >
          Elimnar
        </MenuItem> */}
      </GenericMenu>
    </div>
  );
};

export default SubscriptionRowAction;
