import { LuCheck, LuX } from 'react-icons/lu';

type ComparisonRow = {
  feature: string;
  free: string | boolean;
  starter: string | boolean;
  business: string | boolean;
  custom: string | boolean;
};

const comparisonData: ComparisonRow[] = [
  {
    feature: 'Matriz MIPER',
    free: 'Limited',
    starter: true,
    business: true,
    custom: true,
  },
  {
    feature: 'Programa y Documentación Preventiva',
    free: 'Limited',
    starter: true,
    business: true,
    custom: true,
  },
  {
    feature: 'APR Virtual',
    free: false,
    starter: true,
    business: true,
    custom: true,
  },
  {
    feature: 'APR Virtual Assistant',
    free: false,
    starter: true,
    business: true,
    custom: true,
  },
  {
    feature: 'Cantidad de matrices',
    free: '1',
    starter: 'Hasta 3',
    business: 'Hasta 6',
    custom: 'Personalizado',
  },
  {
    feature: 'Almacenamiento documental',
    free: '20 MB',
    starter: '300 MB',
    business: '1 GB',
    custom: 'Personalizado',
  },
  {
    feature: 'Reportes',
    free: false,
    starter: 'Estándar',
    business: 'Avanzados',
    custom: 'Avanzados',
  },
  {
    feature: 'Soporte',
    free: 'Centro de ayuda',
    starter: 'Soporte por correo',
    business: 'Soporte prioritario',
    custom: 'Soporte prioritario',
  },
  {
    feature: 'Integraciones',
    free: false,
    starter: false,
    business: true,
    custom: true,
  },
  {
    feature: 'Compatibilidad con futuros módulos',
    free: false,
    starter: true,
    business: true,
    custom: true,
  },
];

const renderCell = (val: string | boolean) => {
  if (val === true) {
    return <LuCheck className="w-5 h-5 text-emerald-500 mx-auto" />;
  }
  if (val === false) {
    return <LuX className="w-5 h-5 text-red-500 mx-auto" />;
  }
  return <span className="text-lg text-[#5E5E5E] font-normal">{val}</span>;
};

const PlanComparisonTable = () => {
  return (
    <section className="w-full py-15 px-4 xl:px-0">
      <div className="max-w-325 mx-auto">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center gap-2.5 mb-12">
          <h2 className="text-3xl lg:text-5xl font-semibold text-base-black text-center">
            Compara los planes en detalle
          </h2>
          <p className="lg:text-lg text-center text-primary-text">
            Descubre las diferencias entre cada plan y encuentra el que mejor se adapta a las necesidades de tu organización.
          </p>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[22px] border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-3xl">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-5.5 px-6 text-xl leading-relaxed font-semibold text-base-black w-[32%]">
                    Características
                  </th>
                  <th className="py-5.5 px-6 text-center text-xl leading-relaxed font-semibold text-base-black w-[17%]">
                    Free
                  </th>
                  <th className="py-5.5 px-6 text-center text-xl leading-relaxed font-semibold text-base-black w-[17%]">
                    Starter
                  </th>
                  <th className="py-5.5 px-6 text-center text-xl leading-relaxed font-semibold text-base-black w-[17%]">
                    Business
                  </th>
                  <th className="py-5.5 px-6 text-center text-xl leading-relaxed font-semibold text-base-black w-[17%]">
                    Personalizado
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-color"
                  >
                    <td className="py-5 px-6 text-lg text-base-black">
                      {row.feature}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {renderCell(row.free)}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {renderCell(row.starter)}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {renderCell(row.business)}
                    </td>
                    <td className="py-5 px-4 text-center">
                      {renderCell(row.custom)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanComparisonTable;
