"use client";

import SearchInput from "./filters/SearchInput";
import StatusTabs from "./filters/StatusTabs";
import MoreFilters from "./filters/MoreFilters";

const TableFilters = () => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
      <SearchInput />
      <div className="flex items-center gap-3 flex-wrap">
        <StatusTabs />
        <MoreFilters />
      </div>
    </div>
  );
};

export default TableFilters;
