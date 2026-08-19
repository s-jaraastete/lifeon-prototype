import Image from "next/image";
import StatCard from "./StatCard";

const stats = [
  {
    label: "MRR (Ingreso recurrente)",
    value: "CLP $8.1M",
    note: "+7,7% vs mes anterior",
    tone: "success" as const,
  },
  {
    label: "Suscripciones activas",
    value: "52",
    note: "48 organizaciones • 4 individuales",
  },
  {
    label: "Usuarios totales",
    value: "1.368",
    note: "236 este mes",
    tone: "success" as const,
  },
  {
    label: "Tasa de morosidad",
    value: "4%",
    note: "3 suscripciones vencidas",
    tone: "danger" as const,
  },
];

export default function DashboardHero({userName}: {userName?: string}) {
  return (
    <section className="rounded-2xl bg-surface-primary p-6 shadow-soft lg:p-7">
      <div className="flex items-start gap-4">
        <Image
          src="/images/waving-hand.png"
          height={62}
          width={62}
          alt="Mano saludando"
        />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-primary lg:text-4xl">
            Hola de nuevo, {userName}
          </h1>
          <p className="mt-1 text-base text-neutral-secondary lg:text-lg">
            Aquí tienes el resumen general y estado de la plataforma LifeOn
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}
