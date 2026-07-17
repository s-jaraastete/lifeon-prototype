import { LuBotMessageSquare, LuFileSearch2, LuRefreshCcw, LuSearch, LuTable } from "react-icons/lu";

export type EcosystemItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  bgColor: string;
  textColor: string;
  available: boolean;
};

export const ecosystemItems: EcosystemItem[] = [
  {
    icon: <LuTable size={24} className="text-black" />,
    title: "MIPER",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-purple-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuFileSearch2 size={24} className="text-black" />,
    title: "Programa y Documentación Preventiva",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-sky-300",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuBotMessageSquare size={24} className="text-black" />,
    title: "APR Virtual",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-[rgb(0,199,189)]",
    textColor: "text-black",
    available: true,
  },
  {
    icon: <LuRefreshCcw size={24} className="text-gray-700" />,
    title: "Gestión del cambio",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: <LuSearch size={24} className="text-gray-700" />,
    title: "Módulo 5",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
  {
    icon: <LuSearch size={24} className="text-gray-700" />,
    title: "Módulo 6",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    href: "/modulos/",
    bgColor: "bg-gray-300",
    textColor: "text-gray-700",
    available: false,
  },
];
