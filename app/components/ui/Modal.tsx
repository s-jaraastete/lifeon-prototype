import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import React, { ReactNode } from "react";
import { LuX } from "react-icons/lu";


interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  sizeClass?: string;
  zIndex?: string;
  showCloseButton?: boolean;
  height?: string;
}

const Modal = ({
  open,
  onClose,
  children,
  sizeClass,
  zIndex = "z-110",
  showCloseButton = true,
  height = "items-center",
}: ModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className={`relative focus:outline-hidden ${zIndex}`}
    >
      <DialogBackdrop
        transition
        className="ease-out data-closed:opacity-0 duration-200 fixed inset-0 bg-black opacity-40"
      />

      <div className="fixed inset-0">
        <div className={`flex min-h-full justify-center p-4 ${height}`}>
          <DialogPanel
            transition
            className={`bg-white flex items-center justify-center duration-300 data-closed:ease-out data-closed:scale-95 data-closed:opacity-0 overflow-y-auto w-full transform rounded-2xl
            text-left align-middle shadow-xl transition-all ${sizeClass}`}
          >
            <div className="flex flex-col w-full p-10">
              {showCloseButton && (
                <div className="flex justify-end items-center w-full p-1.5 h-6">
                  <button onClick={onClose}>
                    <LuX size={24} />
                  </button>
                </div>
              )}

              {children}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
