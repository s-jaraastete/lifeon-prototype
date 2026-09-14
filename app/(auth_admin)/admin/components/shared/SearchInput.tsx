"use client";

import { useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
import TextInput from "@/app/components/ui/TextInput";
import useDebounce from "@/hooks/useDebounce";
import useUrlParams from "../hooks/useUrlParams";

type SearchInputProps = {
  paramName?: string;
  placeholder?: string;
};

const SearchInput = ({ paramName = "search", placeholder }: SearchInputProps) => {
  const { searchParams, buildParams, push } = useUrlParams();

  const currentSearch = searchParams.get(paramName) ?? "";

  const [search, setSearch] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearch(currentSearch);
  }

  useDebounce(
    () => {
      if (search === currentSearch) return;
      const params = buildParams();
      if (search) params.set(paramName, search);
      else params.delete(paramName);
      params.set("page", "1");
      push(params);
    },
    700,
    [search]
  );

  return (
    <div className="relative max-w-sm w-full">
      <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-tertiary" />
      <TextInput
        type="search"
        placeholder={placeholder ?? "Buscar..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 pl-9 pr-9 ring-stroke-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {search && (
        <button
          type="button"
          onClick={() => setSearch("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 flex size-4 -translate-y-1/2 cursor-pointer items-center justify-center text-gray-700 hover:text-neutral-primary"
        >
          <LuX className="size-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
