"use client";

import { LuChevronRight } from "react-icons/lu";
import useUrlParams from "@/app/(auth_admin)/admin/components/hooks/useUrlParams";

const OVERDUE_STATUS = "past_due";

const OverdueStatusButton = () => {
  const { setParam } = useUrlParams();

  return (
    <button
      type="button"
      onClick={() => setParam("status", OVERDUE_STATUS)}
      className="inline-flex items-center gap-0.5 font-medium text-sm text-secondary cursor-pointer hover:underline"
    >
      Ver vencimientos
      <LuChevronRight className="inline-block" />
    </button>
  );
};

export default OverdueStatusButton;
