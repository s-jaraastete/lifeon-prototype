"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import clsx from "clsx";
import {
  LuX,
  LuArrowRight,
  LuArrowLeft,
  LuCheck,
  LuLayers,
  LuSearch,
  LuAtom,
  LuSparkles,
  LuTable,
  LuSlidersHorizontal,
} from "react-icons/lu";

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-sidebar",
    title: "Menú Principal y Módulos",
    description:
      "Navega entre tus matrices de riesgo IPER, la biblioteca documental preventiva, el programa anual de seguridad y el generador APR Virtual con IA.",
    icon: LuLayers,
    preferredPlacement: "right",
  },
  {
    targetId: "tour-topbar-search",
    title: "Buscador Global y Alertas DS 44",
    description:
      "Encuentra al instante cualquier matriz, procedimiento de trabajo seguro (PTS) o faena. Además, recibe avisos automáticos de cumplimiento normativo.",
    icon: LuSearch,
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-apr-quick",
    title: "Generación Asistida con APR Virtual",
    description:
      "Crea análisis preventivos de riesgo en segundos para cuadrillas y faenas a partir de sencillos prompts guiados por nuestro motor de inteligencia artificial.",
    icon: LuAtom,
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-kpis",
    title: "Tablero de Indicadores en Tiempo Real",
    description:
      "Monitorea de un vistazo el cumplimiento global de tu programa preventivo, las matrices vigentes, los peligros críticos y las auditorías programadas.",
    icon: LuSparkles,
    preferredPlacement: "bottom",
  },
  {
    targetId: "tour-risk-map",
    title: "Gestión y Mapa de Riesgos IPER",
    description:
      "Visualiza la distribución de riesgos según la metodología que configuraste (DS 44 / ISL o Matriz 5×5) y administra las medidas preventivas implementadas.",
    icon: LuTable,
    preferredPlacement: "top",
  },
  {
    targetId: "tour-user-profile",
    title: "Preferencias y Configuración del Espacio",
    description:
      "Modifica en cualquier momento tu nivel de experiencia técnica, acompañamiento, datos de faena o metodología desde la sección 'Experiencia y metodologías'.",
    icon: LuSlidersHorizontal,
    preferredPlacement: "bottom",
  },
];

interface InteractivePlatformTourProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export default function InteractivePlatformTour({
  isOpen,
  onClose,
  onFinish,
}: InteractivePlatformTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;

  // Actualizar la posición del elemento objetivo
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const element = document.getElementById(currentStep.targetId);
    if (element) {
      // Desplazar suavemente el elemento a la vista si está fuera de ella
      element.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Si el elemento no existe en pantalla, centrar temporalmente
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  // Actualizar posición al cambiar de paso o al redimensionar/hacer scroll
  useEffect(() => {
    if (!isOpen) return;

    // Pequeño retardo para dar tiempo a renderizados de vistas o animaciones
    const timeout = setTimeout(updateTargetPosition, 100);

    const handleResizeOrScroll = () => {
      updateTargetPosition();
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isOpen, currentStepIndex, updateTargetPosition]);

  // Manejo de teclas (Escape para omitir, Flecha Derecha para avanzar, Flecha Izquierda para retroceder)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          onFinish();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, totalSteps, onClose, onFinish]);

  if (!isOpen) return null;

  // Cálculo de la posición del popover flotante
  const calculatePopoverStyle = (): React.CSSProperties => {
    const popoverWidth = 360;
    const popoverHeight = 240;
    const margin = 16;

    if (!targetRect) {
      // Centrado absoluto si no se encuentra el objetivo
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${popoverWidth}px`,
        zIndex: 60,
      };
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    const placement = currentStep.preferredPlacement || "bottom";

    if (placement === "right") {
      left = targetRect.right + margin;
      top = Math.min(
        Math.max(margin, targetRect.top + targetRect.height / 2 - popoverHeight / 2),
        viewportHeight - popoverHeight - margin
      );

      // Si se desborda por la derecha, ubicarlo a la izquierda o abajo
      if (left + popoverWidth > viewportWidth - margin) {
        left = Math.max(margin, targetRect.left - popoverWidth - margin);
      }
    } else if (placement === "top") {
      top = targetRect.top - popoverHeight - margin;
      left = Math.min(
        Math.max(margin, targetRect.left + targetRect.width / 2 - popoverWidth / 2),
        viewportWidth - popoverWidth - margin
      );

      // Si no cabe arriba, invertir hacia abajo
      if (top < margin) {
        top = targetRect.bottom + margin;
      }
    } else if (placement === "left") {
      left = targetRect.left - popoverWidth - margin;
      top = Math.min(
        Math.max(margin, targetRect.top + targetRect.height / 2 - popoverHeight / 2),
        viewportHeight - popoverHeight - margin
      );

      if (left < margin) {
        left = targetRect.right + margin;
      }
    } else {
      // placement === "bottom" por defecto
      top = targetRect.bottom + margin;
      left = Math.min(
        Math.max(margin, targetRect.left + targetRect.width / 2 - popoverWidth / 2),
        viewportWidth - popoverWidth - margin
      );

      // Si no cabe abajo, invertir hacia arriba
      if (top + popoverHeight > viewportHeight - margin) {
        top = Math.max(margin, targetRect.top - popoverHeight - margin);
      }
    }

    return {
      position: "fixed",
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${popoverWidth}px`,
      zIndex: 60,
    };
  };

  const IconComponent = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-[family-name:var(--font-poppins)] select-none">
      {/* 1. Recuadro Iluminado Spotlight con Sombra Gigante (Cutout Overlay) */}
      {targetRect && (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out border-2 border-teal-400 ring-4 ring-teal-400/30"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)",
            zIndex: 55,
          }}
        />
      )}

      {/* Si no hay targetRect, mostrar backdrop oscuro estándar */}
      {!targetRect && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 transition-opacity" />
      )}

      {/* 2. Tarjeta Flotante Explicativa del Paso */}
      <div
        ref={popoverRef}
        style={calculatePopoverStyle()}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 flex flex-col justify-between gap-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Encabezado con Indicador de Paso y Botón Omitir */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              Paso {currentStepIndex + 1} de {totalSteps}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">Tutorial guiado</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            title="Omitir tutorial"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Explicativo */}
        <div className="flex items-start gap-3.5 my-1">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
            <IconComponent className="w-5 h-5" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-snug">
              {currentStep.title}
            </h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Barra / Puntos de Progreso */}
        <div className="flex items-center gap-1.5 pt-1">
          {TOUR_STEPS.map((_, idx) => (
            <span
              key={idx}
              className={clsx(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentStepIndex
                  ? "w-6 bg-teal-600"
                  : idx < currentStepIndex
                  ? "w-2.5 bg-teal-300"
                  : "w-2 bg-gray-200"
              )}
            />
          ))}
        </div>

        {/* Botones de Navegación */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            Omitir
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <LuArrowLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {currentStepIndex === totalSteps - 1 ? (
                <>
                  <LuCheck className="w-3.5 h-3.5" />
                  Finalizar tutorial
                </>
              ) : (
                <>
                  Siguiente
                  <LuArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
