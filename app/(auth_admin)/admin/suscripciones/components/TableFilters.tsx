"use client";

import SearchInput from "./filters/SearchInput";
import StatusTabs from "./filters/StatusTabs";

const TableFilters = () => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <SearchInput />
      <StatusTabs />
    </div>
  );
};

export default TableFilters;
