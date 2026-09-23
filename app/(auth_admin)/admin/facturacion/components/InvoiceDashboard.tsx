"use client";

import { LuChevronRight } from "react-icons/lu";
import Link from "next/link";
import { InvoiceDashboardOverview } from "@/types/admin";
import { formatReferenceAmount } from "@/utils/pricingHelpers";
import DashboardSection from "../../components/shared/DashboardSection";
import type { StatTone } from "../../components/shared/StatCard";

type InvoiceDashboardProps = {
  data: InvoiceDashboardOverview;
};

const formatDecimal = (value: number): string =>
  new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(value);

const CardNoteLink = ({ label, href }: { label: string; href: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-0.5 font-medium text-sm text-secondary hover:underline"
  >
    {label}
    <LuChevronRight className="inline-block" />
  </Link>
);

const signedPercentage = (change: number): string =>
  `${change > 0 ? "+" : ""}${formatDecimal(change)}%`;

const snapshotNote = (change: number | undefined): string =>
  change == null ? "" : `${signedPercentage(change)} vs mes anterior`;

const snapshotTone = (change: number | undefined): StatTone =>
  change == null ? "default" : change < 0 ? "danger" : change > 0 ? "success" : "default";

const toCards = (data: InvoiceDashboardOverview) => {
  // TODO: El backend no contempla por ahora DTE
  const dteNote = "0 DTEs emitidas";

  return [
  {
    label: "Facturación del mes",
    value: `$${formatReferenceAmount(data.billed_this_month.value)}`,
    note: dteNote,
  },
  {
    label: "Total recaudado mes",
    value: `$${formatReferenceAmount(data.collected_this_month.value)}`,
    note: snapshotNote(data.collected_this_month.change_percentage),
    tone: snapshotTone(data.collected_this_month.change_percentage),
  },
  {
    label: "Por cobrar",
    value: `$${formatReferenceAmount(data.pending_collection.value)}`,
    note: (
      <CardNoteLink
        label="Ver suscripciones por cobrar"
        href="/admin/suscripciones?status=pending_payment_method"
      />
    ),
  },
  {
    label: "En mora",
    value: `$${formatReferenceAmount(data.overdue.value)}`,
    note: (
      <CardNoteLink
        label="Ver suscripciones en mora"
        href="/admin/suscripciones?status=past_due"
      />
    ),
  },
  ];
};

const InvoiceDashboard = ({ data }: InvoiceDashboardProps) => (
  <DashboardSection
    title="Facturación"
    description={
      <>
        Gestiona cobros, conciliación bancaria, estado de facturación y <br />
        emisión de DTE.
      </>
    }
    cards={toCards(data)}
  />
);

export default InvoiceDashboard;
