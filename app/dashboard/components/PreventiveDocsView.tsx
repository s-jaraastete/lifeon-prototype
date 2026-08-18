"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuFileText,
  LuUpload,
  LuDownload,
  LuSearch,
  LuFilter,
  LuCircleCheck,
  LuClock,
  LuCircleAlert,
  LuPlus,
  LuCalendar,
  LuCheck,
  LuX,
  LuEye,
} from "react-icons/lu";

export interface DocItem {
  id: string;
  code: string;
  title: string;
  category: "Programa SST" | "Procedimiento PTS" | "Protocolo Minsal" | "Registro EPP";
  version: string;
  status: "Vigente" | "Por Vencer" | "En Revisión";
  author: string;
  date: string;
  expiryDate: string;
  fileSize: string;
}

const INITIAL_DOCS: DocItem[] = [
  {
    id: "DOC-01",
    code: "PRG-SST-2026",
    title: "Programa Anual de Prevención de Riesgos y Salud en el Trabajo",
    category: "Programa SST",
    version: "v2.1",
    status: "Vigente",
    author: "Sergio A. Jara Astete",
    date: "02-01-2026",
    expiryDate: "31-12-2026",
    fileSize: "2.4 MB",
  },
  {
    id: "DOC-02",
    code: "PTS-ALT-01",
    title: "Procedimiento de Trabajo Seguro en Altura Física > 1.80m",
    category: "Procedimiento PTS",
    version: "v3.0",
    status: "Vigente",
    author: "Sergio A. Jara Astete",
    date: "15-01-2026",
    expiryDate: "15-01-2027",
    fileSize: "1.1 MB",
  },
  {
    id: "DOC-03",
    code: "PTS-EXC-02",
    title: "Procedimiento de Excavaciones, Zanjas y Entibaciones (NCh 349)",
    category: "Procedimiento PTS",
    version: "v2.0",
    status: "Vigente",
    author: "Sergio A. Jara Astete",
    date: "20-01-2026",
    expiryDate: "20-01-2027",
    fileSize: "1.8 MB",
  },
  {
    id: "DOC-04",
    code: "PROT-TMERT-01",
    title: "Protocolo de Vigilancia de Factores de Riesgo Ergonómico TMERT",
    category: "Protocolo Minsal",
    version: "v1.2",
    status: "Por Vencer",
    author: "Sergio A. Jara Astete",
    date: "10-08-2025",
    expiryDate: "28-02-2026",
    fileSize: "980 KB",
  },
  {
    id: "DOC-05",
    code: "RIOHS-2026",
    title: "Reglamento Interno de Orden, Higiene y Seguridad (Actualización Ley Karin)",
    category: "Programa SST",
    version: "v4.0",
    status: "Vigente",
    author: "Sergio A. Jara Astete",
    date: "01-01-2026",
    expiryDate: "01-01-2027",
    fileSize: "3.2 MB",
  },
  {
    id: "DOC-06",
    code: "REG-EPP-08",
    title: "Registro Digital de Entrega y Capacitación de EPP (DS 594)",
    category: "Registro EPP",
    version: "v1.0",
    status: "Vigente",
    author: "Sergio A. Jara Astete",
    date: "05-02-2026",
    expiryDate: "Indefinido",
    fileSize: "640 KB",
  },
];

export default function PreventiveDocsView() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [activeTab, setActiveTab] = useState<string>("Todos");
  const [search, setSearch] = useState("");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState<DocItem["category"]>("Procedimiento PTS");
  const [newExpiry, setNewExpiry] = useState("31-12-2026");

  const programActivities = [
    { title: "Inspección mensual de equipos de izaje y grúas", done: true, month: "Enero" },
    { title: "Capacitación obligatoria: Uso correcto de SPDC", done: true, month: "Enero" },
    { title: "Revisión y actualización de Matriz IPER Obras Civiles", done: true, month: "Febrero" },
    { title: "Simulacro de evacuación por sismo e incendio", done: true, month: "Febrero" },
    { title: "Medición de ruido y agentes químicos en taller", done: false, month: "Marzo" },
    { title: "Auditoría interna de cumplimiento DS 44", done: false, month: "Marzo" },
  ];

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) {
      alert("Por favor completa el título y código del documento.");
      return;
    }

    const newDoc: DocItem = {
      id: `DOC-0${docs.length + 1}`,
      code: newCode.toUpperCase(),
      title: newTitle,
      category: newCategory,
      version: "v1.0",
      status: "Vigente",
      author: "Sergio A. Jara Astete",
      date: new Date().toLocaleDateString("es-CL"),
      expiryDate: newExpiry,
      fileSize: "1.2 MB",
    };

    setDocs([newDoc, ...docs]);
    setIsUploadModalOpen(false);
    setNewTitle("");
    setNewCode("");
  };

  const filteredDocs = docs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.author.toLowerCase().includes(search.toLowerCase());

    const matchesTab = activeTab === "Todos" || d.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Programa y Documentación Preventiva
            </h2>
            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              94,2% Cumplimiento
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestión documental, protocolos normativos Minsal y seguimiento del Programa Anual SST.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <LuUpload className="w-4 h-4" />
          Cargar Documento
        </button>
      </div>

      {/* Tarjeta de Resumen del Programa Anual SST */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
              Estado del Programa Anual 2026 (DS 44)
            </span>
            <h3 className="text-lg font-bold mt-1">
              48 de 51 Actividades Preventivas Ejecutadas
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              Próxima auditoría del organismo administrador programada para el 15 de marzo de 2026.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <div>
              <p className="text-[11px] text-gray-300">Tasa de Cumplimiento</p>
              <p className="text-2xl font-black text-teal-300">94.2%</p>
            </div>
            <div className="w-24 bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div className="bg-teal-400 h-2.5 rounded-full" style={{ width: "94.2%" }}></div>
            </div>
          </div>
        </div>

        {/* Lista de Actividades Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-white/10">
          {programActivities.map((act, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl text-xs border border-white/5"
            >
              <span
                className={clsx(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0",
                  act.done ? "bg-emerald-400 text-gray-950 font-bold" : "bg-amber-400/80 text-gray-950 font-bold"
                )}
              >
                {act.done ? "✓" : "•"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-gray-200">{act.title}</p>
                <span className="text-[10px] text-gray-400">{act.month} • {act.done ? "Completado" : "Pendiente"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pestañas y Filtros Documentales */}
      <div className="bg-white rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Pestañas */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["Todos", "Programa SST", "Procedimiento PTS", "Protocolo Minsal", "Registro EPP"].map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex-shrink-0",
                  activeTab === tab
                    ? "bg-teal-600 text-white shadow-xs font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o título..."
            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Listado de Documentos */}
      <div className="bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold">
                <th className="py-3.5 px-4">Código / Documento</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-4">Versión</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Vigencia</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No se encontraron documentos en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-teal-50/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                          <LuFileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{doc.title}</p>
                          <span className="text-[11px] text-gray-500 font-mono">{doc.code} • {doc.fileSize}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600">{doc.category}</td>

                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">{doc.version}</td>

                    <td className="py-3.5 px-4 text-gray-600">{doc.author}</td>

                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      <span>Emitido: {doc.date}</span>
                      <br />
                      <span>Vence: {doc.expiryDate}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                          doc.status === "Vigente" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                          doc.status === "Por Vencer" && "bg-amber-50 text-amber-700 border border-amber-200",
                          doc.status === "En Revisión" && "bg-blue-50 text-blue-700 border border-blue-200"
                        )}
                      >
                        <span
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            doc.status === "Vigente" && "bg-emerald-500",
                            doc.status === "Por Vencer" && "bg-amber-500",
                            doc.status === "En Revisión" && "bg-blue-500"
                          )}
                        />
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => alert(`Previsualizando ${doc.title} (${doc.code})\nResponsable: ${doc.author}\nEstado: ${doc.status}`)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          title="Ver documento"
                        >
                          <LuEye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Descargando archivo: ${doc.code}.pdf (${doc.fileSize})`)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          title="Descargar PDF"
                        >
                          <LuDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Subir Nuevo Documento */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Cargar Documento Preventivo</h3>
            <p className="text-xs text-gray-500 mb-4">
              Registra un nuevo procedimiento, formato o protocolo en la biblioteca de LifeOn.
            </p>

            <form onSubmit={handleUpload} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Código del Documento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: PTS-BLOQ-05"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Título del Documento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Procedimiento de Bloqueo y Tarjeteo LOTO en Planta"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as DocItem["category"])}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-gray-50"
                  >
                    <option value="Procedimiento PTS">Procedimiento PTS</option>
                    <option value="Programa SST">Programa SST</option>
                    <option value="Protocolo Minsal">Protocolo Minsal</option>
                    <option value="Registro EPP">Registro EPP</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                  />
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50">
                <LuUpload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-700">Arrastra tu archivo PDF o Word aquí</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Tamaño máximo: 25 MB</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
