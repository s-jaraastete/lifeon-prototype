import Image from 'next/image';


const ManagementMap = () => {
  return (
    <section className='w-full py-15'>
      <div className='max-w-325 mx-auto bg-gray-200 p-10 rounded-3xl flex flex-col gap-15'>
        <div>
          <h1 className='text-5xl font-semibold text-center mx-30 leading-tight'>
          Centraliza toda tu gestión preventiva en<span className='text-secondary'> una sola plataforma</span>
          </h1>
          <p className='text-xl text-primary-text text-center mt-6 mx-20'>
            Olvídate de planillas, correos y documentos dispersos. LifeOn conecta personas, procesos y controles para que toda la gestión de riesgos esté siempre actualizada y disponible en tiempo real.
          </p>
        </div>
        <div className='flex justify-center bg-white rounded-3xl'>
          <Image src="/images/management-map.png" alt="Management Map" width={900} height={800} className='mx-auto mt-10' />
        </div>
      </div>
    </section>
  )
}

export default ManagementMap;