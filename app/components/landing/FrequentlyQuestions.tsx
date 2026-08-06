import Accordion from "../ui/Accordion";


interface FrequentlyQuestion {
  items: { title: string; content: string }[];
}

const FrequentlyQuestions = ({ items }: FrequentlyQuestion) => {
  return (
    <section className="flex flex-col items-center justify-center w-full pb-20 lg:pb-25 lg:pt-15">
      <div className="max-w-325 mx-auto w-full flex flex-col gap-5.5 lg:gap-10 px-4 xl:px-0">
        <div className="flex flex-col justify-center items-center gap-2 text-center" data-aos="fade-up">
          <h2 className="font-semibold text-[30px] lg:text-5xl leading-tight text-base-black">
            ¿Tienes dudas? <br /> Te ayudamos a resolverlas
          </h2>
          <p className="lg:text-lg text-center text-primary-text max-w-218">
            Encuentra respuestas sobre LifeOn, su implementación y la forma en que
            puede adaptarse a las necesidades de tu empresa.
          </p>
        </div>
        <div data-aos="fade-up">
          <Accordion
            items={items.map((item) => ({
              ...item,
              content: (
                <div dangerouslySetInnerHTML={{ __html: item.content }} />
              ),
            }))}
          />
        </div>
      </div>
    </section>
  );
};

export default FrequentlyQuestions;