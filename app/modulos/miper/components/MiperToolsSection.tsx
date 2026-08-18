"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

type ToolStep = {
  title: string;
  description: string;
  image: string;
};

const tools: ToolStep[] = [
  {
    title: "Registra y administra tus matrices desde un único lugar",
    description:
      "Crea nuevas matrices IPER, organiza la información por áreas, procesos o tareas y mantén todos los registros centralizados dentro de la plataforma.",
    image: "/images/miper-tool-1.png",
  },
  {
    title: "Evalúa riesgos con una metodología estructurada",
    description:
      "Documenta peligros, evalúa el nivel de riesgo y registra los criterios utilizados por tu organización para mantener un proceso consistente.",
    image: "/images/miper-tool-2.png",
  },
  {
    title: "Gestiona medidas de control y planes de acción",
    description:
      "Relaciona cada riesgo con las medidas de control correspondientes y realiza seguimiento a su implementación desde una vista centralizada.",
    image: "/images/miper-tool-placeholder.png",
  },
  {
    title: "Conserva toda la trazabilidad del proceso",
    description:
      "Cada modificación queda registrada para facilitar el seguimiento de cambios, responsables y decisiones tomadas durante la gestión.",
    image: "/images/miper-tool-4.png",
  },
  {
    title: "Visualiza el estado de la gestión en tiempo real",
    description:
      "Consulta indicadores, riesgos pendientes y medidas implementadas mediante paneles diseñados para facilitar el seguimiento y la toma de decisiones.",
    image: "/images/miper-tool-placeholder.png",
  },
];

const MiperToolsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const activeTool = tools[activeIndex];
  const intervalMs = 8000;

  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setProgress(0);
    }, 0);

    const start = window.performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const nextProgress = Math.min(elapsed / intervalMs, 1);
      setProgress(nextProgress);

      if (nextProgress < 1) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);

    const timer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % tools.length);
    }, intervalMs);

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(timer);
      window.cancelAnimationFrame(rafId);
    };
  }, [activeIndex, intervalMs]);

  return (
    <section className="w-full py-18 px-4 xl:px-0">
      <div className="max-w-325 mx-auto flex flex-col gap-8 lg:gap-10">
        <div className="max-w-280 mx-auto text-center flex flex-col gap-2.5">
          <h2 className="text-[30px] lg:text-5xl font-semibold text-base-black leading-tight">
            Explora las <span className="text-secondary">principales herramientas</span> del módulo MIPER
          </h2>
          <p className="text-sm lg:text-lg text-primary-text max-w-240 mx-auto">
            Cada funcionalidad ha sido diseñada para simplificar la gestión de la
            Matriz IPER, manteniendo la información organizada, accesible y
            disponible para todo el equipo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-10 lg:gap-22.5 items-center">
          <div className="relative w-full h-80 lg:h-130 rounded-3xl bg-white overflow-hidden">
            {tools.map((tool, index) => (
              <div
                key={index}
                className={clsx(
                  "absolute inset-0 p-4 transition-opacity duration-500 ease-in-out",
                  index === activeIndex ? "opacity-100" : "opacity-0",
                )}
              >
                <Image
                  src={tool.image}
                  alt={tool.title}
                  fill
                  className="object-contain"
                  sizes="(min-width: 1024px) 55vw, 100vw"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:gap-5">
            {tools.map((tool, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={tool.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-pressed={active}
                  className={clsx(
                    "flex items-stretch gap-7.5 text-base- text-left transition duration-400",
                    !active && "cursor-pointer",
                  )}
                >
                  <div className="relative w-1.25 min-h-14 self-stretch overflow-hidden rounded-full bg-teal-100 shrink-0">
                    {active && (
                      <span
                        key={activeIndex}
                        className="absolute left-0 top-0 h-full w-full origin-top rounded-full bg-secondary"
                        style={{ transform: `scaleY(${progress})` }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={clsx(
                        "text-lg lg:text-2xl text-base-black font-medium leading-tight w-[90%]",
                        !active && "text-gray-600 hover:text-gray-700",
                      )}
                    >
                      {tool.title}
                    </h3>
                    <div
                      className="grid transition-[grid-template-rows] duration-500 ease-in-out"
                      style={{ gridTemplateRows: active ? "1fr" : "0fr" }}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-2.5 text-sm lg:text-lg text-primary-text">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MiperToolsSection;
