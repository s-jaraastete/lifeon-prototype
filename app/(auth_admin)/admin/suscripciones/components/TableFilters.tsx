"use client";

import SearchInput from "./filters/SearchInput";
import StatusTabs from "./filters/StatusTabs";
import FilterDropdown from "./filters/FilterDropdown";

const TableFilters = () => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap pb-1">
      <SearchInput />
      <div className="flex items-center gap-3 flex-wrap">
        <StatusTabs />
        <FilterDropdown />
      </div>
    </div>
  );
};

export default TableFilters;
