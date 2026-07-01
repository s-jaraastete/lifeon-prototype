"use client";

import { useState } from "react";
import CheckoutCollapse from "./CheckoutCollapse";
import PersonalData from "./PersonalData";
import BillingData from "./BillingData";
import PaymentMethod from "./PaymentMethod";

export default function CheckoutSections() {
  const [activeSection, setActiveSection] = useState<
    "personal" | "billing" | "payment" | null
  >("personal");

  const toggle = (section: "personal" | "billing" | "payment") => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="flex flex-col gap-2.5">
      <CheckoutCollapse
        title="Datos personales"
        active={activeSection === "personal"}
        onToggle={() => toggle("personal")}
      >
        <PersonalData />
      </CheckoutCollapse>

      <CheckoutCollapse
        title="Datos de facturación"
        active={activeSection === "billing"}
        onToggle={() => toggle("billing")}
      >
        <BillingData />
      </CheckoutCollapse>

      <CheckoutCollapse
        title="Método de pago"
        active={activeSection === "payment"}
        onToggle={() => toggle("payment")}
      >
        <PaymentMethod />
      </CheckoutCollapse>
    </div>
  );
}
