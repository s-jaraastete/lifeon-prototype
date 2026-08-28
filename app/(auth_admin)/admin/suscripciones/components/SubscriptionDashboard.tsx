import { LuChevronRight } from "react-icons/lu";
import StatCard from "../../components/StatCard";
import Link from "next/link";


const stats = [
  {
    label: "Suscripciones activas",
    value: "142",
    note: "+7,7% vs mes anterior",
    tone: "success" as const,
  },
  {
    label: "MRR total mensual",
    value: "$8.400.000",
    note: "+7,7% vs mes anterior",
    tone: "success" as const,
  },
  {
    label: "Suscripciones por vencer",
    value: "18",
    note: 
      <>
        <Link href="/" className="text-secondary font-medium hover:underline">
          Ver vencimientos
        </Link> 
        <LuChevronRight className="inline-block" />
      </>,
  },
  {
    label: "Tasa de abandono",
    value: "2.4%",
    note: "+1,7% vs mes anterior",
    tone: "danger" as const,
  },
];

const SubscriptionDashboard = () => {
  return (
    <section className="rounded-2xl bg-surface-primary p-6 shadow-soft lg:p-7">
      <div className="flex items-start gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-primary lg:text-4xl">
            Suscripciones
          </h1>
          <p className="mt-1 text-base text-neutral-secondary lg:text-lg">
            Gestiona y controla los contratos de suscripción de usuarios y <br/> organizaciones en LifeOn.
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

export default SubscriptionDashboard;