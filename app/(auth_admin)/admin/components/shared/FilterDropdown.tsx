"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { LuArrowDown, LuArrowUp, LuChevronDown, LuEraser, LuListFilter, LuFilter, LuX } from "react-icons/lu";
import clsx from "clsx";
import useDebouncedUrlParam from "../hooks/useDebouncedUrlParam";

export type FilterOption = { value: string; label: string };

type SelectGroup = {
  type: "select";
  label: string;
  param: string;
  legacyParams?: string[];
  options: FilterOption[];
};

type RangeGroup = {
  type: "number-range" | "date-range";
  label: string;
  base: string;
  ariaLabels?: [string, string];
};

export type FilterGroup = SelectGroup | RangeGroup;

export type OrderingConfig = {
  options: FilterOption[];
  defaultDescFields?: string[];
  legacyMap?: Record<string, string>;
  paramName?: string;
};

type FilterDropdownProps = {
  ordering?: OrderingConfig;
  groups: FilterGroup[];
  title?: string;
};

// TODO: Faltan componentes finales, de momento todos los inputs/selects tienen funcionalidad y estilos nativos
const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
  placeholder?: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-base input-ring input-focus rounded-lg ring-stroke-primary w-full appearance-none bg-white pr-8 ps-3 py-2.5 text-sm leading-4 text-neutral-primary cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <LuChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
    {!value && placeholder && <span className="sr-only">{placeholder}</span>}
  </div>
);

const RangeInput = ({
  type,
  value,
  onChange,
  ariaLabel,
}: {
  type: "number" | "date";
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) => (
  <input
    type={type}
    step={type === "number" ? "1" : undefined}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={ariaLabel}
    className="input-base input-ring input-focus rounded-lg ring-stroke-primary w-full min-w-0 bg-white px-3 py-2.5 text-xs leading-4 text-neutral-primary"
  />
);

const RangeGroupField = ({
  group,
  searchParams,
  setParam,
}: {
  group: RangeGroup;
  searchParams: ReadonlyURLSearchParams;
  setParam: (key: string, value: string) => void;
}) => {
  const from = searchParams.get(`${group.base}__gte`) ?? "";
  const to = searchParams.get(`${group.base}__lte`) ?? "";
  const [fromValue, setFromValue] = useDebouncedUrlParam(`${group.base}__gte`, from, setParam);
  const [toValue, setToValue] = useDebouncedUrlParam(`${group.base}__lte`, to, setParam);
  const inputType = group.type === "date-range" ? "date" : "number";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
      <div className="grid grid-cols-2 gap-1.5">
        <RangeInput
          type={inputType}
          value={fromValue}
          onChange={setFromValue}
          ariaLabel={group.ariaLabels?.[0] ?? `${group.label} desde`}
        />
        <RangeInput
          type={inputType}
          value={toValue}
          onChange={setToValue}
          ariaLabel={group.ariaLabels?.[1] ?? `${group.label} hasta`}
        />
      </div>
    </div>
  );
};

const FilterDropdown = ({
  ordering: orderingConfig,
  groups,
  title = "Filtros",
}: FilterDropdownProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  const orderingParam = orderingConfig?.paramName ?? "ordering";
  const ordering = searchParams.get(orderingParam) ?? "";

  const rawIsDesc = ordering.startsWith("-");
  const rawField = rawIsDesc ? ordering.slice(1) : ordering;
  const legacyMap = orderingConfig?.legacyMap ?? {};
  const mappedField = rawField in legacyMap ? legacyMap[rawField] : rawField;
  const allowedFields = new Set((orderingConfig?.options ?? []).map((o) => o.value));
  const orderingField = allowedFields.has(mappedField) ? mappedField : "";
  const isDesc = orderingField ? rawIsDesc : true;

  const selectedKeys = groups.reduce<string[]>((acc, g) => {
    if (g.type === "select") {
      acc.push(g.param);
      if (g.legacyParams) acc.push(...g.legacyParams);
    } else {
      acc.push(`${g.base}__gte`, `${g.base}__lte`);
    }
    return acc;
  }, []);
  if (orderingConfig) selectedKeys.push(orderingParam);

  const activeCount = selectedKeys
    .map((k) => searchParams.get(k) ?? "")
    .filter(Boolean).length;

  const setOrderingField = (field: string) => {
    if (!field) {
      setParam(orderingParam, "");
      return;
    }
    const defaultDesc = orderingConfig?.defaultDescFields?.includes(field) ?? false;
    setParam(orderingParam, defaultDesc ? `-${field}` : field);
  };

  const toggleOrderingDirection = () => {
    if (!orderingField) {
      setParam(orderingParam, isDesc ? "created" : "-created");
      return;
    }
    setParam(orderingParam, isDesc ? orderingField : `-${orderingField}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    selectedKeys.forEach((k) => params.delete(k));
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary",
              open || activeCount > 0
                ? "text-secondary"
                : "border-gray-300 text-gray-800 hover:bg-gray-100"
            )}
          >
            <LuListFilter className="h-4 w-4 shrink-0 text-secondary" />
            <span>{title}</span>
            {activeCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-bold leading-none text-white">
                {activeCount}
              </span>
            )}
            {activeCount > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    clearAll();
                  }
                }}
                aria-label="Limpiar filtros"
                className="inline-flex items-center justify-center rounded-full p-0.5 text-gray-700 hover:bg-gray-100 hover:text-secondary cursor-pointer"
              >
                <LuX className="h-4 w-4" />
              </span>
            )}
            <LuChevronDown
              className={clsx(
                "h-4 w-4 shrink-0 text-gray-700 transition-transform",
                open && "rotate-180"
              )}
            />
          </PopoverButton>

          <PopoverPanel
            anchor="bottom end"
            transition
            className={clsx(
              "z-50 flex max-h-[80vh] w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
              "origin-top transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
            )}
          >
            <div className="flex shrink-0 items-center gap-1.5 border-b border-gray-100 px-4 py-3 text-body-sm font-semibold text-neutral-primary">
              <LuFilter className="h-4 w-4 text-secondary" />
              {title}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {orderingConfig && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neutral-secondary">Ordenar por</span>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <FilterSelect
                        value={orderingField}
                        onChange={setOrderingField}
                        options={orderingConfig.options}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={toggleOrderingDirection}
                      aria-label={isDesc ? "Descendente: mayor/más reciente primero" : "Ascendente: menor/más antiguo primero"}
                      title={isDesc ? "Descendente" : "Ascendente"}
                      className={clsx(
                        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring bg-white cursor-pointer transition-colors",
                        "ring-gray-300 text-secondary hover:bg-teal-50 hover:ring-secondary",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                      )}
                    >
                      {isDesc ? <LuArrowDown className="h-4 w-4" /> : <LuArrowUp className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {groups.map((group) => {
                if (group.type === "select") {
                  const selectValue = () => {
                    const candidates = [group.param, ...(group.legacyParams ?? [])];
                    for (const p of candidates) {
                      const v = searchParams.get(p);
                      if (v) return v;
                    }
                    return "";
                  };
                  return (
                    <div key={group.param} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
                      <FilterSelect
                        value={selectValue()}
                        onChange={(v) => setParam(group.param, v)}
                        options={group.options}
                      />
                    </div>
                  );
                }

                return (
                  <RangeGroupField
                    key={group.base}
                    group={group}
                    searchParams={searchParams}
                    setParam={setParam}
                  />
                );
              })}
            </div>

            <div className="shrink-0 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={clearAll}
                className={clsx(
                  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-secondary bg-white px-3 py-2",
                  "text-sm font-medium text-secondary transition-colors hover:bg-teal-50 cursor-pointer",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                )}
              >
                <LuEraser className="h-4 w-4" />
                Limpiar filtros
              </button>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default FilterDropdown;
