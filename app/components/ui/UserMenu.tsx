"use client";

import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { LuUserPlus, LuLogOut } from "react-icons/lu";
import { signOut, useSession } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.assign("/");
  };

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <MenuButton className="relative cursor-pointer flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full outline-none">
            <Image
              src="/svg/avatar.svg"
              alt="Avatar"
              fill
            />
          </MenuButton>

          <Transition
            show={open}
            enter="transition duration-200 ease-out"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition duration-150 ease-in"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <MenuItems
              className="absolute right-0 mt-3 w-71 origin-top-right flex flex-col gap-3 rounded-xl bg-white p-3.75 shadow-lg ring-1 ring-black/5 focus:outline-none z-50"
              modal={false}
            >
              <MenuItem>
                <Link
                  href="/admin"
                  className="flex items-center gap-2.5 w-full cursor-pointer text-neutral-primary data-focus:text-secondary 
                  transition-colors duration-200 rounded-lg py-1.5 hover:bg-grey-100"
                >
                  <div className="relative h-8 w-8">
                    <Image
                      src="/svg/avatar.svg"
                      alt="Avatar"
                      fill
                    />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-primary leading-tight">
                      {session?.user?.name || session?.user?.username }
                    </p>
                    {session?.user?.email && (
                      <p className="text-sm text-neutral-secondary leading-tight">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </Link>
              </MenuItem>

              <div className="border-t border-stroke" />

              <MenuItem>
                <Link
                  href="/admin/mi-cuenta"
                  className="flex items-center py-1.5 px-3 leading-tight text-neutral-secondary data-focus:text-neutral-primary transition-colors"
                >
                  Mi cuenta
                </Link>
              </MenuItem>
              <MenuItem>
                <Link
                  href="/admin/descargas"
                  className="flex items-center py-1.5 px-3 leading-tight text-neutral-secondary data-focus:text-neutral-primary transition-colors"
                >
                  Descargas
                </Link>
              </MenuItem>

              <div className="border-t border-stroke" />

              <MenuItem>
                <button
                  type="button"
                  className="flex w-full items-center py-1.5 px-3 gap-1.5 leading-tight text-neutral-secondary data-focus:text-neutral-primary transition-colors cursor-pointer"
                >
                  <LuUserPlus className="h-5 w-5" />
                  Agregar otra cuenta
                </button>
              </MenuItem>

              <MenuItem>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center py-1.5 px-3 gap-1.5 leading-tight text-red-error-600 data-focus:text-red-error-700 transition-colors cursor-pointer"
                >
                  <LuLogOut className="h-5 w-5" />
                  Cerrar sesión
                </button>
              </MenuItem>

              <div className="mt-2 text-xs text-center text-neutral-tertiary">
                <span>v.2.0.0</span>
                <span>{" "}•{" "}</span>
                <Link
                  href="/terminos-de-uso"
                  className="transition-colors hover:text-neutral-secondary hover:underline"
                >
                  Términos y condiciones
                </Link>
                <span>{" "}•{" "}</span>
                <Link
                  href="/politica-de-privacidad"
                  className="transition-colors hover:text-neutral-secondary hover:underline"
                >
                  Política de Privacidad
                </Link>
                <span>{" "}•{" "}</span>
                <Link
                  href="/contacto"
                  className="transition-colors hover:text-neutral-secondary hover:underline"
                >
                  Más información
                </Link>
              </div>
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  );
}
