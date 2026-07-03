import ContactSection from "../components/landing/ContactSection";
import ContactCards from "./components/ContactCards";


const ContactPage = () => {
  let allSlots: unknown[] = [];
  
  return (
    <div className="w-full bg-gray-200 pt-25">
      <ContactSection
        title="Estamos aquí para ayudarte a transformar tu gestión de seguridad"
        description="¿Tienes dudas sobre cómo implementar el Paquete Base o los próximos módulos especializados? Elige el día y la hora que más te acomoden para una videollamada personalizada con nustro equipo."
        allSlots={allSlots}
        padding={false}
      />
      <ContactCards />
    </div>
  )
}

export default ContactPage;