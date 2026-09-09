"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useRouter, useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { LuArrowDown, LuArrowUp, LuChevronDown, LuEraser, LuListFilter, LuFilter, LuX } from "react-icons/lu";
import clsx from "clsx";
import Select from "./Select";
import useDebouncedUrlParam from "../hooks/useDebouncedUrlParam";

export type FilterOption = { value: string; label: string };

type SelectGroup = {
  type: "select";
  label: string;
  param: string;
  options: FilterOption[];
  multiple?: boolean;
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
  paramName?: string;
};

type FilterDropdownProps = {
  ordering?: OrderingConfig;
  groups: FilterGroup[];
  title?: string;
};

const toItems = (options: FilterOption[]) =>
  options.filter((o) => o.value).map((o) => ({ id: o.value, label: o.label }));

const getPlaceholder = (options: FilterOption[], fallback = "Seleccione") =>
  options.find((o) => o.value === "")?.label ?? fallback;

const NumberRangeInput = ({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  placeholder?: string;
}) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs leading-4 text-neutral-tertiary">
      $
    </span>
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="input-base input-ring input-focus rounded-lg ring-stroke-primary w-full min-w-0 bg-white py-2.5 ps-7 pe-3 text-xs leading-4 text-neutral-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  </div>
);

const NumberRangeField = ({
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

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <NumberRangeInput
          value={fromValue}
          onChange={setFromValue}
          ariaLabel={group.ariaLabels?.[0] ?? `${group.label} desde`}
          placeholder="Min"
        />
        <span className="px-0.5 text-xs text-neutral-secondary">a</span>
        <NumberRangeInput
          value={toValue}
          onChange={setToValue}
          ariaLabel={group.ariaLabels?.[1] ?? `${group.label} hasta`}
          placeholder="Max"
        />
      </div>
    </div>
  );
};

const DateRangeField = ({
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

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <input
          type="date"
          value={fromValue}
          onChange={(e) => setFromValue(e.target.value)}
          aria-label={group.ariaLabels?.[0] ?? `${group.label} desde`}
          className="input-base input-ring input-focus rounded-lg ring-stroke-primary w-full min-w-0 bg-white px-3 py-2.5 text-xs leading-4 text-neutral-primary [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:grayscale"
        />
        <span className="px-0.5 text-xs text-neutral-secondary">a</span>
        <input
          type="date"
          value={toValue}
          onChange={(e) => setToValue(e.target.value)}
          aria-label={group.ariaLabels?.[1] ?? `${group.label} hasta`}
          className="input-base input-ring input-focus rounded-lg ring-stroke-primary w-full min-w-0 bg-white px-3 py-2.5 text-xs leading-4 text-neutral-primary [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:grayscale"
        />
      </div>
    </div>
  );
};

const RangeGroupField = ({
  group,
  searchParams,
  setParam,
}: {
  group: RangeGroup;
  searchParams: ReadonlyURLSearchParams;
  setParam: (key: string, value: string) => void;
}) =>
  group.type === "date-range" ? (
    <DateRangeField group={group} searchParams={searchParams} setParam={setParam} />
  ) : (
    <NumberRangeField group={group} searchParams={searchParams} setParam={setParam} />
  );

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

  const setMultiParam = (param: string, values: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    const aiKey = `ai__${param}`;
    params.delete(aiKey);
    params.delete(param);
    if (values.length === 1) {
      params.set(param, values[0]);
    } else if (values.length > 1) {
      params.set(aiKey, values.join(","));
    }
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  const getSingleValue = (group: SelectGroup): string => {
    return searchParams.get(group.param) ?? "";
  };

  const getMultiValues = (group: SelectGroup): string[] => {
    const ai = searchParams.get(`ai__${group.param}`);
    if (ai) return ai.split(",").filter(Boolean);
    const single = getSingleValue(group);
    return single ? [single] : [];
  };

  const orderingParam = orderingConfig?.paramName ?? "ordering";
  const ordering = searchParams.get(orderingParam) ?? "";

  const rawIsDesc = ordering.startsWith("-");
  const rawField = rawIsDesc ? ordering.slice(1) : ordering;
  const allowedFields = new Set((orderingConfig?.options ?? []).map((o) => o.value));
  const orderingField = allowedFields.has(rawField) ? rawField : "";
  const isDesc = orderingField ? rawIsDesc : true;

  const orderingItems = toItems(orderingConfig?.options ?? []);
  const orderingSelected = orderingItems.find((i) => String(i.id) === orderingField) ?? null;
  const orderingPlaceholder = getPlaceholder(orderingConfig?.options ?? []);

  const groupCount = (g: FilterGroup): number =>
    g.type === "select"
      ? g.multiple
        ? getMultiValues(g).length
        : getSingleValue(g)
          ? 1
          : 0
      : (searchParams.get(`${g.base}__gte`) ? 1 : 0) +
        (searchParams.get(`${g.base}__lte`) ? 1 : 0);

  const activeCount =
    groups.reduce((acc, g) => acc + groupCount(g), 0) +
    (orderingConfig && searchParams.get(orderingParam) ? 1 : 0);

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

  const groupKeys = (g: FilterGroup): string[] =>
    g.type === "select"
      ? [g.param, `ai__${g.param}`]
      : [`${g.base}__gte`, `${g.base}__lte`];

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    const keysToRemove = [
      ...groups.flatMap(groupKeys),
      ...(orderingConfig ? [orderingParam] : []),
      "page",
    ];
    const remaining = Object.fromEntries(
      [...params.entries()].filter(([k]) => !keysToRemove.includes(k))
    );
    router.replace(`?${new URLSearchParams(remaining).toString()}`);
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
              "z-50 flex max-h-[80vh] w-84 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
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
                      <Select
                        items={orderingItems}
                        selected={orderingSelected}
                        setSelected={(next) => setOrderingField(next ? String(next.id) : "")}
                        label="label"
                        placeholder={orderingPlaceholder}
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
                  if (group.multiple) {
                    const items = toItems(group.options);
                    const values = getMultiValues(group);
                    const selected = items.filter((i) => values.includes(String(i.id)));
                    return (
                      <div key={group.param} className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
                        <Select
                          multiple
                          items={items}
                          selected={selected}
                          setSelected={(next) =>
                            setMultiParam(group.param, next.map((i) => String(i.id)))
                          }
                          label="label"
                        />
                      </div>
                    );
                  }
                  const items = toItems(group.options);
                  const selected = items.find((i) => String(i.id) === getSingleValue(group)) ?? null;
                  return (
                    <div key={group.param} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-neutral-secondary">{group.label}</span>
                      <Select
                        items={items}
                        selected={selected}
                        setSelected={(next) => setParam(group.param, next ? String(next.id) : "")}
                        label="label"
                        placeholder={getPlaceholder(group.options)}
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
