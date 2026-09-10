"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { LuCheck, LuCircleAlert, LuRocket } from "react-icons/lu";
import { Subscription } from "@/types/admin";
import LoadingDots from "@/components/reusable/LoadingDots";
import Switch from "@/app/components/ui/Switch";
import SubscriptionActionModal from "../SubscriptionActionModal";
import {
  getSubscriptionPlanChangeOptions,
  scheduleSubscriptionPlanChange,
  SubscriptionPlanChangeOptions,
} from "../../services/subscriptionActions";

type SubscriptionPlanChangeModalProps = {
  open: boolean;
  subscription: Subscription;
  onClose: () => void;
  onSuccess: () => void;
};

const formatDate = (date: string | null) => {
  if (!date) {
    return "la próxima renovación";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

const formatPrice = (
  amount: string,
  currency: string,
  billingPeriod: "monthly" | "yearly",
) => (
  `${Number(amount).toLocaleString("es-CL", { maximumFractionDigits: 2 })} ${currency} / ${billingPeriod === "yearly" ? "año" : "mes"}`
);

const SubscriptionPlanChangeModal = ({ open, subscription, onClose, onSuccess }: SubscriptionPlanChangeModalProps) => {
  const [options, setOptions] = useState<SubscriptionPlanChangeOptions | null>(null);
  const [selectedPackPublicId, setSelectedPackPublicId] = useState("");
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    let isMounted = true;

    const loadOptions = async () => {
      setIsLoading(true);
      setError("");
      setOptions(null);

      try {
        const response = await getSubscriptionPlanChangeOptions(
          subscription.public_id,
        );

        if (!isMounted) {
          return;
        }

        setOptions(response);
        setSelectedBillingPeriod(response.current_plan.billing_period);

        const defaultPlan = response.available_plans.find((plan) => (
          plan.public_id !== response.current_plan.public_id
          && plan.prices.some(
            (price) => price.billing_period === response.current_plan.billing_period,
          )
        )) ?? response.available_plans[0];

        setSelectedPackPublicId(defaultPlan?.public_id ?? "");
      } catch {
        if (isMounted) {
          setError("No fue posible cargar las opciones de cambio de plan.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadOptions();

    return () => {
      isMounted = false;
    };
  }, [open, subscription.public_id]);

  const selectedPlan = useMemo(() => (
    options?.available_plans.find(
      (plan) => plan.public_id === selectedPackPublicId,
    )
  ), [options, selectedPackPublicId]);

  const selectedPrice = useMemo(() => (
    selectedPlan?.prices.find(
      (price) => price.billing_period === selectedBillingPeriod,
    )
  ), [selectedPlan, selectedBillingPeriod]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handlePlanSelection = (planPublicId: string) => {
    const plan = options?.available_plans.find(
      (item) => item.public_id === planPublicId,
    );

    if (!plan) {
      return;
    }

    setSelectedPackPublicId(planPublicId);
    setError("");

    if (!plan.prices.some((price) => price.billing_period === selectedBillingPeriod)) {
      setSelectedBillingPeriod(plan.prices[0]?.billing_period ?? "monthly");
    }
  };

  const handleBillingPeriodChange = (isYearly: boolean) => {
    const nextPeriod = isYearly ? "yearly" : "monthly";

    if (selectedPlan?.prices.some((price) => price.billing_period === nextPeriod)) {
      setSelectedBillingPeriod(nextPeriod);
      setError("");
    }
  };

  const handleConfirm = async () => {
    if (!selectedPlan || !selectedPrice) {
      setError("Selecciona un plan y período de facturación disponibles.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await scheduleSubscriptionPlanChange(
        subscription.public_id,
        selectedPlan.public_id,
        selectedBillingPeriod,
      );
      onClose();
      onSuccess();
    } catch {
      setError("No fue posible programar el cambio de plan. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSamePlanAndPeriod = Boolean(
    options
    && options.current_plan.public_id === selectedPackPublicId
    && options.current_plan.billing_period === selectedBillingPeriod,
  );
  const isAnnualAvailable = selectedPlan?.prices.some(
    (price) => price.billing_period === "yearly",
  ) ?? false;
  const isChangeLocked = !options?.can_schedule_plan_change;
  const isDialogOpen = open && !isLoading;

  return (
    <>
      {open && isLoading && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/10">
          <LoadingDots color="secondary" />
        </div>
      )}

      <SubscriptionActionModal
      open={isDialogOpen}
      title="Cambiar plan de suscripción"
      description={
        options ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-secondary">Cliente</p>
              <p className="font-medium text-neutral-primary">
                {options.subscription.company_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-secondary">ID Suscripción</p>
              <p className="font-medium text-neutral-primary">
                {subscription.subscription_id}
              </p>
            </div>
          </div>
        ) : "No fue posible cargar las opciones de cambio de plan."
      }
      confirmLabel="Confirmar cambio del plan"
      variant="secondary"
      icon={<LuRocket className="size-5 shrink-0 text-secondary" />}
      size="wide"
      showCloseButton
      footerLayout="compact-right"
      onClose={handleClose}
      onConfirm={handleConfirm}
      isSubmitting={isSubmitting}
      confirmDisabled={
        isLoading
        || !options
        || !selectedPlan
        || !selectedPrice
        || isSamePlanAndPeriod
        || isChangeLocked
      }
    >
      {!isLoading && options && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs text-neutral-secondary">Plan actual</p>
            <div className="flex items-center justify-between rounded-lg border border-stroke-primary px-4 py-3">
              <div>
                <p className="font-medium text-neutral-primary">
                  Plan actual: {options.current_plan.name}
                </p>
                <p className="text-sm text-secondary">
                  {formatPrice(
                    options.current_plan.price_uf_snapshot,
                    options.current_plan.currency_snapshot,
                    options.current_plan.billing_period,
                  )}
                </p>
              </div>
              <span className="text-xs text-neutral-primary">
                Ciclo: <span className="text-secondary-text">{options.current_plan.billing_period === "yearly" ? "Anual" : "Mensual"}</span>
              </span>
            </div>
          </div>

          <div className="border-t border-stroke-primary pt-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="font-medium text-neutral-primary">
                Selección del nuevo plan
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-secondary">
                <span>Compromiso anual</span>
                <Switch
                  id={`annual-commitment-${subscription.public_id}`}
                  size="sm"
                  checked={selectedBillingPeriod === "yearly"}
                  onChange={handleBillingPeriodChange}
                  disabled={!isAnnualAvailable || isChangeLocked || isSubmitting}
                  bgColor="bg-secondary"
                  ariaLabel="Activar compromiso anual"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                disabled
                className="relative cursor-not-allowed rounded-lg border border-stroke-primary px-4 py-5 text-left opacity-50"
              >
                <span className="absolute right-4 top-6 size-5 rounded-full border border-neutral-200" />
                <p className="font-medium text-neutral-primary">Free</p>
                <p className="text-xs text-neutral-secondary">Próximamente</p>
              </button>

              {options.available_plans.map((plan) => {
                const price = plan.prices.find(
                  (item) => item.billing_period === selectedBillingPeriod,
                );
                const isCurrentPlan = plan.public_id === options.current_plan.public_id;
                const isCurrentPlanAndPeriod = (
                  isCurrentPlan
                  && options.current_plan.billing_period === selectedBillingPeriod
                );
                const isSelected = plan.public_id === selectedPackPublicId;
                const isDisabled = !price || isCurrentPlanAndPeriod || isChangeLocked || isSubmitting;

                return (
                  <button
                    key={plan.public_id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handlePlanSelection(plan.public_id)}
                    className={`relative rounded-lg border px-4 py-5 text-left transition-colors ${
                      isSelected
                        ? "border-secondary border-2 bg-secondary/5"
                        : "border-stroke-primary"
                    } ${
                      isDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:border-secondary"
                    }`}
                  >
                    {isCurrentPlanAndPeriod && (
                      <span className="absolute -top-2 right-13.5 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-secondary font-medium">
                        Actual
                      </span>
                    )}
                    {isSelected ? (
                      <span className="absolute right-4 top-6 inline-flex size-5 items-center justify-center rounded-full bg-secondary text-white">
                        <LuCheck size={12} strokeWidth={3} />
                      </span>
                    ) : isCurrentPlanAndPeriod ? (
                      <span className="absolute right-4 top-6 inline-flex size-5 items-center justify-center rounded-full border border-neutral-300 text-neutral-300">
                        <LuCheck size={12} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="absolute right-4 top-4 size-4 rounded-full border border-neutral-200" />
                    )}
                    <p className="font-medium text-neutral-primary">{plan.name}</p>
                    <p className="text-xs text-neutral-secondary">
                      {price
                        ? formatPrice(
                          price.amount,
                          price.currency,
                          selectedBillingPeriod,
                        )
                        : "No disponible"}
                    </p>
                  </button>
                );
              })}

              <button
                type="button"
                disabled
                className="relative rounded-lg cursor-not-allowed border border-stroke-primary px-4 py-5 text-left opacity-50"
              >
                <span className="absolute right-4 top-6 size-5 rounded-full border border-neutral-200" />
                <p className="font-medium text-neutral-primary">Custom</p>
                <p className="text-xs text-neutral-secondary">Próximamente</p>
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-neutral-primary">Aplicación y prorrateo</p>
            <label className="flex items-center gap-2 text-sm text-neutral-primary">
              <input type="radio" checked readOnly className="accent-secondary" />
              Aplicar cambio al finalizar período
            </label>
            <label className="mt-2 flex items-center gap-2 text-sm text-neutral-secondary opacity-50">
              <input type="radio" disabled />
              Aplicar cambio de inmediato (próximamente)
            </label>
          </div>

          <div className="flex gap-2 rounded-lg bg-neutral-100 p-3 text-xs leading-5 text-neutral-secondary">
            <LuCircleAlert className="mt-0.5 size-4 shrink-0 text-info" />
            <p>
              El cliente mantendrá el acceso completo a los módulos, licencias y funcionalidades del plan <span className="font-medium">{options.current_plan.name} {options.current_plan.billing_period === "yearly" ? "anual" : "mensual"}</span> hasta el {formatDate(options.subscription.current_period_end)}. A partir de esa fecha, el contrato se renovará automáticamente bajo las condiciones y tarifa del plan <span className="font-medium">{selectedPlan?.name ?? "seleccionado"} {selectedBillingPeriod === "yearly" ? "anual" : "mensual"}</span>.
            </p>
          </div>

          {options.pending_plan_change && (
            <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-xs text-neutral-secondary">
              {options.pending_plan_change.is_locked_by_payment
                ? "Existe un cobro de renovación asociado al cambio pendiente. Ya no puede modificarse."
                : `Existe un cambio pendiente a ${options.pending_plan_change.target_pack_name}. Al confirmar, será reemplazado por tu nueva selección.`}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-primary">{error}</p>
      )}
      </SubscriptionActionModal>
    </>
  );
};

export default SubscriptionPlanChangeModal;
