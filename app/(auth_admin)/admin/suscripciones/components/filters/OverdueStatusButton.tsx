"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LuChevronRight } from "react-icons/lu";

const OVERDUE_STATUS = "past_due";

const OverdueStatusButton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const applyOverdueFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", OVERDUE_STATUS);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={applyOverdueFilter}
      className="inline-flex items-center gap-0.5 font-medium text-sm text-secondary cursor-pointer hover:underline"
    >
      Ver vencimientos
      <LuChevronRight className="inline-block" />
    </button>
  );
};

export default OverdueStatusButton;