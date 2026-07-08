'use client'

import { useState, type FormEventHandler } from 'react'
import createOrderCheckout from './create_order_checkout'

type CheckoutFormState = {
  first_name: string
  last_name: string
  email: string
  phone: string
  name: string
  company_rut: string
  billing_email: string
  business_activity: string
  billing_address: string
  region_id: string
  commune_id: string
  pack_id: string
  billing_period: 'monthly' | 'yearly'
  coupon_code: string
  payment_method: 'webpay'
}

const initialFormState: CheckoutFormState = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  name: '',
  company_rut: '',
  billing_email: '',
  business_activity: '',
  billing_address: '',
  region_id: '',
  commune_id: '',
  pack_id: '1', // Debe venir desde el carrito en el local storage
  billing_period: 'monthly', // Debe venir desde el carrito en el local storage
  coupon_code: '', // Debe venir desde el carrito en el local storage
  payment_method: 'webpay', // Debe ser un botón o algo que agregué el payment_method al payload
}

// Para cargar regiones y comunas/ciudad:
/* 
- Cargas las regiones desde el endpoint de regiones (/regions/all/).
- Pintas esas regiones en el select o dropdown.
- Cuando el usuario elige una región, guardas su id en una variable de estado (useState).
- Ese id se usa como filtro para el Autocomplete de comunas o ciudades (es el mismo endpoint).
- El Autocomplete consulta el endpoint filtrado por región. Ej. /communes/all/?region=4 (ese 4 es el id de la region que está en la variable de estado)

Ej. const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  /communes/all/?region=${selectedRegionId}
*/

const EjemploUso = () => {
  const [form, setForm] = useState<CheckoutFormState>(initialFormState)
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  const handleChange = (
    field: keyof CheckoutFormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setIsPending(true)
    setMessage(null)
    setOrderNumber(null)

    try {
      const payload: CheckoutOrderPayload = {
        company: {
          name: form.name,
          company_rut: form.company_rut,
          business_activity: form.business_activity || null,
          billing_email: form.billing_email,
          billing_address: form.billing_address || null,
          region_id: Number(form.region_id),
          commune_id: Number(form.commune_id),
        },
        contact: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || null,
        },
        pack_id: Number(form.pack_id),
        billing_period: form.billing_period,
        coupon_code: form.coupon_code || null,
        payment_method: form.payment_method,
      }

      const formData = new FormData(event.currentTarget)
      const response = await createOrderCheckout(payload, null, formData)

      if (response.status === 'success') {
        setOrderNumber(response.data?.order_number ?? null)
        setMessage('Orden creada correctamente.')
        return
      }

      setMessage('No se pudo crear la orden.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form className="grid gap-4 max-w-2xl" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="first_name"
          placeholder="Nombre"
          value={form.first_name}
          onChange={(e) => handleChange('first_name', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="last_name"
          placeholder="Apellido"
          value={form.last_name}
          onChange={(e) => handleChange('last_name', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="email"
          placeholder="Correo"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="phone"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="name"
          placeholder="Razón social"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="company_rut"
          placeholder="RUT empresa"
          value={form.company_rut}
          onChange={(e) => handleChange('company_rut', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="billing_email"
          placeholder="Correo de facturación"
          type="email"
          value={form.billing_email}
          onChange={(e) => handleChange('billing_email', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="billing_address"
          placeholder="Dirección"
          value={form.billing_address}
          onChange={(e) => handleChange('billing_address', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="region_id"
          placeholder="ID región"
          inputMode="numeric"
          value={form.region_id}
          onChange={(e) => handleChange('region_id', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="commune_id"
          placeholder="ID comuna"
          inputMode="numeric"
          value={form.commune_id}
          onChange={(e) => handleChange('commune_id', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <input
          name="pack_id"
          placeholder="Pack ID"
          inputMode="numeric"
          value={form.pack_id}
          onChange={(e) => handleChange('pack_id', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
        <select
          name="billing_period"
          value={form.billing_period}
          onChange={(e) => handleChange('billing_period', e.target.value as 'monthly' | 'yearly')}
          className="rounded-md border border-gray-300 px-4 py-2"
        >
          <option value="monthly">Mensual</option>
          <option value="yearly">Anual</option>
        </select>
        <input
          name="coupon_code"
          placeholder="Cupón"
          value={form.coupon_code}
          onChange={(e) => handleChange('coupon_code', e.target.value)}
          className="rounded-md border border-gray-300 px-4 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Creando orden...' : 'Crear orden'}
      </button>

      {message && <p className="text-sm">{message}</p>}
      {orderNumber && <p className="text-sm font-semibold">Orden: {orderNumber}</p>}
    </form>
  )
}

export default EjemploUso;