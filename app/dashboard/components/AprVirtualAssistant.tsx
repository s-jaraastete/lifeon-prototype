"use client";

import { useState } from "react";
import clsx from "clsx";
import { LuAtom, LuSend, LuMinimize2 } from "react-icons/lu";
import type { DashboardMenuKey } from "@/types/dashboardNav";
import useAprVirtualAssistant from "@/hooks/useAprVirtualAssistant";

const MODULE_TITLES: Record<DashboardMenuKey, string> = {
  dashboard: "Inicio",
  users: "Usuarios",
  org: "Estructura Organizacional",
  iper: "Matriz IPER",
  docs: "Planificación Preventiva",
  techDocs: "Documentación Técnica",
  apr: "APR Virtual",
};

type AprVirtualAssistantProps = {
  activeModule: DashboardMenuKey;
  companionVisible?: boolean;
};

export default function AprVirtualAssistant({
  activeModule,
  companionVisible = false,
}: AprVirtualAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isGenerating, error, sendMessage } = useAprVirtualAssistant(activeModule);

  const positionClass = companionVisible ? "right-28" : "right-5";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={clsx(
            "fixed bottom-5 z-40 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-lg border border-teal-500/30 cursor-pointer transition",
            positionClass
          )}
          title="APR Virtual IA"
        >
          <LuAtom className="w-5 h-5" />
          <span className="text-xs font-bold hidden sm:inline">APR Virtual IA</span>
        </button>
      )}

      {open && (
        <aside
          className={clsx(
            "fixed bottom-5 z-40 w-[min(100vw-2rem,22rem)] h-[min(70vh,32rem)] rounded-2xl border border-teal-200 bg-white shadow-2xl flex flex-col overflow-hidden",
            positionClass
          )}
          aria-label="Asistente APR Virtual IA"
        >
          <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-teal-100">APR Virtual IA</p>
              <p className="text-sm font-bold">{MODULE_TITLES[activeModule]}</p>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
                title="Minimizar"
              >
                <LuMinimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-gray-50/80">
            {messages.length === 0 && (
              <p className="text-xs text-gray-600 bg-white border border-gray-100 rounded-xl p-3">
                Estoy en <strong>{MODULE_TITLES[activeModule]}</strong>. Pregunta sobre este módulo o
                sobre Gestión de Riesgos en LifeOn.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "text-xs rounded-xl px-3 py-2 max-w-[90%] whitespace-pre-line",
                  msg.role === "user"
                    ? "ml-auto bg-teal-600 text-white"
                    : "mr-auto bg-white border border-gray-100 text-gray-800"
                )}
              >
                {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </div>
            ))}
            {isGenerating && (
              <p className="text-[11px] text-teal-700 animate-pulse">APR Virtual está pensando…</p>
            )}
            {error && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                {error}
              </p>
            )}
          </div>

          <form
            className="p-2 border-t border-gray-100 flex gap-2 bg-white"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              void sendMessage(input);
              setInput("");
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="p-2 rounded-xl bg-teal-600 text-white disabled:opacity-50 cursor-pointer"
            >
              <LuSend className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
