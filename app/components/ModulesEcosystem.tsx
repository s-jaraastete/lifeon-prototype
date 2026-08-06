import Image from "next/image";
import { LuFileSearch2, LuRefreshCcw, LuSearch, LuTable } from "react-icons/lu";

export type EcosystemItem = {
  icon: (size?: number) => React.ReactNode;
  title: string;
  description: string;
  href: string;
  bgColor: string;
  textColor: string;
  available: boolean;
  chipText?: string;
};

export const ecosystemItems: EcosystemItem[] = [
  {
    icon: (size = 24) => <LuTable size={size} className="text-black" />,
    title: "Matriz IPER",
    description:
      "Identifica, evalúa y controla los riesgos mediante matrices digitales, trazables y alineadas al DS 44.",
    href: "/modulos/",
    bgColor: "bg-purple-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: (size = 24) => <LuFileSearch2 size={size} className="text-black" />,
    title: "Programa y Documentación Preventiva",
    description:
      "Planifica las actividades de seguridad y mantén tu documentación preventiva organizada, vigente y disponible.",
    href: "/modulos/",
    bgColor: "bg-sky-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: (size = 24) => (
      <div 
        className="flex items-center justify-center overflow-hidden" 
        style={{ width: size, height: size }}
      >
        <Image 
          src="/svg/apr-icon.svg" 
          width={size}
          height={size} 
          alt="APR Virtual"
        />
      </div>
    ),
    title: "APR Virtual",
    description:
      "Entrega orientación preventiva inmediata mediante un asistente inteligente que agiliza las tareas diarias.",
    href: "/modulos/",
    bgColor: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
    textColor: "text-black",
    available: true,
    chipText: "IA",
  },
  {
    icon: (size = 24) => <LuRefreshCcw size={size} className="text-gray-700" />,
    title: "Gestión del cambio",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: (size = 24) => <LuSearch size={size} className="text-gray-700" />,
    title: "Módulo 5",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: (size = 24) => <LuSearch size={size} className="text-gray-700" />,
    title: "Módulo 6",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
];
