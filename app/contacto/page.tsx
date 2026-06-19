import ContactForm from "./components/ContactForm";

export default function ContactPage() {
  return (
    <div className="w-full px-6 py-25 bg-gray-200">
      <div className="flex flex-col mx-auto max-w-[1300px] lg:flex-row gap-15">
        <div className="flex-1 flex flex-col">
          <h1 className="text-5xl font-bold mb-2.5">
            Completa el formulario y te contactaremos pronto
          </h1>
          <p className="text-[24px] leading-7.5 text-primary-text">
            Un especialista de nuestro equipo se comunicará contigo para responder tus dudas, entender tus necesidades y ayudarte a avanzar con total claridad.
          </p>
        </div>
        <div className="flex-1">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
