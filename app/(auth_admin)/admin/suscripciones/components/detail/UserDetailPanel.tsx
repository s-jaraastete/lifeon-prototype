"use client";

import SlideOver from "@/app/components/ui/SlideOver";
import { Subscription } from "@/types/admin";
// Icons
import { LuCircleOff, LuEllipsis, LuPencilLine, LuUserRound } from "react-icons/lu";


type UserDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
  className?: string;
};

const DetailRow = ({ label, value, className = "" }: DetailRowProps) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <span className="text-xs text-neutral-secondary">{label}</span>
    <span className="text-sm font-medium text-neutral-primary">{value}</span>
  </div>
);

const PanelTitle = (
  <div className="flex items-center gap-2.5">
    <LuUserRound className="h-4.5 w-4.5 text-secondary" />
    Detalles del usuario
  </div>
);

const UserDetailPanel = ({
  open,
  subscription,
  onClose,
}: UserDetailPanelProps) => {
  const isOpen = open && subscription !== null;

  return (
    <SlideOver
      open={isOpen}
      onClose={onClose}
      title={PanelTitle}
      size="w-150"
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 pt-1 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <LuUserRound className="h-10 w-10 text-white" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-medium text-neutral-primary">
                Carlos Mora
              </h2>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Activo
              </span>
            </div>
            <p className="text-base text-neutral-secondary">
              Administrador de cuenta
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex flex-1 items-center cursor-pointer justify-center gap-1.5 rounded-lg border border-secondary px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/5"
          >
            <LuPencilLine className="h-4 w-4" />
            Editar
          </button>
          <button
            type="button"
            className="flex flex-1 items-center cursor-pointer justify-center gap-1.5 rounded-lg border border-red-500 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LuCircleOff className="h-4 w-4" />
            Suspender
          </button>
          <button
            type="button"
            aria-label="Más acciones de usuario"
            className="rounded-lg border border-stroke-primary cursor-pointer p-2 text-neutral-secondary transition-colors hover:bg-surface-tertiary hover:text-secondary"
          >
            <LuEllipsis className="h-5 w-5" />
          </button>
        </div>

        <section className="rounded-xl border border-stroke bg-white p-4">
          <h3 className="text-lg font-medium text-neutral-primary">
            Información de contacto y perfil
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <DetailRow label="Correo electrónico" value="cmora@minerandina.cl" />
            <DetailRow label="Teléfono" value="934344545" />
            <DetailRow
              label="Tipo de usuario"
              value="Organización (B2B)"
              className="col-span-2"
            />
          </div>
        </section>

        <section className="rounded-xl border border-stroke bg-white p-4">
          <h3 className="text-lg font-medium text-neutral-primary">
            Organización y rol
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <DetailRow label="Organización" value="Minera Andina S.A." />
            <DetailRow label="Rol" value="Administrador de cuenta" />
            <DetailRow label="Plan vinculado" value="Business" />
          </div>
        </section>

        <section className="rounded-xl border border-stroke bg-white p-4">
          <h3 className="text-lg font-medium text-neutral-primary">
            Actividad y seguridad
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <DetailRow label="Último acceso" value="Hoy, 10:42 horas" />
            <DetailRow label="Fecha de registro" value="15 de mayo de 2026" />
            <DetailRow
              label="2FA (Segundo factor de autenticación)"
              value="Habilitado"
              className="col-span-2"
            />
          </div>
        </section>
      </div>
    </SlideOver>
  );
};

export default UserDetailPanel;
