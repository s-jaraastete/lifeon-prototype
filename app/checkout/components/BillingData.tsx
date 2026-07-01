import TextInput from '@/app/components/ui/TextInput';
import Select from '@/app/components/ui/Select';
import CheckoutCollapse from "./CheckoutCollapse";

export default function BillingData() {
  return (
    <form className="grid lg:grid-cols-2 gap-5.5">
      <TextInput
        label="Rut empresa"
        placeholder="Rut empresa"
        autoComplete="off"
      />
      <TextInput
        label="Razón social"
        placeholder="Razón social empresa"
        autoComplete="organization"
      />
      <TextInput
        label="Giro comercial"
        placeholder="Giro comercial empresa"
      />
      <TextInput
        label="Correo electrónico"
        placeholder="Correo electrónico"
        type="email"
        autoComplete="email"
      />
      <div className="lg:col-span-2">
        <TextInput
          label="Dirección"
          placeholder="Dirección legal"
          autoComplete="street-address"
        />
      </div>
      <Select
        label="Región"
        placeholder="Selecciona una región"
      >
        <option value="metropolitana">Región Metropolitana</option>
        <option value="valparaiso">Región de Valparaíso</option>
        <option value="biobio">Región del Biobío</option>
      </Select>
      <Select
        label="Comuna"
        placeholder="Selecciona una comuna"
      >
        <option value="santiago">Santiago</option>
        <option value="providencia">Providencia</option>
        <option value="las_condes">Las Condes</option>
      </Select>
    </form>
  )
}
