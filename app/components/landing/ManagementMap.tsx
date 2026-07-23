import Image from 'next/image';


const ManagementMap = () => {
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto bg-gray-200 px-5 py-10 lg:px-10 rounded-3xl flex flex-col gap-15">
        <div>
          <h4 className="text-[30px] lg:text-5xl font-semibold text-center lg:mx-30 leading-tight">
            Centraliza toda tu gestión preventiva en
            <span className="text-secondary"> una sola plataforma</span>
          </h4>
          <p className="lg:text-xl text-primary-text text-center mt-2.5 lg:mt-6 lg:mx-20">
            Olvídate de planillas, correos y documentos dispersos. LifeOn
            conecta personas, procesos y controles para que toda la gestión de
            riesgos esté siempre actualizada y disponible en tiempo real.
          </p>
        </div>
        <div className="hidden lg:flex justify-center bg-white rounded-3xl">
          <Image
            src="/images/management-map.png"
            alt="Management Map"
            width={900}
            height={800}
            className="mx-auto mt-10"
          />
        </div>
        <Image
          src="/images/placeholder-mobile.png"
          alt="Placeholder"
          width={330}
          height={488}
          className="w-full sm:w-auto mx-auto lg:hidden"
        />
      </div>
    </section>
  );
}

export default ManagementMap;