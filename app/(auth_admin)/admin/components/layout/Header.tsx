import Image from "next/image";
import {
  LuBell,
  LuPanelLeftClose,
  LuPanelRightClose,
  LuSearch,
} from "react-icons/lu";
import TextInput from "@/app/components/ui/TextInput";

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
          <div className="relative flex-1 xl:max-w-md">
            <LuSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-tertiary z-10" />
            <TextInput
              type="search"
              placeholder="¿Qué quieres buscar hoy?..."
              className="h-10 rounded-lg bg-white ring-stroke-primary pl-11 pr-3 text-neutral-primary placeholder:text-neutral-tertiary"
            />
          </div>

          <button
            type="button"
            aria-label="Notificaciones"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg cursor-pointer ring-1 ring-stroke-primary bg-white text-neutral-secondary transition hover:bg-surface-tertiary hover:text-secondary"
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
