import type { ReactNode } from "react";

export type ChartTooltipRow = {
  label: string;
  value: string;
  color?: string;
};

/** Tarjeta flotante para el `content` de los Tooltip de Recharts. */
export default function ChartTooltip({
  title,
  rows,
  footer,
}: {
  title: ReactNode;
  rows: ChartTooltipRow[];
  footer?: ReactNode;
}) {
  return (
    <div className="min-w-44 max-w-64 rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-lg shadow-black/10 text-xs">
      <p className="font-semibold text-gray-900 leading-snug mb-2">{title}</p>
      <dl className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            {row.color && (
              <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: row.color }} aria-hidden />
            )}
            <dt className="text-gray-600 flex-1">{row.label}</dt>
            <dd className="font-semibold text-gray-900 tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <div className="mt-2 pt-2 border-t border-gray-100">{footer}</div>}
    </div>
  );
}
