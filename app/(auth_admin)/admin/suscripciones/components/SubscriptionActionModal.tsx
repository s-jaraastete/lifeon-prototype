"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { ReactNode } from "react";
import { LuCircleAlert, LuX } from "react-icons/lu";
import clsx from "clsx";

export type SubscriptionActionModalVariant = "primary" | "secondary";

type SubscriptionActionModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
  variant?: SubscriptionActionModalVariant;
  cancelLabel?: string;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  icon?: ReactNode;
  size?: "default" | "wide";
  showCloseButton?: boolean;
  footerLayout?: "full" | "compact-right";
};

const SubscriptionActionModal = ({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
  variant = "primary",
  cancelLabel = "Cancelar",
  isSubmitting = false,
  confirmDisabled = false,
  children,
  icon,
  size = "default",
  showCloseButton = false,
  footerLayout = "full",
}: SubscriptionActionModalProps) => {
  const isPrimary = variant === "primary";
  const Icon = isPrimary ? LuCircleAlert : LuCircleAlert;

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="relative z-120"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 duration-200 ease-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex min-h-full items-center justify-center p-4">
        <DialogPanel
          transition
          className={clsx(
            "w-full overflow-hidden rounded-2xl bg-white shadow-[0_20px_44px_-4px_rgba(0,0,0,0.20)] duration-200 ease-out data-closed:scale-95 data-closed:opacity-0",
            size === "wide" ? "max-w-2xl" : "max-w-md",
          )}
        >
          <div className="flex items-center gap-2 border-b border-stroke-primary px-5 py-4">
            {icon ?? (
              <Icon
                className={clsx(
                  "h-5 w-5 shrink-0",
                  isPrimary ? "text-primary" : "text-secondary",
                )}
                aria-hidden="true"
              />
            )}
            <DialogTitle className="text-base font-medium text-neutral-primary">
              {title}
            </DialogTitle>
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="ml-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-stroke-primary text-neutral-secondary transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Cerrar"
              >
                <LuX size={16} />
              </button>
            )}
          </div>

          <div className="px-5 py-4">
            <div className="text-sm leading-5 text-neutral-secondary">
              {description}
            </div>

            {children && (
              <div className="mt-4">
                {children}
              </div>
            )}
          </div>

          <div
            className={clsx(
              "flex gap-3 px-5 pb-5",
              footerLayout === "compact-right" && "justify-end",
            )}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={clsx(
                "cursor-pointer rounded-lg border border-secondary px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5 disabled:cursor-not-allowed disabled:opacity-50",
                footerLayout === "full" && "flex-1",
              )}
            >
              {cancelLabel}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting || confirmDisabled}
              className={clsx(
                "cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-neutral-300",
                footerLayout === "full" && "flex-1",
                isPrimary
                  ? "bg-primary hover:bg-red-700"
                  : "bg-secondary hover:bg-secondary/90",
              )}
            >
              {isSubmitting ? "Procesando..." : confirmLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default SubscriptionActionModal;
