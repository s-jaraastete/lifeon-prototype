const AssociatedCompanies = () => {
  const companyNames = ["ESCONDIDA | BHP", "SPENCE | BHP", "CERRO COLORADO | BHP"];
  
  return (
    <section className="w-full pb-3 px-4 xl:px-0">
      <div className="max-w-325 mx-auto lg:h-[50vh] my-15 lg:my-0 flex flex-col justify-center items-center gap-8">
        <h2 className="text-[24px] lg:text-3xl font-semibold text-center mb-8 lg:mx-30 text-base-black">
          +1.700 empresas usan LifeOn para simplificar el cumplimiento normativo y la gestión de riesgos.
        </h2>
        <div className="hidden lg:flex gap-20 justify-between">
          {companyNames.map((name, index) => (
            <p key={index} className='font-bold text-4xl cursor-default text-gray-600 transition duration-300 hover:text-orange-500 hover:scale-110 origin-bottom inline-block'>
              {name}
            </p>
          ))}
        </div>
          <div className="lg:hidden w-full overflow-hidden">
            <div className="flex animate-marquee w-max">
              {[0, 1].map((group) => (
                <div key={group} className="flex gap-10 shrink-0 mx-5">
                  {companyNames.map((name, index) => (
                    <p key={index} className='font-bold text-3xl text-gray-600 whitespace-nowrap'>
                      {name}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
      </div>
    </section>
  )
};

export default AssociatedCompanies;