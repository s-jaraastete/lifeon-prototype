import Image from "next/image";
import { LuChartBar, LuFileText, LuTable } from "react-icons/lu";

type BaseModuleDef = {
  bgClass: string;
  renderIcon: (size: number) => React.ReactNode;
};

export const BASE_MODULES = {
  miper: {
    bgClass: "bg-purple-300",
    renderIcon: (size: number) => <LuTable size={size} className="text-black" />,
  },
  planificacion: {
    bgClass: "bg-red-100",
    renderIcon: (size: number) => <LuChartBar size={size} className="text-black" />,
  },
  documentacion: {
    bgClass: "bg-sky-500",
    renderIcon: (size: number) => <LuFileText size={size} className="text-black" />,
  },
  apr: {
    bgClass: "bg-gradient-to-b from-[#BDE7FF] to-[#ADF2D3]",
    renderIcon: (size: number) => (
      <Image
        src="/svg/apr-icon.svg"
        width={size}
        height={size}
        alt="APR Virtual"
        className="h-auto shrink-0 max-w-none"
        style={{ width: size, height: size }}
      />
    ),
  },
} satisfies Record<string, BaseModuleDef>;

export type ModuleIconProps = {
  box: string;
  iconSize: number;
};

export const ModuleBox = ({
  bg,
  box,
  children,
}: {
  bg: string;
  box: string;
  children: React.ReactNode;
}) => (
  <span
    className={`flex shrink-0 items-center justify-center ${bg} ${box} ${
      box.includes("rounded") ? "" : "rounded-[33.33%]"
    }`}
  >
    {children}
  </span>
);

export const MiperIcon = ({ box, iconSize }: ModuleIconProps) => (
  <ModuleBox bg={BASE_MODULES.miper.bgClass} box={box}>
    {BASE_MODULES.miper.renderIcon(iconSize)}
  </ModuleBox>
);

export const PlanificacionIcon = ({ box, iconSize }: ModuleIconProps) => (
  <ModuleBox bg={BASE_MODULES.planificacion.bgClass} box={box}>
    {BASE_MODULES.planificacion.renderIcon(iconSize)}
  </ModuleBox>
);

export const DocumentacionIcon = ({ box, iconSize }: ModuleIconProps) => (
  <ModuleBox bg={BASE_MODULES.documentacion.bgClass} box={box}>
    {BASE_MODULES.documentacion.renderIcon(iconSize)}
  </ModuleBox>
);

export const AprIcon = ({ box, iconSize }: ModuleIconProps) => (
  <ModuleBox bg={BASE_MODULES.apr.bgClass} box={box}>
    {BASE_MODULES.apr.renderIcon(iconSize)}
  </ModuleBox>
);
