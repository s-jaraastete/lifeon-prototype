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
  active?: boolean;
};

type SidebarProps = {
  collapsed: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LuHouse, active: true },
  { label: "Usuarios", href: "/admin", icon: LuUsers },
  { label: "Suscripciones", href: "/admin", icon: LuBadgeCheck },
  { label: "Pagos", href: "/admin", icon: LuCreditCard },
  { label: "Módulos", href: "/admin", icon: LuLayoutGrid },
  { label: "Estado plataforma", href: "/admin", icon: LuBatteryFull },
  { label: "Configuración", href: "/admin", icon: LuSettings },
];

export default function SidebarMenu({ collapsed }: SidebarProps) {
  return (
    <aside
      className="flex h-full min-h-[calc(100vh-2rem)] flex-col p-3 rounded-2xl bg-surface-primary transition-all duration-300"
    >
      <div
        className={clsx("flex items-center gap-3 py-1.5 h-10", {
          "justify-center lg:flex-col": collapsed,
          "justify-between": !collapsed,
        })}
      >
        <Link
          href="/admin"
          className={clsx("font-semibold leading-tight", {
            "text-2xl": collapsed,
            "text-3xl": !collapsed,
          })}
        >
          {collapsed ? (
            <span>
              <span className="text-primary">L</span>
              <span className="text-secondary font-bold">O</span>
            </span>
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

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 w-full text-base transition-colors",
                {
                  "lg:p-3": collapsed,
                  "font-medium text-primary": item.active,
                  "text-neutral-primary hover:font-medium hover:bg-surface-tertiary": !item.active,
                },
              )}
            >
              <Icon
                className={clsx("h-5 w-5", {
                  "text-primary": item.active,
                  "text-neutral-primary": !item.active,
                })}
              />
              <span
                className={clsx("whitespace-nowrap", {
                  "lg:hidden": collapsed,
                  inline: !collapsed,
                })}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-center text-xs text-neutral-tertiary">
        V.2.0.0
      </div>
    </aside>
  );
}
