"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuArrowDown, LuArrowUp, LuChevronDown, LuEraser, LuListFilter } from "react-icons/lu";
import clsx from "clsx";

const planOptions = [
  { value: "", label: "Todos" },
  { value: "Starter", label: "Starter" },
  { value: "Business", label: "Business" },
  { value: "Free", label: "Free" },
  { value: "Customizado", label: "Customizado" },
];

const cycleOptions = [
  { value: "", label: "Todos" },
  { value: "monthly", label: "Mensual" },
  { value: "yearly", label: "Anual" },
];

const orderingFieldOptions = [
  { value: "", label: "Por defecto" },
  { value: "company__name", label: "Cliente" },
  { value: "mrr_clp", label: "MRR" },
  { value: "created", label: "Fecha creación" },
  { value: "next_billing_at", label: "Fecha renovación" },
];

const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-base input-ring input-focus w-full appearance-none bg-white pr-8 text-sm leading-6 text-neutral-primary cursor-pointer"
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

const FilterDropdown = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = searchParams.get("pack_name_snapshot") ?? searchParams.get("plan") ?? "";
  const billingPeriod = searchParams.get("billing_period") ?? "";
  const ordering = searchParams.get("ordering") ?? "";

  const rawIsDesc = ordering.startsWith("-");
  const rawField = rawIsDesc ? ordering.slice(1) : ordering;
  const legacyMap: Record<string, string> = {
    client_name: "company__name",
    pack_name_snapshot: "",
    pack_name: "",
    billing_period: "",
    status: "",
    id: "",
  };
  const mappedField = rawField in legacyMap ? legacyMap[rawField] : rawField;
  const allowedFields = new Set(orderingFieldOptions.map((o) => o.value));
  const orderingField = allowedFields.has(mappedField) ? mappedField : "";
  // API default is -created (más reciente primero). For "Por defecto" we show
  // desc (down) and keep button enabled so user can flip to asc.
  const isDesc = orderingField ? rawIsDesc : true;

  const activeCount = [plan, billingPeriod, orderingField].filter(Boolean).length;

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`?${params.toString()}`);
  };

  const setOrderingField = (field: string) => {
    if (!field) {
      setParam("ordering", "");
      return;
    }
    const defaultDesc = ["created", "next_billing_at", "mrr_clp"].includes(field);
    setParam("ordering", defaultDesc ? `-${field}` : field);
  };

  const toggleOrderingDirection = () => {
    if (!orderingField) {
      // "Por defecto" is -created; toggle to created (más antiguo primero)
      setParam("ordering", isDesc ? "created" : "-created");
      return;
    }
    setParam("ordering", isDesc ? orderingField : `-${orderingField}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pack_name_snapshot");
    params.delete("plan"); // legacy, in case URL contains old param
    params.delete("billing_period");
    params.delete("ordering");
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
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-1",
              open || activeCount > 0
                ? "border-secondary text-secondary"
                : "border-gray-300 text-gray-800 hover:bg-gray-100"
            )}
          >
            <LuListFilter className="h-4 w-4 shrink-0 text-secondary" />
            <span>Filtros</span>
            {activeCount > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-bold leading-none text-white">
                {activeCount}
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
              "z-50 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]",
              "flex flex-col gap-3",
              "origin-top transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0"
            )}
          >
            <div className="flex items-center gap-1.5 text-body-sm font-semibold text-neutral-primary">
              <LuListFilter className="h-4 w-4 text-secondary" />
              Filtros
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-secondary">Ordenar por</span>
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <FilterSelect
                    value={orderingField}
                    onChange={setOrderingField}
                    options={orderingFieldOptions}
                    placeholder="Por defecto"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleOrderingDirection}
                  aria-label={isDesc ? "Descendente: mayor/más reciente primero" : "Ascendente: menor/más antiguo primero"}
                  title={isDesc ? "Descendente" : "Ascendente"}
                  className={clsx(
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border bg-white cursor-pointer transition-colors",
                    "border-gray-300 text-secondary hover:bg-teal-50 hover:border-secondary",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  )}
                >
                  {isDesc ? <LuArrowDown className="h-4 w-4" /> : <LuArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-secondary">Plan</span>
              <FilterSelect
                value={plan}
                onChange={(v) => setParam("pack_name_snapshot", v)}
                options={planOptions}
                placeholder="Todos"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-secondary">Ciclo</span>
              <FilterSelect
                value={billingPeriod}
                onChange={(v) => setParam("billing_period", v)}
                options={cycleOptions}
                placeholder="Todos"
              />
            </div>

            <button
              type="button"
              onClick={clearAll}
              className={clsx(
                "mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-secondary bg-white px-3 py-2",
                "text-sm font-medium text-secondary transition-colors hover:bg-teal-50 cursor-pointer",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              )}
            >
              <LuEraser className="h-4 w-4" />
              Limpiar filtros
            </button>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default FilterDropdown;
