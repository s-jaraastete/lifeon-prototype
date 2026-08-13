import Image from "next/image";
import {
  LuBell,
  LuPanelLeftClose,
  LuPanelRightClose,
  LuSearch,
} from "react-icons/lu";

type HeaderProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function Header({ collapsed, onToggle }: HeaderProps) {
  return (
    <header className="rounded-2xl bg-surface-primary px-5 py-2.5 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Abrir navegación"
            aria-expanded={!collapsed}
            onClick={onToggle}
            className={`
              inline-flex items-center justify-center
              h-10 w-10 rounded-lg border border-stroke-primary
              bg-white text-neutral-secondary cursor-pointer
              transition hover:text-secondary hover:bg-surface-secondary
            `}
          >
            {collapsed ? (
              <LuPanelRightClose className="h-6 w-6" />
            ) : (
              <LuPanelLeftClose className="h-6 w-6" />
            )}
          </button>

          <span className="rounded-lg bg-grey-300 px-1.5 py-1 text-[10px] font-medium text-neutral-primary">
            Admin
          </span>
        </div>

        <div className="flex flex-1 items-center gap-3 xl:max-w-2xl xl:justify-end">
          <label className="relative flex-1 xl:max-w-md">
            <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              placeholder="¿Qué quieres buscar hoy?..."
              className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-neutral-primary outline-none transition placeholder:text-gray-500 focus:border-primary/30 focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <button
            type="button"
            aria-label="Notificaciones"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg cursor-pointer border border-stroke-primary bg-white text-neutral-secondary transition hover:bg-surface-tertiary hover:text-secondary"
          >
            <LuBell className="h-6 w-6" />
            {/* <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" /> */}
          </button>

          <button
            type="button"
            aria-label="Perfil"
            className="relative cursor-pointer inline-flex h-8 w-8 items-center justify-center"
          >
            <Image
              src="/svg/avatar.svg"
              alt="Avatar"
              fill
            />
          </button>
        </div>
      </div>
    </header>
  );
}
