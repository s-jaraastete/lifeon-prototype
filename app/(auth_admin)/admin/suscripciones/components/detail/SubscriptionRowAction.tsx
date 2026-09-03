"use client";

import { EyeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import axios from "axios";
import { Subscription } from "@/types/admin";
import GenericMenu, { MenuItem } from "@/components/reusable/GenericMenu";
import { useSubscriptionDetail } from "./SubscriptionDetailProvider";
import SubscriptionPlanChangeModal from "./SubscriptionPlanChangeModal";
import { LuBox, LuBuilding2, LuCircleCheck, LuCircleDollarSign, LuCircleOff, LuCircleX, LuCreditCard, LuList, LuMailWarning, LuRefreshCw, LuRocket, LuTrash2, LuUserRound } from "react-icons/lu";
import SubscriptionActionModal from "../SubscriptionActionModal";
import Alert from "@/components/reusable/Alert";
import {
  archiveSubscription,
  cancelSubscription,
  reactivateSubscription,
  retrySubscriptionPayment,
  sendPaymentReminder,
  suspendSubscription,
} from "../../services/subscriptionActions";

const SubscriptionRowAction = ({ subscription }: { subscription: Subscription }) => {
  const detail = useSubscriptionDetail();
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionError, setSuspensionError] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [reactivationReason, setReactivationReason] = useState("");
  const [reactivationError, setReactivationError] = useState("");
  const [isReactivating, setIsReactivating] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isArchiveWarningModalOpen, setIsArchiveWarningModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveConfirmation, setArchiveConfirmation] = useState("");
  const [archiveError, setArchiveError] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [isPaymentReminderModalOpen, setIsPaymentReminderModalOpen] = useState(false);
  const [isSendingPaymentReminder, setIsSendingPaymentReminder] = useState(false);
  const [paymentReminderError, setPaymentReminderError] = useState("");
  const [isRetryPaymentModalOpen, setIsRetryPaymentModalOpen] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [retryPaymentError, setRetryPaymentError] = useState("");
  const [isPlanChangeModalOpen, setIsPlanChangeModalOpen] = useState(false);
  const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const canSuspend = subscription.available_actions.includes("suspend");
  const canReactivate = subscription.available_actions.includes("reactivate");
  const canCancel = subscription.available_actions.includes("cancel");
  const canArchive = subscription.available_actions.includes("archive");
  const canSendPaymentReminder = subscription.available_actions.includes("payment_reminder");
  const canRetryPayment = subscription.available_actions.includes("retry_payment");
  const canChangePlan = subscription.available_actions.includes("plan_change");

  const closeSuspendModal = () => {
    if (isSuspending) {
      return;
    }

    setIsSuspendModalOpen(false);
    setSuspensionReason("");
    setSuspensionError("");
  };

  const getErrorMessage = (
    error: unknown,
    fallbackMessage: string,
  ) => {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data;

      if (responseData && typeof responseData === "object") {
        const message = Object.values(responseData)
          .flat()
          .find((value) => typeof value === "string");

        if (typeof message === "string") {
          return message;
        }
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallbackMessage;
  };

  const closeReactivateModal = () => {
    if (isReactivating) {
      return;
    }

    setIsReactivateModalOpen(false);
    setReactivationReason("");
    setReactivationError("");
  };

  const closeCancelModal = () => {
    if (isCancelling) {
      return;
    }

    setIsCancelModalOpen(false);
    setCancellationReason("");
    setCancellationError("");
  };

  const closeArchiveModal = () => {
    if (isArchiving) {
      return;
    }

    setIsArchiveModalOpen(false);
    setArchiveReason("");
    setArchiveConfirmation("");
    setArchiveError("");
  };

  const closeArchiveWarningModal = () => {
    setIsArchiveWarningModalOpen(false);
  };

  const continueToArchiveConfirmation = () => {
    setIsArchiveWarningModalOpen(false);
    setIsArchiveModalOpen(true);
  };

  const closePaymentReminderModal = () => {
    if (isSendingPaymentReminder) {
      return;
    }

    setIsPaymentReminderModalOpen(false);
    setPaymentReminderError("");
  };

  const handleSendPaymentReminder = async () => {
    setIsSendingPaymentReminder(true);
    setPaymentReminderError("");

    try {
      await sendPaymentReminder(subscription.public_id);
      setIsPaymentReminderModalOpen(false);
      setSuccessMessage("Recordatorio de pago enviado correctamente");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setPaymentReminderError(
        getErrorMessage(
          error,
          "No fue posible enviar el recordatorio. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsSendingPaymentReminder(false);
    }
  };

  const closeRetryPaymentModal = () => {
    if (isRetryingPayment) {
      return;
    }

    setIsRetryPaymentModalOpen(false);
    setRetryPaymentError("");
  };

  const handleRetryPayment = async () => {
    setIsRetryingPayment(true);
    setRetryPaymentError("");

    try {
      await retrySubscriptionPayment(subscription.public_id);
      setIsRetryPaymentModalOpen(false);
      setSuccessMessage("Reintento de cobro enviado a procesamiento");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setRetryPaymentError(
        getErrorMessage(
          error,
          "No fue posible solicitar el reintento de cobro. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsRetryingPayment(false);
    }
  };

  const handleSuspend = async () => {
    const reason = suspensionReason.trim();

    if (!reason) {
      setSuspensionError("Debes indicar el motivo de la suspensión.");
      return;
    }

    setIsSuspending(true);
    setSuspensionError("");

    try {
      await suspendSubscription(subscription.public_id, reason);
      setIsSuspendModalOpen(false);
      setSuspensionReason("");
      setSuccessMessage("Cuenta suspendida con éxito");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setSuspensionError(
        getErrorMessage(
          error,
          "No fue posible suspender la suscripción. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsSuspending(false);
    }
  };

  const handleReactivate = async () => {
    const reason = reactivationReason.trim();

    if (!reason) {
      setReactivationError("Debes indicar el motivo de la reactivación.");
      return;
    }

    setIsReactivating(true);
    setReactivationError("");

    try {
      await reactivateSubscription(subscription.public_id, reason);
      setIsReactivateModalOpen(false);
      setReactivationReason("");
      setSuccessMessage("Cuenta reactivada con éxito");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setReactivationError(
        getErrorMessage(
          error,
          "No fue posible reactivar la suscripción. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsReactivating(false);
    }
  };

  const handleCancel = async () => {
    const reason = cancellationReason.trim();

    if (!reason) {
      setCancellationError("Debes indicar el motivo de la cancelación.");
      return;
    }

    setIsCancelling(true);
    setCancellationError("");

    try {
      await cancelSubscription(subscription.public_id, reason);
      setIsCancelModalOpen(false);
      setCancellationReason("");
      setSuccessMessage("Cuenta cancelada con éxito");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setCancellationError(
        getErrorMessage(
          error,
          "No fue posible cancelar la suscripción. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleArchive = async () => {
    const reason = archiveReason.trim();
    const confirmation = archiveConfirmation.trim();

    if (!reason) {
      setArchiveError("Debes indicar el motivo de la eliminación.");
      return;
    }

    if (confirmation !== subscription.subscription_id) {
      setArchiveError(
        `Escribe ${subscription.subscription_id} para confirmar la eliminación.`,
      );
      return;
    }

    setIsArchiving(true);
    setArchiveError("");

    try {
      await archiveSubscription(subscription.public_id, reason);
      setIsArchiveModalOpen(false);
      setArchiveReason("");
      setArchiveConfirmation("");
      setSuccessMessage("Suscripción eliminada exitosamente");
      setIsSuccessAlertOpen(true);
    } catch (error) {
      setArchiveError(
        getErrorMessage(
          error,
          "No fue posible archivar la suscripción. Intenta nuevamente.",
        ),
      );
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <GenericMenu>
          <MenuItem
            icon={<EyeIcon />}
            onClick={() => detail?.openDetail(subscription)}
          >
            Ver detalle de suscripción
          </MenuItem>
          {/* <MenuItem
            icon={<LuBuilding2 />}
            onClick={() => {}}
          >
            Ver organización
          </MenuItem> */}
          {/* <MenuItem
            icon={<LuUserRound />}
            onClick={() => {}}
          >
            Ver usuario
          </MenuItem> */}
          {canChangePlan && (
            <MenuItem
              icon={<LuRocket />}
              onClick={() => setIsPlanChangeModalOpen(true)}
            >
              Cambiar plan de suscripción
            </MenuItem>
          )}
          {/* <MenuItem
            icon={<LuBox />}
            onClick={() => {}}
          >
            Gestionar Add-ons
          </MenuItem> */}
          {/* <MenuItem
            icon={<LuCreditCard />}
            onClick={() => {}}
          >
            Modificar método de pago
          </MenuItem> */}
          {/* <MenuItem
            icon={<LuList />}
            onClick={() => {}}
          >
            Ver historial de pagos
          </MenuItem> */}
          {canRetryPayment && (
            <MenuItem
              icon={<LuRefreshCw />}
              onClick={() => setIsRetryPaymentModalOpen(true)}
            >
              Reintentar cobro ahora
            </MenuItem>
          )}
          {/* <MenuItem
            icon={<LuCircleDollarSign />}
            onClick={() => {}}
          >
            Registrar pago manual
          </MenuItem> */}
          {canSendPaymentReminder && (
            <MenuItem
              icon={<LuMailWarning />}
              onClick={() => setIsPaymentReminderModalOpen(true)}
            >
              Enviar recordatorio de pago
            </MenuItem>
          )}
          <hr className="border-stroke" />
          {canSuspend && (
            <MenuItem
              icon={<LuCircleOff />}
              onClick={() => setIsSuspendModalOpen(true)}
            >
              Suspender suscripción
            </MenuItem>
          )}
          {canReactivate && (
            <MenuItem
              icon={<LuCircleCheck />}
              onClick={() => setIsReactivateModalOpen(true)}
            >
              Reactivar suscripción
            </MenuItem>
          )}
          {canCancel && (
            <MenuItem
              icon={<LuCircleX />}
              onClick={() => setIsCancelModalOpen(true)}
            >
              Cancelar suscripción
            </MenuItem>
          )}
          {canArchive && (
            <MenuItem
              icon={<LuTrash2 />}
              className="text-primary"
              onClick={() => setIsArchiveWarningModalOpen(true)}
            >
              Eliminar suscripción
            </MenuItem>
          )}
        </GenericMenu>
      </div>

      {/* Payment Reminder */}
      <SubscriptionActionModal
        open={isPaymentReminderModalOpen}
        title="¿Enviar recordatorio de cobro?"
        description={
          <>
            Se notificará por correo electrónico a{' '}
            <span className="font-medium">
              {subscription.billing_email ?? "el contacto de facturación registrado"}
            </span>{' '}
            indicando el saldo pendiente y las instrucciones de pago.
          </>
        }
        confirmLabel="Enviar notificación"
        variant="secondary"
        onClose={closePaymentReminderModal}
        onConfirm={handleSendPaymentReminder}
        isSubmitting={isSendingPaymentReminder}
      >
        {paymentReminderError && (
          <p className="text-sm text-primary">
            {paymentReminderError}
          </p>
        )}
      </SubscriptionActionModal>

      {/* Change Plan Subscription */}
      <SubscriptionPlanChangeModal
        open={isPlanChangeModalOpen}
        subscription={subscription}
        onClose={() => setIsPlanChangeModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage("Cambio de plan programado con éxito");
          setIsSuccessAlertOpen(true);
        }}
      />

      {/* Retry Payment */}
      <SubscriptionActionModal
        open={isRetryPaymentModalOpen}
        title="¿Reintentar cobro ahora?"
        description={
          <>
            Se intentará cobrar de inmediato el saldo pendiente al medio de
            pago registrado para <span className="font-medium">{subscription.client_name}</span>.
          </>
        }
        confirmLabel="Reintentar cobro"
        variant="secondary"
        onClose={closeRetryPaymentModal}
        onConfirm={handleRetryPayment}
        isSubmitting={isRetryingPayment}
      >
        {retryPaymentError && (
          <p className="text-sm text-primary">
            {retryPaymentError}
          </p>
        )}
      </SubscriptionActionModal>

      {/* Suspended Subscription */}
      <SubscriptionActionModal
        open={isSuspendModalOpen}
        title="¿Suspender la suscripción?"
        description={
          <>Esta acción pausará de inmediato el acceso a la plataforma para <span className="font-medium">{subscription.client_name}</span>. Puedes reactivarla en cualquier momento.</>
        }
        confirmLabel="Suspender"
        onClose={closeSuspendModal}
        onConfirm={handleSuspend}
        isSubmitting={isSuspending}
        confirmDisabled={!suspensionReason.trim()}
      >
        <div>
          <label
            htmlFor={`suspension-reason-${subscription.public_id}`}
            className="mb-2 block text-sm font-medium text-neutral-primary"
          >
            Motivo de la suspensión
          </label>
          <textarea
            id={`suspension-reason-${subscription.public_id}`}
            value={suspensionReason}
            onChange={(event) => {
              setSuspensionReason(event.target.value);
              setSuspensionError("");
            }}
            placeholder="Escribe el motivo..."
            disabled={isSuspending}
            rows={3}
            className="w-full resize-none rounded-lg border border-stroke-primary px-3 py-2 text-sm text-neutral-primary outline-none placeholder:text-neutral-400 focus:border-secondary disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
          {suspensionError && (
            <p className="mt-2 text-sm text-primary">
              {suspensionError}
            </p>
          )}
        </div>
      </SubscriptionActionModal>

      {/* Reactive Subscription */}
      <SubscriptionActionModal
        open={isReactivateModalOpen}
        title="¿Reactivar la suscripción?"
        description={
          <>Se restablecerá el acceso inmediato a la plataforma para todos los usuarios asociados a <span className="font-medium">{subscription.client_name}({subscription.subscription_id})</span>. Se reanudará el ciclo de cobro habitual según el método de pago configurado.</>
        }
        confirmLabel="Reactivar suscripción"
        variant="secondary"
        onClose={closeReactivateModal}
        onConfirm={handleReactivate}
        isSubmitting={isReactivating}
        confirmDisabled={!reactivationReason.trim()}
      >
        <div>
          <label
            htmlFor={`reactivation-reason-${subscription.public_id}`}
            className="mb-2 block text-sm font-medium text-neutral-primary"
          >
            Motivo de la reactivación
          </label>
          <textarea
            id={`reactivation-reason-${subscription.public_id}`}
            value={reactivationReason}
            onChange={(event) => {
              setReactivationReason(event.target.value);
              setReactivationError("");
            }}
            placeholder="Escribe el motivo..."
            disabled={isReactivating}
            rows={3}
            className="w-full resize-none rounded-lg border border-stroke-primary px-3 py-2 text-sm text-neutral-primary outline-none placeholder:text-neutral-400 focus:border-secondary disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
          {reactivationError && (
            <p className="mt-2 text-sm text-primary">
              {reactivationError}
            </p>
          )}
        </div>
      </SubscriptionActionModal>

      {/* Cancel Subscription */}
      <SubscriptionActionModal
        open={isCancelModalOpen}
        title="¿Cancelar la suscripción?"
        description={
          <>Se dará de baja la suscripción <span className="font-medium">{subscription.subscription_id}</span> del cliente <span className="font-medium">{subscription.client_name}</span>. El cliente perderá el acceso al finalizar su período actual.</>
        }
        confirmLabel="Dar de baja"
        onClose={closeCancelModal}
        onConfirm={handleCancel}
        isSubmitting={isCancelling}
        confirmDisabled={!cancellationReason.trim()}
      >
        <div>
          <label
            htmlFor={`cancellation-reason-${subscription.public_id}`}
            className="mb-2 block text-sm font-medium text-neutral-primary"
          >
            Motivo de la cancelación
          </label>
          <textarea
            id={`cancellation-reason-${subscription.public_id}`}
            value={cancellationReason}
            onChange={(event) => {
              setCancellationReason(event.target.value);
              setCancellationError("");
            }}
            placeholder="Escribe el motivo..."
            disabled={isCancelling}
            rows={3}
            className="w-full resize-none rounded-lg border border-stroke-primary px-3 py-2 text-sm text-neutral-primary outline-none placeholder:text-neutral-400 focus:border-secondary disabled:cursor-not-allowed disabled:bg-neutral-100"
          />
          {cancellationError && (
            <p className="mt-2 text-sm text-primary">
              {cancellationError}
            </p>
          )}
        </div>
      </SubscriptionActionModal>

      {/* Deleted Subscription */}
      <SubscriptionActionModal
        open={isArchiveWarningModalOpen}
        title="¿Eliminar la suscripción?"
        description={
          <>Esta acción es irreversible. Se borrarán todos los registros, licencias e historial asociados al ID <span className="font-medium">{subscription.subscription_id}</span>.</>
        }
        confirmLabel="Eliminar"
        onClose={closeArchiveWarningModal}
        onConfirm={continueToArchiveConfirmation}
      />

      {/* Confirm Deleted Subscription */}
      <SubscriptionActionModal
        open={isArchiveModalOpen}
        title="Confirmación de seguridad"
        description={
          <>Para evitar eliminaciones accidentales, escribe el ID de la suscripción <span className="font-medium">{subscription.subscription_id}</span> y el motivo de la eliminación para habilitar la confirmación.</>
        }
        confirmLabel="Confirmar"
        onClose={closeArchiveModal}
        onConfirm={handleArchive}
        isSubmitting={isArchiving}
        confirmDisabled={
          !archiveReason.trim()
          || archiveConfirmation.trim() !== subscription.subscription_id
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`archive-reason-${subscription.public_id}`}
              className="mb-2 block text-sm font-medium text-neutral-primary"
            >
              Motivo de la eliminación
            </label>
            <textarea
              id={`archive-reason-${subscription.public_id}`}
              value={archiveReason}
              onChange={(event) => {
                setArchiveReason(event.target.value);
                setArchiveError("");
              }}
              placeholder="Escribe el motivo..."
              disabled={isArchiving}
              rows={3}
              className="w-full resize-none rounded-lg border border-stroke-primary px-3 py-2 text-sm text-neutral-primary outline-none placeholder:text-neutral-400 focus:border-secondary disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          <div>
            <label
              htmlFor={`archive-confirmation-${subscription.public_id}`}
              className="mb-2 block text-sm font-medium text-neutral-primary"
            >
              Escribe {subscription.subscription_id} para confirmar
            </label>
            <input
              id={`archive-confirmation-${subscription.public_id}`}
              value={archiveConfirmation}
              onChange={(event) => {
                setArchiveConfirmation(event.target.value);
                setArchiveError("");
              }}
              placeholder="ID suscripción"
              disabled={isArchiving}
              className="w-full rounded-lg border border-stroke-primary px-3 py-2 text-sm text-neutral-primary outline-none placeholder:text-neutral-400 focus:border-secondary disabled:cursor-not-allowed disabled:bg-neutral-100"
            />
          </div>

          {archiveError && (
            <p className="text-sm text-primary">
              {archiveError}
            </p>
          )}
        </div>
      </SubscriptionActionModal>

      <Alert
        open={isSuccessAlertOpen}
        onClose={() => setIsSuccessAlertOpen(false)}
        duration={3000}
        type="success"
        title={successMessage}
      />
    </>
  );
};

export default SubscriptionRowAction;
