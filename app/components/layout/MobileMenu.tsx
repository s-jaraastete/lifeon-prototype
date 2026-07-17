import { Fragment } from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { LuChevronDown } from "react-icons/lu";
import { ecosystemItems } from "../ModulesEcosystem";

const MobileMenu = ({ isOpen, onClose }: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const pathname = usePathname();

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-900 lg:hidden"
    >
      <TransitionChild
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
      </TransitionChild>

      <TransitionChild
        enter="ease-out duration-400"
        enterFrom="-translate-y-full"
        enterTo="translate-y-0"
        leave="ease-in duration-300"
        leaveFrom="translate-y-0"
        leaveTo="-translate-y-full"
      >
        <div className="fixed inset-0 top-17.5">
          <DialogPanel className="bg-white h-min overflow-y-auto p-4 flex flex-col">
            {/* Menu Links */}
            <div className="flex flex-col text-xl font-medium text-primary-text">
              <Link
                href="/"
                onClick={onClose}
                className={clsx(
                  "border-b border-gray-300 py-5",
                  pathname === "/" && "text-primary",
                )}
              >
                Software
              </Link>

              {/* Módulos Accordion */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <DisclosureButton className="flex justify-between items-center border-b border-gray-300 py-5">
                      Módulos
                      <LuChevronDown
                        className={clsx(
                          "w-5 h-5 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </DisclosureButton>
                    <Transition
                      show={open}
                      as={Fragment}
                      enter="ease-out duration-200"
                      enterFrom="opacity-0 -translate-y-2"
                      enterTo="opacity-100 translate-y-0"
                      leave="ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 -translate-y-2"
                    >
                      <DisclosurePanel
                        static
                        className="flex flex-col gap-4 text-base text-primary-text py-5"
                      >
                        {ecosystemItems.map((item, idx) => (
                          <Link
                            key={idx}
                            href={item.href}
                            onClick={onClose}
                            className={clsx(
                              "flex items-center gap-3",
                              pathname.startsWith("/modulos") && "text-primary",
                            )}
                          >
                            <div
                              className={clsx("p-2 rounded-lg", item.bgColor)}
                            >
                              {item.icon}
                            </div>
                            {item.title}
                            {!item.available && (
                              <span className="text-[10px] text-secondary bg-teal-50 px-2 rounded-full">
                                Próximamente
                              </span>
                            )}
                          </Link>
                        ))}
                      </DisclosurePanel>
                    </Transition>
                  </>
                )}
              </Disclosure>

              {/* Recursos Accordion */}
              <Disclosure>
                {({ open }) => (
                  <>
                    <DisclosureButton className="flex justify-between items-center text-primary-text border-b border-gray-300 py-5">
                      Recursos
                      <LuChevronDown
                        className={clsx(
                          "w-5 h-5 transition-transform",
                          open && "rotate-180",
                        )}
                      />
                    </DisclosureButton>
                    <Transition
                      show={open}
                      as={Fragment}
                      enter="ease-out duration-200"
                      enterFrom="opacity-0 -translate-y-2"
                      enterTo="opacity-100 translate-y-0"
                      leave="ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 -translate-y-2"
                    >
                      <DisclosurePanel
                        static
                        className="text-base text-primary-text py-5"
                      />
                    </Transition>
                  </>
                )}
              </Disclosure>

              <Link
                href="/contacto"
                onClick={onClose}
                className={clsx(
                  "py-5",
                  pathname === "/contacto" && "text-primary",
                )}
              >
                Contacto
              </Link>
            </div>

            {/* Footer Close */}
            <button
              onClick={onClose}
              className="mt-auto self-end text-sm text-primary-text mb-4"
            >
              CERRAR
            </button>
          </DialogPanel>
        </div>
      </TransitionChild>
    </Dialog>
  );
};

export default MobileMenu;
