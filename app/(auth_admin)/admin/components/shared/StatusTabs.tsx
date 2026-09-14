"use client";

import clsx from "clsx";
import useUrlParams from "../hooks/useUrlParams";

export type StatusTab = { label: string; value: string | null };

type StatusTabsProps = {
  tabs: StatusTab[];
  paramName?: string;
};

const StatusTabs = ({ tabs, paramName = "status" }: StatusTabsProps) => {
  const { searchParams, setParam } = useUrlParams();

  const currentStatus = searchParams.get(paramName);

  const updateStatus = (value: string | null) => setParam(paramName, value ?? "");

  return (
    <div className="flex flex-wrap items-center gap-1 bg-surface-tertiary rounded-lg p-0.75">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          onClick={() => updateStatus(tab.value)}
          className={clsx(
            "rounded-lg px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            (currentStatus ?? null) === tab.value
              ? "bg-surface-primary text-neutral-primary"
              : "text-neutral-secondary hover:bg-stroke hover:text-neutral-primary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default StatusTabs;
