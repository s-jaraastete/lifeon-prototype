"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  LuAtom,
  LuSparkles,
  LuSend,
  LuRefreshCw,
} from "react-icons/lu";
import useLifeOnPreferences from "@/hooks/useLifeOnPreferences";
import useAprVirtualChat from "@/hooks/useAprVirtualChat";

const PREBUILT_PROMPTS = [
  {
    title: "Uso de LifeOn",
    prompt: "¿Cómo empiezo a confeccionar una matriz IPER en LifeOn?",
  },
  {
    title: "Peligro vs riesgo",
    prompt: "Explícame la diferencia entre peligro y riesgo en una matriz IPER.",
  },
  {
    title: "Controles",
    prompt: "¿Qué es la jerarquía de controles y cómo la aplico?",
  },
  {
    title: "APR en terreno",
    prompt: "¿Qué debería considerar en un APR para trabajos en altura?",
  },
];

export default function AprVirtualView() {
  const { preferences, currentUser } = useLifeOnPreferences();
  const firstName = (currentUser?.name || "Usuario").split(" ")[0];
  const sector = preferences.organizationSector?.trim();

  const { messages, isGenerating, error, sendMessage, resetChat, setMessages } = useAprVirtualChat(
    "apr_chat",
    { module: "apr" }
  );

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hola ${firstName}, soy **APR Virtual IA**. Te apoyo en Gestión de Riesgos Laborales, Matriz IPER y uso de LifeOn.${
            sector ? ` Tu rubro registrado es ${sector}.` : ""
          } ¿En qué necesitas orientación?`,
          timestamp: "Ahora",
        },
      ]);
    }
  }, [firstName, messages.length, sector, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSubmit = (text: string) => {
    if (!text.trim()) return;
    void sendMessage(text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] gap-3 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-xs">
            <LuAtom className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">APR Virtual IA</h2>
              <span className="bg-[#DBEAFE] text-[#155DFC] text-[10px] font-bold px-2 py-0.5 rounded-full">
                LifeOn AI
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Orientación en GRL, IPER y uso de LifeOn. No reemplaza evaluación profesional en terreno.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => resetChat()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition cursor-pointer border border-gray-200"
        >
          <LuRefreshCw className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-shrink-0">
        <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 flex-shrink-0 pl-1">
          <LuSparkles className="w-3.5 h-3.5 text-teal-600" /> Sugerencias:
        </span>
        {PREBUILT_PROMPTS.map((p) => (
          <button
            key={p.title}
            type="button"
            onClick={() => handleSubmit(p.prompt)}
            className="text-xs font-medium text-gray-700 bg-white hover:bg-teal-50 hover:text-teal-800 border border-gray-200/90 rounded-xl px-3 py-1.5 whitespace-nowrap transition cursor-pointer shadow-2xs"
          >
            {p.title}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex-1 bg-white rounded-2xl p-4 shadow-xs overflow-y-auto flex flex-col gap-4 border border-gray-100">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div
              className={clsx(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-2xs mt-1",
                msg.role === "user"
                  ? "bg-purple-600"
                  : "bg-gradient-to-tr from-teal-600 to-emerald-500"
              )}
            >
              {msg.role === "user" ? firstName.charAt(0) : <LuAtom className="w-4 h-4" />}
            </div>
            <div
              className={clsx(
                "p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line",
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-tr-xs"
                  : "bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-xs shadow-2xs"
              )}
            >
              {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              <span
                className={clsx(
                  "text-[10px] block mt-1",
                  msg.role === "user" ? "text-teal-100 text-right" : "text-gray-400"
                )}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center animate-pulse">
              <LuAtom className="w-4 h-4" />
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              APR Virtual está pensando…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(input);
        }}
        className="bg-white rounded-2xl p-2.5 shadow-xs border border-gray-100 flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta sobre riesgos, IPER o LifeOn…"
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
