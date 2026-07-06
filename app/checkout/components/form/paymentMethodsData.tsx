export type PaymentMethodData = {
  id: string
  title: string
  icon: React.ReactNode
}

export const PAYMENT_METHODS: PaymentMethodData[] = [
  {
    id: "webpay",
    title: "Tarjeta débito o crédito (Transbank)",
    icon: (
      <span className="text-[#c01861] font-bold text-xs">webpay.cl</span>
    ),
  },
  {
    id: "transfer",
    title: "Transferencia bancaria",
    icon: (
      <div className="text-[8px] leading-tight text-center font-medium text-gray-600">
        TRANSFE<br />RENCIA
      </div>
    ),
  },
]
