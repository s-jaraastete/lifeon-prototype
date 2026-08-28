"use client";

import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";

const statusTabs: { label: string; value: string | null }[] = [
  { label: "Todas", value: null },
  { label: "Activas", value: "active" },
  { label: "Suspendidas", value: "suspended" },
  { label: "Canceladas", value: "cancelled" },
];

const StatusTabs = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status");

  const updateStatus = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statusTabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          onClick={() => updateStatus(tab.value)}
          className={clsx(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            (currentStatus ?? null) === tab.value
              ? "bg-neutral-primary text-white"
              : "bg-surface-secondary text-neutral-secondary hover:bg-stroke hover:text-neutral-primary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default StatusTabs;
