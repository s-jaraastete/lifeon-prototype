"use client";

import { LuChevronRight } from "react-icons/lu";
import Link from "next/link";
import DashboardSection from "../../components/shared/DashboardSection";

const CardNoteLink = ({ label, href }: { label: string; href: string }) => (
  <Link
    href={href}
    className="inline-flex items-center gap-0.5 font-medium text-sm text-secondary hover:underline"
  >
    {label}
    <LuChevronRight className="inline-block" />
  </Link>
);

// TODO: Datos inventados mientras no exista el endpoint de facturación.
const InvoiceDashboard = () => (
  <DashboardSection
    title="Facturación"
    description={
      <>
        Gestiona cobros, conciliación bancaria, estado de facturación y <br />
        emisión de DTE.
      </>
    }
    cards={[
      {
        label: "Facturación del mes",
        value: "$24.850.000",
        note: "62 DTEs emitidas",
      },
      {
        label: "Total recaudado mes",
        value: "$18.400.000",
        note: "74% del total",
      },
      {
        label: "Por cobrar",
        value: "$4.250.000",
        note: (
          <CardNoteLink
            label="Ver suscripciones por cobrar"
            href="/admin/suscripciones?status=pending_payment_method"
          />
        ),
      },
      {
        label: "En mora",
        value: "$2.200.000",
        note: (
          <CardNoteLink
            label="Ver suscripciones en mora"
            href="/admin/suscripciones?status=past_due"
          />
        ),
      },
    ]}
  />
);

export default InvoiceDashboard;
