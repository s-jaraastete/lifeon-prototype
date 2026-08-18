import Image from "next/image";
import { LuCheck } from "react-icons/lu";

const MiperInfo = () => {
  const listItems = [
    "Registro estructurado",
    "Información siempre organizada",
    "Actualización sencilla",
    "Gestión colaborativa",
  ];

  return (
    <section className="w-full py-18 px-4 xl:px-0">
      <div className="max-w-325 mx-auto flex flex-col lg:flex-row items-center gap-10">
        <div className="flex flex-col items-center lg:items-start justify-center gap-5.5 text-center lg:text-left w-full lg:w-1/2">
          <h2 className="text-[30px] lg:text-5xl font-semibold text-base-black leading-tight">
            <span className="text-secondary">Crear y administrar</span> matrices nunca fue tan simple
          </h2>
          <p className="lg:text-lg text-primary-text">
            Registra nuevos riesgos mediante un flujo guiado que organiza la
            información paso a paso, reduciendo errores y manteniendo una
            estructura consistente para toda la organización.
          </p>
          <ul className="mt-2.5 flex flex-col gap-4 text-left w-full">
            {listItems.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 lg:text-lg text-primary-text"
              >
                <LuCheck className="w-5 h-5 mt-1 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-1/2 h-80 lg:h-120 relative">
          <Image
            src="/images/miper-info.png"
            alt="Crear y administrar matrices en LifeOn"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default MiperInfo;
