"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  LuAtom,
  LuSparkles,
  LuSend,
  LuCopy,
  LuCheck,
  LuDownload,
  LuRefreshCw,
  LuShieldAlert,
  LuUserRound,
  LuBot,
  LuFileText,
} from "react-icons/lu";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  aprData?: {
    task: string;
    steps: { step: string; hazard: string; controls: string }[];
    epp: string[];
    normative: string;
  };
}

const PREBUILT_PROMPTS = [
  {
    title: "Trabajos en Altura Física",
    prompt: "Genera un APR para montaje de estructura metálica a 5 metros de altura con uso de canastillo alzaprimado.",
  },
  {
    title: "Excavación y Zanjas > 1.5m",
    prompt: "Genera un APR para excavación profunda de 2.2 metros en terreno tipo C con presencia de ductos de gas.",
  },
  {
    title: "Bloqueo Eléctrico LOTO",
    prompt: "Genera un APR para mantenimiento correctivo en transformador trifásico de 380V aplicando protocolo LOTO.",
  },
  {
    title: "Espacios Confinados",
    prompt: "Genera un APR para limpieza interior de estanque de almacenamiento de aguas residuales con medición de gases.",
  },
];

export default function AprVirtualView() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "ai",
      text: "¡Hola Sergio! Soy tu asistente de **APR Virtual con Inteligencia Artificial**. Puedo generar Análisis de Peligros y Riesgos en terreno, sugerir controles según el DS 44 o redactar procedimientos preventivos de inmediato. ¿En qué tarea necesitas apoyo hoy?",
      timestamp: "Ahora",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleGenerate = (promptText: string) => {
    if (!promptText.trim() || isGenerating) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    // Simulación de respuesta inteligente
    setTimeout(() => {
      let aiResponse: ChatMessage;

      if (promptText.toLowerCase().includes("altura")) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "He generado el **Análisis de Peligros y Riesgos (APR)** para la tarea solicitada, alineado a la normativa chilena DS 44 y guías del ISP.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          aprData: {
            task: "Montaje y Trabajo en Altura Física > 1.80m",
            normative: "DS 44 / DS 594 / Guía Técnica ISP para Selección y Control de SPDC",
            steps: [
              {
                step: "1. Inspección previa del área y equipos de alzaprimado",
                hazard: "Fallas mecánicas del equipo, terreno desnivelado o interferencias aéreas",
                controls: "Checklist diario de plataforma elevadora (PEMB), verificar estabilizadores, delimitación perimetral con conos a 3 metros.",
              },
              {
                step: "2. Ascenso y posicionamiento en punto de trabajo",
                hazard: "Caída a distinto nivel por apertura de barandas o movimientos bruscos",
                controls: "Uso permanente de SPDC (arnés cuerpo entero con doble cabo de vida anclado a punto certificado de la canastilla), velocidad controlada.",
              },
              {
                step: "3. Maniobras de montaje y torque de pernos",
                hazard: "Caída de herramientas y materiales a niveles inferiores",
                controls: "Uso de muñequeras portaherramientas, rodapiés en canastillo, prohibición estricta de tránsito de personas bajo la vertical de izaje.",
              },
            ],
            epp: [
              "Casco con barboquejo de 3 puntas",
              "Arnés de cuerpo completo clase A",
              "Línea de vida doble con amortiguador",
              "Guantes de cabritilla antideslizantes",
              "Calzado de seguridad con puntera dieléctrica",
              "Lentes de seguridad con filtro UV",
            ],
          },
        };
      } else if (promptText.toLowerCase().includes("excavaci") || promptText.toLowerCase().includes("zanja")) {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "He estructurado el **APR para Trabajos de Excavación y Zanjas** cumpliendo con la NCh 349 y el DS 44.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          aprData: {
            task: "Excavación en Terreno y Apertura de Zanjas > 1.5m",
            normative: "Norma Chilena NCh 349.Of1999 / DS 44",
            steps: [
              {
                step: "1. Trazado y verificación de interferencias subterráneas",
                hazard: "Rotura de cañerías de gas, agua o redes eléctricas subterráneas",
                controls: "Cala manual exploratoria previa, revisión de planos as-built con empresas de servicios básicos, detector de metales/cables.",
              },
              {
                step: "2. Excavación mecánica y conformación de taludes",
                hazard: "Derrumbe de paredes por sobrecarga en borde o vibración",
                controls: "Instalación de entibación continua o ángulo de talud según tipo de suelo, acopio de material a distancia mínima de 0.8m del borde.",
              },
              {
                step: "3. Ingreso de personal a la zanja para enfierradura",
                hazard: "Atrapamiento o dificultad para evacuar en caso de emergencia",
                controls: "Escalas de acceso cada 15 metros que sobrepasen 1m el borde, uso de vigía permanente en superficie.",
              },
            ],
            epp: [
              "Casco de seguridad certificado",
              "Calzado de seguridad con caña alta",
              "Chaleco reflectante norma MOP",
              "Guantes de nitrilo / impacto",
              "Protector auditivo tipo fono",
            ],
          },
        };
      } else {
        aiResponse = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `He preparado el **Análisis de Peligros y Riesgos Personalizado** para: "${promptText}".`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          aprData: {
            task: promptText,
            normative: "Decreto Supremo N° 44 / Ley 16.744 SST",
            steps: [
              {
                step: "1. Preparación, delimitación e instrucción diaria",
                hazard: "Falta de coordinación operacional y desconocimiento de riesgos",
                controls: "Charla operacional de 5 minutos, firma de toma de conocimiento, verificación de aptitud física del personal.",
              },
              {
                step: "2. Ejecución de la tarea operacional",
                hazard: "Contacto con fuentes de energía, atrapamiento o sobreesfuerzo",
                controls: "Aplicación estricta de Procedimiento PTS, uso de herramientas inspeccionadas con código de color del mes.",
              },
              {
                step: "3. Orden, aseo y cierre de la jornada",
                hazard: "Caídas al mismo nivel por desorden o residuos en vías de escape",
                controls: "Limpieza inmediata del área, disposición clasificada de residuos y retiro de bloqueos con entrega conforme.",
              },
            ],
            epp: [
              "Casco de seguridad con barbiquejo",
              "Guantes acordes al riesgo",
              "Lentes de seguridad antiempañantes",
              "Calzado de seguridad dieléctrico",
              "Protector solar FPS 50+",
            ],
          },
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] gap-3 animate-in fade-in duration-300">
      {/* Encabezado del Asistente */}
      <div className="bg-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xs">
            <LuAtom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">APR Virtual con Inteligencia Artificial</h2>
              <span className="bg-[#DBEAFE] text-[#155DFC] text-[10px] font-bold px-2 py-0.5 rounded-full">
                LifeOn AI 2.0
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Generador instantáneo de Análisis de Peligros y Riesgos en terreno alineado al DS 44.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessages([
              {
                id: `reset-${Date.now()}`,
                sender: "ai",
                text: "Chat reiniciado. ¿Qué nuevo APR o matriz preventiva deseas estructurar?",
                timestamp: "Ahora",
              },
            ])
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition cursor-pointer border border-gray-200"
        >
          <LuRefreshCw className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      {/* Prompts Sugeridos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 flex-shrink-0 pl-1">
          <LuSparkles className="w-3.5 h-3.5 text-teal-600" /> Sugerencias:
        </span>
        {PREBUILT_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleGenerate(p.prompt)}
            className="text-xs font-medium text-gray-700 bg-white hover:bg-teal-50 hover:text-teal-800 border border-gray-200/90 rounded-xl px-3 py-1.5 whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Área Central de Conversación */}
      <div className="flex-1 bg-white rounded-2xl p-4 shadow-xs overflow-y-auto flex flex-col gap-4 border border-gray-100">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3 max-w-3xl",
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div
              className={clsx(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-2xs mt-1",
                msg.sender === "user"
                  ? "bg-purple-600"
                  : "bg-gradient-to-tr from-teal-600 to-emerald-500"
              )}
            >
              {msg.sender === "user" ? "SJ" : <LuAtom className="w-4 h-4" />}
            </div>

            {/* Burbuja de Contenido */}
            <div
              className={clsx(
                "p-4 rounded-2xl text-xs sm:text-sm leading-relaxed",
                msg.sender === "user"
                  ? "bg-teal-600 text-white rounded-tr-xs"
                  : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-xs shadow-2xs"
              )}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Ficha Estructurada de APR si existe */}
              {msg.aprData && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-teal-200 text-gray-900 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
                        Ficha Técnica APR
                      </span>
                      <h4 className="text-sm font-bold text-gray-900">{msg.aprData.task}</h4>
                    </div>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                      {msg.aprData.normative}
                    </span>
                  </div>

                  {/* Pasos y Controles */}
                  <div className="flex flex-col gap-2.5">
                    {msg.aprData.steps.map((step, idx) => (
                      <div key={idx} className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100">
                        <p className="font-semibold text-gray-900 text-xs">{step.step}</p>
                        <p className="text-red-600 text-[11px] mt-0.5 font-medium">
                          ⚠️ Peligro: {step.hazard}
                        </p>
                        <p className="text-teal-800 text-[11px] mt-0.5">
                          🛡️ Medida de Control: {step.controls}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* EPP Requeridos */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                      Equipos de Protección Personal (EPP Obligatorios):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.aprData.epp.map((epp, idx) => (
                        <span
                          key={idx}
                          className="bg-teal-50 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-teal-200"
                        >
                          ✓ {epp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Acciones de la Ficha */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          msg.id,
                          `APR: ${msg.aprData?.task}\n\nPasos y Controles:\n${msg.aprData?.steps
                            .map((s) => `- ${s.step}\n  Peligro: ${s.hazard}\n  Controles: ${s.controls}`)
                            .join("\n\n")}\n\nEPP: ${msg.aprData?.epp.join(", ")}`
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <LuCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <LuCopy className="w-3.5 h-3.5" />
                          <span>Copiar APR</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        alert(`Descargando Ficha APR Oficial en PDF para: ${msg.aprData?.task}`)
                      }
                      className="flex items-center gap-1 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition cursor-pointer"
                    >
                      <LuDownload className="w-3.5 h-3.5" />
                      Descargar PDF
                    </button>
                  </div>
                </div>
              )}

              <span
                className={clsx(
                  "text-[10px] block mt-1",
                  msg.sender === "user" ? "text-teal-100 text-right" : "text-gray-400"
                )}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center animate-spin">
              <LuAtom className="w-4 h-4" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span>Analizando riesgos operacionales y normativa DS 44...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Barra de Entrada de Mensaje */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate(input);
        }}
        className="bg-white rounded-2xl p-2.5 shadow-xs border border-gray-100 flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe una tarea o riesgo (ej: 'Trabajo en caliente con soplete oxicorte')..."
          className="flex-1 bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || isGenerating}
          className="p-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition cursor-pointer flex items-center justify-center flex-shrink-0"
        >
          <LuSend className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
