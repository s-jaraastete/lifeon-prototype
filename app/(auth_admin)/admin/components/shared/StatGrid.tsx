import StatCard, { type StatCardProps } from "./StatCard";

type StatGridProps = {
  cards: StatCardProps[];
};

const StatGrid = ({ cards }: StatGridProps) => (
  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map((card) => (
      <StatCard key={card.label} {...card} />
    ))}
  </div>
);

export default StatGrid;
