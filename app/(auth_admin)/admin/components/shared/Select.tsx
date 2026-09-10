"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { LuCheck, LuChevronDown, LuX } from "react-icons/lu";
import clsx from "clsx";
import { MouseEvent, ReactNode } from "react";

type IDRequiredObjectInterface = {
  id: number | string;
};

type SingleSelectProps<T extends IDRequiredObjectInterface> = {
  multiple?: never | false;
  selected: T | null;
  setSelected: (value: T | null) => void;
};

type MultipleSelectProps<T extends IDRequiredObjectInterface> = {
  multiple: true;
  selected: T[];
  setSelected: (value: T[]) => void;
};

type SelectProps<T extends IDRequiredObjectInterface> = (
  | MultipleSelectProps<T>
  | SingleSelectProps<T>
) & {
  items: T[];
  label: keyof T | ((value: T) => string);
  placeholder?: string;
  afterChange?: () => void;
  disabled?: boolean;
  item?: (value: T) => ReactNode;
};

const Select = <T extends IDRequiredObjectInterface>(
  props: SelectProps<T>
) => {
  const getItemLabel = (item: T) =>
    typeof props.label === "function"
      ? props.label(item)
      : String(item[props.label ?? "id"]);

  const hasSelection = props.multiple
    ? props.selected.length > 0
    : props.selected !== null;

  const handleChange = (
    newValue: typeof props.multiple extends true ? T[] : T | null
  ) => {
    if (props.multiple) {
      props.setSelected(newValue as unknown as T[]);
    } else {
      props.setSelected(newValue);
    }
    props.afterChange?.();
  };

  const handleClear = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (props.disabled) return;
    if (props.multiple) {
      props.setSelected([]);
    } else {
      props.setSelected(null);
    }
    props.afterChange?.();
  };

  return (
    <Listbox
      value={props.selected as typeof props.multiple extends true ? T[] : T | null}
      onChange={handleChange}
      multiple={props.multiple}
      disabled={props.disabled}
    >
      <ListboxButton
        as="div"
        className={clsx(
          "group relative flex w-full cursor-pointer items-center gap-2 rounded-lg bg-white text-left text-sm leading-4 ring-1 ring-stroke-primary transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-secondary",
          "px-3 py-2.5 max-h-9",
          "data-open:ring-2 data-open:ring-secondary",
          "data-disabled:cursor-not-allowed data-disabled:bg-gray-100 data-disabled:text-neutral-disabled data-disabled:ring-stroke-primary",
        )}
      >
        {props.multiple ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {hasSelection ? (
              props.selected.map((item) => (
                <span
                  key={`multiple-item-${String(props.label ?? "id")}-${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-secondary-100 px-1.5 py-0.5 text-[10px] font-medium leading-[18px] text-secondary-500"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) => event.stopPropagation()}
                >
                  {getItemLabel(item)}
                  <button
                    type="button"
                    className="flex size-3 shrink-0 items-center justify-center"
                    onClick={() =>
                      props.setSelected(
                        props.selected.filter((sItem) => sItem.id !== item.id)
                      )
                    }
                    aria-label={`Quitar ${getItemLabel(item)}`}
                  >
                    <LuX className="size-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-neutral-tertiary">
                {props.placeholder ?? "Seleccione"}
              </span>
            )}
          </div>
        ) : (
          <span
            className={clsx(
              "min-w-0 flex-1 truncate",
              props.selected ? "text-neutral-primary" : "text-neutral-tertiary"
            )}
          >
            {props.selected ? getItemLabel(props.selected) : props.placeholder ?? "Seleccione"}
          </span>
        )}
        {hasSelection && !props.disabled ? (
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center text-gray-700 hover:text-neutral-primary"
            onMouseDown={(event) => event.preventDefault()}
            onClick={handleClear}
            aria-label="Limpiar selección"
          >
            <LuX className="size-4" />
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden="true" />
        )}
        <LuChevronDown
          className="size-4 shrink-0 text-gray-700 transition-transform group-data-open:rotate-180 group-data-disabled:text-neutral-disabled"
          aria-hidden="true"
        />
      </ListboxButton>
      <ListboxOptions
        anchor={{ to: "bottom", gap: 6, padding: 6 }}
        transition
        className={clsx(
          "z-50 flex w-(--button-width) origin-top flex-col gap-0.5 overflow-x-hidden overflow-y-auto rounded-lg bg-white p-1.5",
          "text-sm text-neutral-primary shadow-[0_6px_8px_rgba(0,0,0,0.1)]",
          "[--anchor-max-height:15rem] focus:outline-none",
          "transition duration-100 ease-out data-leave:data-closed:opacity-0"
        )}
      >
        {props.items.map((item) => (
          <ListboxOption
            key={`listbox-option-${item.id}`}
            value={item}
            className={clsx(
              "group flex w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm leading-4 text-neutral-primary select-none",
              "data-focus:bg-gray-100 data-selected:bg-secondary-50 data-selected:text-secondary-600"
            )}
          >
            {props.multiple && (
              <span
                className="flex size-4 shrink-0 items-center justify-center rounded border border-gray-400 bg-white transition-colors group-data-selected:border-secondary group-data-selected:bg-secondary"
                aria-hidden="true"
              >
                <LuCheck className="invisible size-3 text-white group-data-selected:visible" />
              </span>
            )}
            <div className="min-w-0 flex-1 wrap-break-words">
              {props.item ? props.item(item) : getItemLabel(item)}
            </div>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

export default Select;
