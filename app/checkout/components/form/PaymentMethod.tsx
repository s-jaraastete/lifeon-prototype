"use client";

import Image from "next/image";
import { Radio, RadioGroup, Field, Label } from "@headlessui/react";

export type PaymentMethodData = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

export const PAYMENT_METHODS: PaymentMethodData[] = [
  {
    id: "webpay",
    title: "Tarjeta débito o crédito",
    description:
      `Serás redirigido de forma segura a la plataforma oficial de
      Webpay Transbank para completar tu transacción. Una vez aprobado el pago,
      volverás automáticamente a LifeOn para activar tu cuenta.`,
    icon: (
      <Image
        src={`/svg/webpay.svg`}
        alt={"logo webpay"}
        width={66}
        height={18}
      />
    ),
  },
  {
    id: "transfer",
    title: "Transferencia bancaria",
    description:
      `Al confirmar tu pedido, te mostraremos los datos
      bancarios de LifeOn y te enviaremos una copia a tu correo.
      Deberás transferir el monto total en un plazo no mayor a 1 hora.`,
    icon: (
      <Image
        src={`/svg/transfer.svg`}
        alt={"logo transferencia bancaria"}
        width={40}
        height={27}
      />
    ),
  },
];

type PaymentMethodProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function PaymentMethod({ value, onChange }: PaymentMethodProps) {
  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === value);

  return (
    <div className="w-full">
      <RadioGroup value={value} onChange={onChange}>
        <Label className="text-black mb-3.75 block">
          Selecciona un método de pago:
        </Label>
        <div className="flex flex-col gap-3.75">
          {PAYMENT_METHODS.map((method) => (
            <Field key={method.id}>
              <Radio
                value={method.id}
                className={`
                  group flex items-center gap-2 lg:gap-4 px-5 py-2.5
                  rounded-xl border border-gray-400 bg-white cursor-pointer
                  transition-all duration-200 hover:bg-gray-50 focus:outline-none
                  data-checked:ring-2 data-checked:ring-secondary focus:ring-secondary
                `}
              >
                <div
                  className="w-16.5 h-6.75 flex items-center shrink-0"
                  aria-hidden="true"
                >
                  {method.icon}
                </div>
                <span className="text-primary-text text-sm lg:text-lg leading-6.5">
                  {method.title}
                </span>
                {value === method.id &&
                  <span className="text-secondary text-[10px] lg:text-sm font-medium lg:font-normal ms-auto">Seleccionado</span>
                }
              </Radio>
            </Field>
          ))}
        </div>
        {selectedMethod && (
          <p className="hidden lg:block text-primary-text text-sm mt-5.5">
            {selectedMethod.description}
          </p>
        )}
      </RadioGroup>
    </div>
  );
}
