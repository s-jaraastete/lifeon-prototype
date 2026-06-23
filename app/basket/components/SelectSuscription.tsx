"use client";

import Select from '@/app/components/ui/Select'


type Props = {
  value?: string
  onValueChange?: (value: string) => void
}

const SelectSuscription = ({ value, onValueChange }: Props) => {
  const plan = value ?? 'plan-mensual'

  return (
    <div className="flex flex-col mb-5">
      <label className="block font-medium mb-2">Suscripción</label>
        <Select value={plan} onValueChange={onValueChange}>
          <option value="plan-mensual">Suscripción mensual</option>
          <option value="plan-anual" className="flex flex-col">Suscripción anual</option>
        </Select>
    </div> 
  )
};

export default SelectSuscription;