import { LuLock, LuRefreshCcw, LuSearch } from "react-icons/lu";
import { AprIcon, DocumentacionIcon, MiperIcon, ModuleBox } from "./shared/baseModules";

export type EcosystemItem = {
  icon: React.ReactElement<{ box: string }>;
  title: string;
  description: string;
  href: string;
  textColor: string;
  available: boolean;
  chipText?: string;
};

export const ecosystemItems: EcosystemItem[] = [
  {
    icon: <MiperIcon box="" iconSize={24} />,
    title: "Matriz IPER",
    description:
      "Identifica, evalúa y controla los riesgos mediante matrices digitales, trazables y alineadas al DS 44.",
    href: "/modulos/miper",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <DocumentacionIcon box="" iconSize={24} />,
    title: "Programa y Documentación Preventiva",
    description:
      "Planifica las actividades de seguridad y mantén tu documentación preventiva organizada, vigente y disponible.",
    href: "/modulos/",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <AprIcon box="" iconSize={24} />,
    title: "APR Virtual",
    description:
      "Entrega orientación preventiva inmediata mediante un asistente inteligente que agiliza las tareas diarias.",
    href: "/modulos/",
    textColor: "text-black",
    available: true,
    chipText: "IA",
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="">
        <span className="block group-hover:hidden">
          <LuRefreshCcw size={24} className="text-gray-700" />
        </span>
        <LuLock size={24} className="hidden group-hover:block text-gray-700" />
      </ModuleBox>
    ),
    title: "Gestión del cambio",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="">
        <span className="block group-hover:hidden">
          <LuSearch size={24} className="text-gray-700" />
        </span>
        <LuLock size={24} className="hidden group-hover:block text-gray-700" />
      </ModuleBox>
    ),
    title: "Módulo 5",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: (
      <ModuleBox bg="bg-gray-300" box="">
        <span className="block group-hover:hidden">
          <LuSearch size={24} className="text-gray-700" />
        </span>
        <LuLock size={24} className="hidden group-hover:block text-gray-700" />
      </ModuleBox>
    ),
    title: "Módulo 6",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    textColor: "text-gray-700",
    available: false,
  },
];
