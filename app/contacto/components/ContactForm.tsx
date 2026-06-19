import Link from "next/link";
import TextInput from "../../components/ui/TextInput";
import TextArea from "../../components/ui/TextArea";

const ContactForm = () => {
  return (
    <form className="bg-white p-7.5 rounded-[14px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TextInput
          label="Nombre"
          placeholder="Tu nombre"
        />
        <TextInput
          label="Apellidos"
          placeholder="Tus apellidos"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-4">
        <div className="md:col-span-6">
          <TextInput
            label="Correo electrónico"
            placeholder="Tu correo electrónico"
            type="email"
            className="md:col-span-5"
          />
        </div>
        <div className="md:col-span-4">
          <TextInput
            label="Teléfono"
            placeholder="+56"
            type="tel"
          />
        </div>
      </div>
      <div className="mb-4">
        <TextInput
          label="Empresa"
          placeholder="Nombre de tu empresa"
        />
      </div>
      <div className="mb-6">
        <TextArea
          label="Tu mensaje"
          placeholder="Escribe aquí como podemos ayudarte..."
        />
      </div>
      <button className="w-full font-medium bg-primary px-4 py-3 rounded-xl text-white hover:bg-red-600 transition duration-200 cursor-pointer">
        Enviar mensaje
      </button>
      <p className="mt-7.5 text-[12px] text-primary-text text-center">
        Al enviar tu información, autorizas a LifeOn a procesar tus datos
        personales para fines comerciales y de contacto relacionados con
        nuestros productos y servicios, conforme a nuestra{" "}
        <Link href="/" className="underline">
          Política de Privacidad
        </Link>
        .
      </p>
    </form>
  );
};

export default ContactForm;
