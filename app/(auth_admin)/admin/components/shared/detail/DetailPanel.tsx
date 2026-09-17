import clsx from "clsx";
import { ReactNode } from "react";
import SlideOver from "@/app/components/ui/SlideOver";

type DetailRowProps = {
  label: string;
  value: string;
  className?: string;
};

type DetailSectionProps = {
  title: string;
  children: ReactNode;
  gridClassName?: string;
};

type DetailPanelProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  size?: "w-90" | "w-150" | "w-200";
  children?: ReactNode;
};

export type DetailSectionRowConfig = {
  label: string;
  value: string;
  className?: string;
};

export type DetailSectionConfig = {
  title: string;
  rows?: DetailSectionRowConfig[];
  gridClassName?: string;
  content?: ReactNode;
};

// TODO: Revisar los estilos default contra el diseño final.
export const DetailRow = ({ label, value, className }: DetailRowProps) => (
  <div className={clsx("flex flex-col gap-1", className)}>
    <span className="text-xs font-medium text-neutral-secondary">{label}</span>
    <span className="text-sm text-neutral-primary">{value}</span>
  </div>
);

export const DetailSection = ({
  title,
  children,
  gridClassName,
}: DetailSectionProps) => (
  <section className="rounded-xl border border-stroke bg-white p-5">
    <h3 className="text-lg font-semibold text-neutral-primary">{title}</h3>
    <div className={gridClassName ?? "mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2"}>
      {children}
    </div>
  </section>
);

export const DetailActions = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-2">{children}</div>
);

export const DetailSectionList = ({
  sections,
}: {
  sections: DetailSectionConfig[];
}) => (
  <>
    {sections.map((section) => (
      <DetailSection
        key={section.title}
        title={section.title}
        gridClassName={section.gridClassName}
      >
        {section.content ??
          section.rows?.map((row) => <DetailRow key={row.label} {...row} />)}
      </DetailSection>
    ))}
  </>
);

const DetailPanel = ({
  open,
  onClose,
  title,
  size,
  children,
}: DetailPanelProps) => (
  <SlideOver
    open={open}
    onClose={onClose}
    title={title}
    size={size ?? "w-150"}
  >
    <div className="flex flex-col gap-5">{children}</div>
  </SlideOver>
);

export default DetailPanel;
