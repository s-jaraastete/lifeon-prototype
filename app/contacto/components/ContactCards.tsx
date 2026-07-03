import Card from '@/app/components/ui/Card';

// Icons
import { LuBuilding2, LuHeadset, LuPhone } from 'react-icons/lu';


const ContactCards = () => {
  return (
    <div className="flex flex-col mx-auto max-w-325 gap-7.5 pb-25 -mt-5">
      <h2 className="text-5xl font-semibold leading-14.5 text-center">
        Canales de atención
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5.5">
        <Card
          title="Soporte clientes"
          icon={LuHeadset}
          content={
            <>
              <p>Teléfono: +56 9 8877 6655</p>
              <p>Mail: soporte@lifeon.cl</p>
            </>
          }
        />
        <Card
          title="Área comercial"
          icon={LuPhone}
          content={
            <>
              <p>Teléfono: +56 9 8877 6655</p>
              <p>Mail: ventas@lifeon.cl</p>
            </>
          }
        />
        <Card
          title="Oficinas"
          icon={LuBuilding2}
          content={
            <>
              <p>Dirección Número, Comuna, Chile</p>
              <p>Teléfono: +56 9 8877 6655</p>
            </>
          }
        />
      </div>
    </div>
  )
}

export default ContactCards;