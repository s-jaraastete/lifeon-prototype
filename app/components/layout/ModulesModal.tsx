"use client";

import React from "react";
import Link from "next/link";
import Modal from "../ui/Modal";

// Icons
import { LuBotMessageSquare, LuFileSearch2, LuRefreshCcw, LuSearch, LuTable, LuLock, LuChevronRight } from "react-icons/lu";


interface EcosystemProps {
  open: boolean;
  onClose: () => void;
  isHome: boolean;
}

const ecosystemItems = [
  {
    icon: <LuTable size={24} className="text-black" />,
    title: "MIPER",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-purple-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuFileSearch2 size={24} className="text-black" />,
    title: "Control documental",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-sky-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuBotMessageSquare size={24} className="text-black" />,
    title: "APR Virtual",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-[rgb(0,199,189)]",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuRefreshCcw size={24} className="text-gray-700" />,
    title: "Gestión del cambio",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: <LuSearch size={24} className="text-gray-700" />,
    title: "Módulo 5",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: <LuSearch size={24} className="text-gray-700" />,
    title: "Módulo 6",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
];

const ModulesModal = ({ open, onClose, isHome }: EcosystemProps) => {
  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        showCloseButton={false}
        sizeClass="max-w-[1230px]"
        height={`items-start ${isHome ? "pt-30" : "pt-[90px]"}`}
      >
        <div>
          <div className="flex items-center justify-between mb-7.5">
            <h6 className="text-2xl text-black font-medium">
              Módulos LifeOn
            </h6>
            <Link href="/modulos/" onClick={onClose} className="text-lg text-secondary transition hover:text-teal-700">
              Ver todo
              <LuChevronRight size={20} className="inline-block ml-1 mb-0.5" />
            </Link>
          </div>
          
          <div className="grid grid-cols-3 gap-5.5">
            {ecosystemItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={onClose}
                className={`group flex flex-col gap-2.5 p-5 rounded-xl transition-colors 
                  ${item.available ? "hover:bg-gray-200 cursor-pointer" : "cursor-not-allowed"}`}
              >
                <div className="flex items-start justify-center gap-4">
                  <div className={`flex items-center gap-2.5 p-4 mt-1 rounded-2xl justify-center ${item.bgColor}`}>
                    {item.available ? (
                      item.icon
                    ) : (
                      <>
                        <span className="block group-hover:hidden">{item.icon}</span>
                        <LuLock size={24} className="hidden group-hover:block text-gray-700" />
                      </>
                    )}
                  </div>
                  <div>
                    {!item.available && (
                      <span className="text-xs text-secondary bg-teal-50 px-3 rounded-full">
                        Próximamente disponible
                      </span>
                    )}
                    <p className={`text-lg font-medium ${item.textColor}`}>
                      {item.title}
                    </p>
                    <p className={`text-sm leading-relaxed ${item.textColor}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModulesModal;
