import { LuHeadset, LuPhone, LuBuilding2 } from "react-icons/lu";
import ContactForm from "./components/ContactForm";
import ContactCard from "./components/ContactCard";

export default function ContactPage() {
  return (
    <div className="w-full px-6 py-25 bg-gray-200">
      <div className="flex flex-col lg:flex-row mx-auto max-w-[1300px] gap-15">
        <div className="flex-1 flex flex-col">
          <h1 className="text-5xl font-bold mb-2.5">
            Completa el formulario y te contactaremos pronto
          </h1>
          <p className="text-[24px] leading-7.5 text-primary-text">
            Un especialista de nuestro equipo se comunicará contigo para responder tus dudas,
            entender tus necesidades y ayudarte a avanzar con total claridad.
          </p>
        </div>
        <div className="flex-1">
          <ContactForm />
        </div>
      </div>
      <div className="mx-auto max-w-[1300px] mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5.5">
          <ContactCard
            icon={LuHeadset}
            title="Soporte clientes"
            content={
              <>
                <p>Teléfono: +56 9 8877 6655</p>
                <p>Mail: soporte@lifeon.cl</p>
              </>
            }
          />
          <ContactCard
            icon={LuPhone}
            title="Área comercial"
            content={
              <>
                <p>Teléfono: +56 9 8877 6655</p>
                <p>Mail: ventas@lifeon.cl</p>
              </>
            }
          />
          <ContactCard
            icon={LuBuilding2}
            title="Oficinas"
            content={
              <>
                <p>Dirección Número, Comuna, Chile</p>
                <p>Teléfono: +56 9 8877 6655</p>
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
