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
  LuUpload,
  LuCopy,
  LuCheck,
  LuInfo,
} from "react-icons/lu";
import clsx from "clsx";
import {
  testSupabaseConnection,
  seedInitialDataToSupabase,
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
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setSeedResult(null);
    try {
      const res = await testSupabaseConnection();
      setStatus(res);
    } catch (e: any) {
      setStatus({
        isConfigured: isSupabaseConfigured(),
        connected: false,
        error: e?.message || "Error al conectar.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedInitialDataToSupabase();
      setSeedResult(res.message);
      // Re-probar conexión
      await handleTestConnection();
    } catch (e: any) {
      setSeedResult(`Error: ${e?.message || "Fallo inesperado"}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCopyEnvSnippet = () => {
    const snippet = `NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui`;
    navigator.clipboard.writeText(snippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-2xs border border-teal-100">
              <LuDatabase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Base de Datos Supabase (Rama Personal)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Pruebas Aisladas
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Conecta tu proyecto en la nube para persistir datos sin afectar al equipo.
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

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs text-gray-600">
          {/* Card de Estado de Conexión */}
          <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/70 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                <LuCloud className="w-4 h-4 text-teal-600" />
                Estado del Servicio
              </span>

              <div className="flex items-center gap-2">
                {testing ? (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-[11px]">
                    <LuRefreshCw className="w-3 h-3 animate-spin" />
                    Comprobando...
                  </span>
                ) : status?.connected ? (
                  <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado a Supabase ({status.latencyMs} ms)
                  </span>
                ) : status?.isConfigured ? (
                  <span className="flex items-center gap-1.5 text-red-800 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 font-bold text-[11px]">
                    <LuTriangleAlert className="w-3 h-3" />
                    Error de Conexión
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-[11px]">
                    <LuHardDrive className="w-3 h-3 text-slate-500" />
                    Modo Local (localStorage)
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition cursor-pointer disabled:opacity-50"
                  title="Reintentar prueba"
                >
                  <LuRefreshCw className={clsx("w-3.5 h-3.5", testing && "animate-spin")} />
                </button>
              </div>
            </div>

            {/* Mensaje descriptivo del estado */}
            <div className="bg-white p-3 rounded-xl border border-gray-200/80 text-[11px]">
              {status?.message && (
                <p className="text-gray-700 leading-relaxed">{status.message}</p>
              )}
              {status?.error && (
                <p className="text-red-600 font-medium leading-relaxed">{status.error}</p>
              )}
              {!status && (
                <p className="text-gray-400">Presiona Probar Conexión para verificar el estado.</p>
              )}
            </div>

            {/* Botón de Sembrado de Datos */}
            {status?.connected && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-gray-500">
                  ¿Tablas vacías? Carga datos de prueba con un solo clic.
                </span>
                <button
                  type="button"
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  <LuUpload className="w-3.5 h-3.5" />
                  {seeding ? "Sembrando datos..." : "Sembrar Datos en Supabase"}
                </button>
              </div>
            )}

            {seedResult && (
              <div className="p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-semibold text-[11px] flex items-center gap-2">
                <LuCircleCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>{seedResult}</span>
              </div>
            )}
          </div>

          {/* Guía Rápida para Configurar Supabase en tu Rama */}
          <div className="flex flex-col gap-3">
            <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
              <LuInfo className="w-4 h-4 text-teal-600" />
              Pasos para conectar tu cuenta de Supabase
            </h4>

            <div className="space-y-2 text-[11px] text-gray-600">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center flex-shrink-0 text-[10px]">
                  1
                </span>
                <div className="leading-snug">
                  <strong className="text-gray-900">Crea o ingresa a tu proyecto en Supabase:</strong>
                  <p className="text-gray-500 mt-0.5">
                    Entra a{" "}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-600 font-bold underline"
                    >
                      supabase.com
                    </a>{" "}
                    y ve a <em>Project Settings &gt; API</em> para copiar tu <strong>Project URL</strong> y tu <strong>anon public key</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center flex-shrink-0 text-[10px]">
                  2
                </span>
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 leading-snug">
                      Pega tus credenciales en el archivo .env.local:
                    </strong>
                    <button
                      type="button"
                      onClick={handleCopyEnvSnippet}
                      className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedEnv ? (
                        <>
                          <LuCheck className="w-3 h-3 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <LuCopy className="w-3 h-3" /> Copiar formato
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="mt-1 p-2 rounded-lg bg-gray-900 text-teal-300 font-mono text-[10px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...`}
                  </pre>
                  <p className="text-gray-400 text-[10px] mt-1">
                    Nota: <code>.env.local</code> está en el archivo <code>.gitignore</code>, por lo que nunca se subirá al repositorio ni afectará a tus compañeros de equipo.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-200">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center flex-shrink-0 text-[10px]">
                  3
                </span>
                <div className="leading-snug">
                  <strong className="text-gray-900">Ejecuta el script SQL en Supabase:</strong>
                  <p className="text-gray-500 mt-0.5">
                    Abre el <strong>SQL Editor</strong> en Supabase, copia el contenido del archivo local{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">
                      supabase/schema.sql
                    </code>{" "}
                    y presiona <strong>Run</strong>. Creará automáticamente las tablas con Row Level Security para tus pruebas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition cursor-pointer text-xs shadow-2xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
