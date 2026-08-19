import WorkFlowCard from '../../components/WorkFlowCard';
import workFlowCardsData from '../data/workFlowCardsData';


const WorkFlowMiperSection = () => {
  return (
    <section className="w-full py-18 px-4 xl:px-0">
      <div className="max-w-325 mx-auto flex flex-col gap-15">
        <div>
          <h2 className="text-[30px]  font-semibold mb-4 text-base-black text-center lg:leading-14 lg:text-5xl">
            Un flujo de trabajo pensado para <span className='text-secondary'>simplificar</span> la gestión
          </h2>
          <p className="text-lg text-center mx-12 text-primary-text">
            Desde la identificación de peligros hasta el seguimiento de las medidas de control, el módulo MIPER acompaña cada etapa de la gestión de riesgos en un flujo continuo y estructurado.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-17.5'>
          {workFlowCardsData.map((items) => (
            <WorkFlowCard
              key={items.id}
              id={items.id}
              title={items.title}
              description={items.description}
            />
          ))}
          </div>
      </div>
    </section>
  )
};

export default WorkFlowMiperSection;