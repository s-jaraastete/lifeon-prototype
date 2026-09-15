"use client";

import { LuCircleOff, LuEllipsis, LuPencilLine, LuUserRound } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import DetailPanel, {
  DetailActions,
  DetailSectionList,
  type DetailSectionConfig,
} from "@/app/(auth_admin)/admin/components/shared/detail/DetailPanel";

type UserDetailPanelProps = {
  open: boolean;
  subscription: Subscription | null;
  onClose: () => void;
};

const PanelTitle = (
  <div className="flex items-center gap-2.5">
    <LuUserRound className="h-4.5 w-4.5 text-secondary" />
    Detalles del usuario
  </div>
);

const sections: DetailSectionConfig[] = [
  {
    title: "Información de contacto y perfil",
    rows: [
      { label: "Correo electrónico", value: "cmora@minerandina.cl" },
      { label: "Teléfono", value: "934344545" },
      {
        label: "Tipo de usuario",
        value: "Organización (B2B)",
        className: "col-span-2",
      },
    ],
  },
  {
    title: "Organización y rol",
    rows: [
      { label: "Organización", value: "Minera Andina S.A." },
      { label: "Rol", value: "Administrador de cuenta" },
      { label: "Plan vinculado", value: "Business" },
    ],
  },
  {
    title: "Actividad y seguridad",
    rows: [
      { label: "Último acceso", value: "Hoy, 10:42 horas" },
      { label: "Fecha de registro", value: "15 de mayo de 2026" },
      {
        label: "2FA (Segundo factor de autenticación)",
        value: "Habilitado",
        className: "col-span-2",
      },
    ],
  },
];

const UserDetailPanel = ({ open, onClose }: UserDetailPanelProps) => (
  <DetailPanel open={open} onClose={onClose} title={PanelTitle}>
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

    <DetailActions>
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
    </DetailActions>

    <DetailSectionList sections={sections} />
  </DetailPanel>
);

export default UserDetailPanel;
