"use client";

import { useState } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { refreshSubscriptionsTable } from "../../services/subscriptionActions";

const RefreshSubscriptionsTableButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await refreshSubscriptionsTable();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="inline-flex size-9 items-center justify-center cursor-pointer rounded-lg border border-stroke-primary text-neutral-secondary transition-colors hover:border-secondary hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Actualizar suscripciones"
      title="Actualizar suscripciones"
    >
      <LuRefreshCw
        className={isRefreshing ? "animate-spin" : undefined}
        size={18}
      />
    </button>
  );
};

export default RefreshSubscriptionsTableButton;
