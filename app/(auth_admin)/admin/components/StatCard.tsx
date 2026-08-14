type StatTone = "default" | "success" | "danger";

type StatCardProps = {
  label: string;
  value: string;
  note: string;
  tone?: StatTone;
};

const toneClasses: Record<StatTone, string> = {
  default: "text-neutral-secondary",
  success: "text-green-500",
  danger: "text-red-500",
};

export default function StatCard({ label, value, note, tone = "default" }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-neutral-secondary">{label}</p>
      <p className="mt-3 text-[clamp(1.6rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-primary">
        {value}
      </p>
      <p className={`mt-3 text-sm ${toneClasses[tone]}`}>{note}</p>
    </article>
  );
}
