"use client";

import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import { useRouter, useSearchParams } from "next/navigation";
import TextInput from "@/app/components/ui/TextInput";
import useDebounce from "@/hooks/useDebounce";

const SearchInput = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") ?? "";

  const [search, setSearch] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearch(currentSearch);
  }

  useDebounce(
    () => {
      if (search === currentSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("search", search);
      else params.delete("search");
      params.set("page", "1");
      router.replace(`?${params.toString()}`);
    },
    700,
    [search]
  );

  return (
    <div className="relative max-w-sm w-full">
      <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-tertiary" />
      <TextInput
        type="search"
        placeholder="Buscar por ID Suscripción, nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 pl-9 ring-stroke-primary"
      />
    </div>
  );
};

export default SearchInput;
