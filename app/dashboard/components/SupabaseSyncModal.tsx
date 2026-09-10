"use client";

import React, { useState, useEffect } from "react";
import {
  LuDatabase,
  LuX,
  LuRefreshCw,
  LuCircleCheck,
  LuTriangleAlert,
  LuCloud,
  LuHardDrive,
  LuClock,
} from "react-icons/lu";
import clsx from "clsx";
import {
  testSupabaseConnection,
  SupabaseConnectionStatus,
} from "@/lib/services/supabaseService";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseSyncModal({ isOpen, onClose }: SupabaseSyncModalProps) {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setStatus(res);
      setLastChecked(new Date().toLocaleString("es-CL"));
    } catch (e: any) {
      setStatus({
        isConfigured: isSupabaseConfigured(),
        connected: false,
        error: e?.message || "Error al verificar conexión.",
      });
      setLastChecked(new Date().toLocaleString("es-CL"));
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-[family-name:var(--font-poppins)]">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col">
        {/* Cabecera */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-2xs border border-teal-100">
              <LuDatabase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Estado de Base de Datos
              </h3>
              <p className="text-[11px] text-gray-500">
                Servicio Cloud Supabase
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Información del Estado */}
        <div className="p-6 flex flex-col gap-4 text-xs text-gray-600">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Servicio:</span>
              <span className="font-bold text-gray-900 flex items-center gap-1">
                <LuCloud className="w-3.5 h-3.5 text-teal-600" />
                Supabase
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Estado:</span>
              {testing ? (
                <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-amber-200">
                  <LuRefreshCw className="w-3 h-3 animate-spin" />
                  Verificando...
                </span>
              ) : status?.connected ? (
                <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado {status.latencyMs ? `(${status.latencyMs} ms)` : ""}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold text-[11px] border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Sin conexión / Modo Local
                </span>
              )}
            </div>

            {lastChecked && (
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-200">
                <span className="flex items-center gap-1">
                  <LuClock className="w-3 h-3" /> Última verificación:
                </span>
                <span className="font-mono">{lastChecked}</span>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-white text-gray-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
          >
            <LuRefreshCw className={clsx("w-3.5 h-3.5", testing && "animate-spin")} />
            <span>Verificar Estado</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer transition shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
