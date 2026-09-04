import Link from "next/link";
import type { IconType } from "react-icons";
import {
  LuHouse,
  LuUsers,
  LuBadgeCheck,
  LuCreditCard,
  LuLayoutGrid,
  LuBatteryFull,
  LuSettings,
} from "react-icons/lu";
import clsx from "clsx";

type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

type SidebarProps = {
  collapsed: boolean;
  pathname: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LuHouse },
  { label: "Usuarios", href: "/admin/usuarios", icon: LuUsers },
  { label: "Suscripciones", href: "/admin/suscripciones", icon: LuBadgeCheck },
  { label: "Facturación", href: "/admin/facturacion", icon: LuCreditCard },
  { label: "Módulos", href: "/admin/modulos", icon: LuLayoutGrid },
  { label: "Estado plataforma", href: "/admin/estado-plataforma", icon: LuBatteryFull },
  { label: "Configuración", href: "/admin/configuracion", icon: LuSettings },
];

export default function SidebarMenu({ collapsed, pathname }: SidebarProps) {
  return (
    <aside
      className="flex h-[calc(100vh-1.5rem)] flex-col p-3.5 rounded-2xl bg-surface-primary top-3 sticky"
    >
      <div
        className={clsx("flex items-center gap-3 py-1.5 h-10", {
          "justify-center max-w-11": collapsed,
          "justify-between": !collapsed,
        })}
      >
        <Link
          href={process.env.NEXT_PUBLIC_LANDING_URL || "/"}
          className={clsx("font-semibold leading-tight", {
            "text-2xl": collapsed,
            "text-3xl": !collapsed,
          })}
        >
          {collapsed ? (
            <>
              <span className="text-primary">L</span>
              <span className="text-secondary font-bold">O</span>
            </>
          ) : (
            <>
              <span className="text-primary">Life</span>
              <span className="text-secondary font-bold">On</span>
            </>
          )}
        </Link>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-2.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === pathname;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "group relative inline-flex rounded-lg px-3 py-2.5 w-full text-base transition-colors duration-300",
                {
                  "lg:p-3 w-min": collapsed,
                  "font-medium text-primary": isActive,
                  "bg-red-100": collapsed && isActive,
                  "text-neutral-primary hover:font-medium hover:bg-surface-tertiary": !isActive,
                },
              )}
            >
              <div className="inline-flex items-center gap-2">
                <Icon
                  className={clsx("h-5 w-5", {
                    "text-primary": isActive,
                    "text-neutral-primary": !isActive,
                    "group-hover:text-primary": !isActive && collapsed,
                  })}
                />
                <span
                  className={clsx("whitespace-nowrap", {
                    "lg:hidden": collapsed,
                  })}
                >
                  {item.label}
                </span>
              </div>
              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <span
                  className={clsx(
                    "pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2",
                    "whitespace-nowrap rounded-lg bg-gray-300 px-2 py-0.5",
                    "text-xs leading-5 text-neutral-primary",
                    "opacity-0 transition-opacity duration-150",
                    "group-hover:opacity-100 group-hover:delay-500",
                    "before:absolute before:right-full before:top-1/2 before:-translate-y-1/2",
                    "before:border-y-[5px] before:border-y-transparent",
                    "before:border-r-[5px] before:border-r-grey-300",
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-center text-xs text-neutral-tertiary">
        V.1.0.0
      </div>
    </aside>
  );
}
