"use client";

import { type ReactNode } from "react";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

type CheckoutCollapseProps = {
  title: string;
  children: ReactNode;
  active?: boolean;
  onToggle?: () => void;
  completed?: boolean;
  locked?: boolean;
  className?: string;
};

const CheckoutCollapse = ({
  title,
  children,
  active = false,
  onToggle,
  completed = false,
  locked = false,
  className = "",
}: CheckoutCollapseProps) => (
  <Disclosure defaultOpen={active}>
    {() => (
      <div className={`border border-gray-400 rounded-[22px] ${className}`}>
        <DisclosureButton
          onClick={() => onToggle?.()}
          className={`flex w-full justify-between p-7.5 transition rounded-[22px] focus-visible:ring-1 focus-visible:ring-gray ${
            locked
              ? "cursor-default pointer-events-none"
              : "cursor-pointer hover:bg-gray-50"
          }`}
        >
          <span className="text-2xl text-black font-semibold leading-7.5 text-left">
            {title}
          </span>

          <div className="flex items-center gap-2.5">
            <div
              className={`size-5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                completed
                  ? "bg-secondary text-white border-transparent"
                  : "border-2 border-gray-400 bg-transparent"
              }`}
            >
              {completed && <LuCheck size={14} strokeWidth={3} />}
            </div>
            <LuChevronDown
              className={`size-7.5 text-primary-text shrink-0 transition-transform duration-300 ${
                active ? "rotate-180" : "rotate-0"
              }`}
            />
          </div>
        </DisclosureButton>

        <Transition
          show={active}
          enter="transition-[grid-template-rows,opacity] duration-300 ease-in-out"
          enterFrom="grid-rows-[0fr] opacity-0"
          enterTo="grid-rows-[1fr] opacity-100"
          leave="transition-[grid-template-rows,opacity] duration-300 ease-in-out"
          leaveFrom="grid-rows-[1fr] opacity-100"
          leaveTo="grid-rows-[0fr] opacity-0"
        >
          <DisclosurePanel
            static
            className="grid"
          >
            <div className="overflow-hidden">
              <div className="p-7.5 pt-2 text-primary-text">
                {children}
              </div>
            </div>
          </DisclosurePanel>
        </Transition>
      </div>
    )}
  </Disclosure>
);

export default CheckoutCollapse;
