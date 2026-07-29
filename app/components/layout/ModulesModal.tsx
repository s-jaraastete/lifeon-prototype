"use client";

import React from "react";
import Link from "next/link";
import Modal from "../ui/Modal";

// Icons
import { LuLock, LuChevronRight } from "react-icons/lu";
import { ecosystemItems } from "../ModulesEcosystem";

interface EcosystemProps {
  open: boolean;
  onClose: () => void;
  isHome: boolean;
}

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
            <h6 className="text-2xl text-base-black font-medium">
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
                      item.icon()
                    ) : (
                      <>
                        <span className="block group-hover:hidden">{item.icon()}</span>
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
                    <div className="flex items-center gap-2 max-w-65">
                      <p className={`text-lg font-medium ${item.textColor}`}>
                        {item.title}
                      </p>
                      {item.chipText && (
                        <span className="text-[10px] font-medium bg-[#DBEAFE] text-[#155DFC] px-1.5 py-0.5 rounded-lg">
                          IA
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${!item.available ? "text-secondary-text" : "text-primary-text"}`}>
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
