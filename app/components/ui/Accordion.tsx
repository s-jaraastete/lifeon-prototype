"use client";

import React, { useState } from "react";

// Icons
import { LuChevronDown } from "react-icons/lu";


interface AccordionItem {
  title: string;
  content: React.ReactNode;
  description?: string;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  className?: string;
  onOpenChange?: (index: number | null) => void;
}

const Accordion = ({ items, className, onOpenChange }: AccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    const newIndex = openIndex === index ? null : index;
    setOpenIndex(newIndex);
    onOpenChange?.(newIndex);
  };

  return (
    <div className={`flex flex-col gap-2.5 ${className || ""}`}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="border border-gray-300 rounded-3xl transition-all duration-200"
          >
            <div
              onClick={() => toggleAccordion(index)}
              className="flex items-center justify-between w-full p-4 rounded-3xl cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col text-left">
                <h3 className={`text-base lg:text-lg text-primary-text ${isOpen ? "font-medium text-base-black" : "font-normal"}`}>
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm lg:text-base text-primary-text">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.actionButton && (
                  <div onClick={(e) => e.stopPropagation()}>
                    {item.actionButton}
                  </div>
                )}
                {item.icon && <div className="shrink-0">{item.icon}</div>}
                <LuChevronDown
                  className={`w-5 h-5 text-primary transform transition-transform duration-300 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>
            </div>

            {/* contenido del accordion con animacion suave, no se puede animar con h-auto, tiene que tener una medida fija*/}
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                isOpen ? "max-h-[2000px] rounded-3xl" : "max-h-0"
              }`}
            >
              <div className="border-t border-gray-100 bg-white p-4 text-primary-text text-sm lg:text-base">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Accordion;
