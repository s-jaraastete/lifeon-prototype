import type { ReactNode } from "react";
import StatGrid from "./StatGrid";
import type { StatCardProps } from "./StatCard";

type DashboardSectionProps = {
  title: ReactNode;
  description: ReactNode;
  cards: StatCardProps[];
};

const DashboardSection = ({ title, description, cards }: DashboardSectionProps) => (
  <section className="rounded-2xl bg-surface-primary p-6 shadow-soft lg:p-7">
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-neutral-primary lg:text-4xl">
        {title}
      </h1>
      <p className="mt-1 text-base text-neutral-secondary lg:text-lg">
        {description}
      </p>
    </div>

    <StatGrid cards={cards} />
  </section>
);

export default DashboardSection;
