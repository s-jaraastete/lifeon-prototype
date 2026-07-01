import TextInput from '@/app/components/ui/TextInput';

export default function PersonalData() {
  return (
    <form className="grid lg:grid-cols-2 gap-5.5">
      <TextInput
        label="Nombre"
        placeholder="Tu nombre"
        autoComplete="given-name"
      />
      <TextInput
        label="Apellidos"
        placeholder="Tu apellido"
        autoComplete="family-name"
      />
      <TextInput
        label="Correo electrónico"
        placeholder="Tu correo electrónico"
        type="email"
        autoComplete="email"
      />
      <TextInput
        label="Teléfono"
        placeholder="+56"
        type="tel"
        autoComplete="tel"
      />
    </form>
  )
}
