import type { ReactNode } from "react";

type StatTone = "default" | "success" | "danger";

type StatCardProps = {
  label: string;
  value: string;
  note: ReactNode;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  default: "text-neutral-secondary",
  success: "text-green-500",
  danger: "text-red-500",
};

export default function StatCard({ label, value, note, tone = "default" }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-stroke bg-white p-5">
      <p className="text-sm font-medium text-neutral-secondary">{label}</p>
      <p className="mt-2 text-[32px] font-semibold tracking-tight text-neutral-primary">
        {value}
      </p>
      <p className={`mt-2 text-xs font-medium ${toneClasses[tone]}`}>{note}</p>
    </article>
  );
}
