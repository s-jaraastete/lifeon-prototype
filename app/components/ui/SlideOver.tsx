import { ReactNode } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import { LuX } from "react-icons/lu";

type SlideOverSize = "w-90" | "w-150" | "w-200";

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  size?: SlideOverSize;
}

const slideTransition = {
  enter: "ease-out duration-300",
  enterFrom: "translate-x-full",
  enterTo: "translate-x-0",
  leave: "ease-in duration-200",
  leaveFrom: "translate-x-0",
  leaveTo: "translate-x-full",
};

const SlideOver = ({
  open,
  onClose,
  title,
  children,
  size = "w-150",
}: SlideOverProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-110"
    >
      <TransitionChild {...slideTransition}>
        <div className="fixed inset-y-0 right-0 flex">
          <DialogPanel
            className={clsx(
              "flex h-full flex-col bg-white rounded-l-2xl shadow-[0_20px_44px_-4px_rgba(0,0,0,0.20)]",
              size
            )}
          >
            <div className="flex items-center justify-between p-6.25 pb-1">
              <DialogTitle className="text-base font-medium text-neutral-primary">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar panel"
                className={clsx(
                  "rounded-lg border border-stroke-primary p-1.5 text-neutral-secondary",
                  "cursor-pointer transition-colors hover:bg-surface-tertiary hover:text-secondary",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                )}
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6.25 py-5">
              {children}
            </div>
          </DialogPanel>
        </div>
      </TransitionChild>
    </Dialog>
  );
};

export default SlideOver;