"use client";

import Image from "next/image";
import { LuShieldCheck } from "react-icons/lu";
import {
  IRL_LEGAL_BADGE,
  IRL_LEGAL_SUBTITLE,
  IRL_OBLIGATION_BODY,
  IRL_OBLIGATION_TITLE,
  IRL_WORKER_DECLARATION_INTRO,
  IRL_WORKER_DECLARATION_OUTRO,
  buildIrlDocumentCode,
  consequencesForIrlLevel,
  type IrlEvaluationLike,
} from "@/lib/irl/irlDocumentCopy";

export type IrlFormalDocumentProps = {
  organizationName: string;
  organizationLogoUrl?: string | null;
  matrixCode: string;
  matrixTitle: string;
  workCenterName: string;
  cargoName: string;
  responsible: string;
  evaluations: IrlEvaluationLike[];
  documentCode?: string;
  issuedAt?: string | Date;
  workerSignature?: {
    fullName?: string;
    identificationNumber?: string | null;
    signedAt?: string | null;
    imageUrl?: string | null;
  };
  className?: string;
};

export default function IrlFormalDocument({
  organizationName,
  organizationLogoUrl,
  matrixCode,
  matrixTitle,
  workCenterName,
  cargoName,
  responsible,
  evaluations,
  documentCode,
  issuedAt,
  workerSignature,
  className = "",
}: IrlFormalDocumentProps) {
  const code = documentCode || buildIrlDocumentCode(matrixCode, cargoName);
  const emissionDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString("es-CL")
    : new Date().toLocaleDateString("es-CL");

  const workerName = workerSignature?.fullName?.trim() || "_____________________________________";
  const workerRut = workerSignature?.identificationNumber?.trim() || "____________________";
  const signedDate = workerSignature?.signedAt
    ? new Date(workerSignature.signedAt).toLocaleDateString("es-CL")
    : "___/___/______";

  return (
    <div
      className={`irl-a4-sheet border border-gray-300 rounded-sm text-gray-800 flex flex-col gap-5 print:rounded-none ${className}`}
    >
      <header className="border-b-2 border-gray-900 pb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
          <div className="flex items-start gap-3 min-w-0 pr-2">
            {organizationLogoUrl ? (
              <div className="flex-shrink-0 flex items-center justify-center max-w-[72px] max-h-16">
                <Image
                  src={organizationLogoUrl}
                  alt={`Logo ${organizationName}`}
                  width={72}
                  height={64}
                  className="object-contain w-auto h-auto max-w-[72px] max-h-16"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 leading-tight">{organizationName}</p>
              <h1 className="text-[15px] sm:text-base font-black text-gray-900 uppercase tracking-tight mt-1 leading-snug">
                INFORMACIÓN DE RIESGOS LABORALES (IRL)
              </h1>
              <p className="text-[10px] text-gray-600 mt-1 leading-snug">{IRL_LEGAL_SUBTITLE}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {IRL_LEGAL_BADGE}
              </span>
            </div>
          </div>

          <div className="text-right text-[10px] leading-relaxed font-mono text-gray-800 flex-shrink-0 pt-0.5">
            <p>
              <span className="text-gray-500 font-sans font-semibold">Código Doc:</span>
              <br />
              <span className="font-bold text-gray-900">{code}</span>
            </p>
            <p className="mt-1.5">
              <span className="text-gray-500 font-sans font-semibold">Ref. IPER:</span>
              <br />
              <span className="font-bold text-gray-900">{matrixCode}</span>
            </p>
            <p className="mt-1.5">
              <span className="text-gray-500 font-sans font-semibold">Fecha Emisión:</span>
              <br />
              <span className="font-bold text-gray-900">{emissionDate}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            Empresa / Razón Social
          </span>
          <span className="font-bold text-gray-900">{organizationName}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            Centro de Trabajo / Faena
          </span>
          <span className="font-bold text-gray-900">{workCenterName || "—"}</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            Cargo / Puesto de Trabajo Evaluado
          </span>
          <span className="font-black text-teal-900 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 inline-block">
            {cargoName}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            Matriz IPER de origen
          </span>
          <span className="font-semibold text-gray-900">{matrixTitle}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase block">
            Responsable de Prevención (APR)
          </span>
          <span className="font-semibold text-gray-900">{responsible || "—"}</span>
        </div>
      </div>

      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed">
        <p className="font-semibold mb-1 flex items-center gap-1.5">
          <LuShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0" />
          {IRL_OBLIGATION_TITLE}
        </p>
        <p className="text-[11px] text-blue-900">{IRL_OBLIGATION_BODY}</p>
      </div>

      <div>
        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>1. Tareas, peligros, riesgos y medidas de control del cargo</span>
          <span className="text-[10px] text-gray-500 font-normal font-mono">
            {evaluations.length} riesgo(s) asociado(s)
          </span>
        </h4>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200 text-[11px]">
                <th className="p-2.5 border-r border-gray-200 w-1/4">Tarea / actividad</th>
                <th className="p-2.5 border-r border-gray-200 w-1/4">Peligro identificado</th>
                <th className="p-2.5 border-r border-gray-200 w-1/5">Riesgo asociado</th>
                <th className="p-2.5">Medidas de control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[11px]">
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                    No hay evaluaciones registradas para este cargo en la matriz.
                  </td>
                </tr>
              ) : (
                evaluations.map((ev, idx) => (
                  <tr key={ev.id || idx} className="hover:bg-gray-50/70">
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <strong className="text-gray-900 block font-semibold">{ev.task}</strong>
                      {ev.process ? (
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Proceso: {ev.process}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top">
                      <span className="text-gray-800 font-medium block">{ev.hazard || "—"}</span>
                    </td>
                    <td className="p-2.5 border-r border-gray-200 align-top text-gray-800">
                      <span className="font-semibold block">{ev.riskEvent || "—"}</span>
                      <span className="text-[10px] text-gray-500 block mt-1">
                        Consecuencias posibles: {consequencesForIrlLevel(ev.initialLevel)}
                      </span>
                    </td>
                    <td className="p-2.5 align-top text-gray-800">
                      <p className="leading-snug">{ev.controls}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
          2. Elementos de Protección Personal (EPP) de Uso Obligatorio
        </h4>
        <p className="text-[11px] text-gray-600 mb-2">
          Según procedimientos del centro de trabajo y evaluaciones de la matriz IPER vigente.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            "Casco de seguridad dieléctrico",
            "Calzado de seguridad certificado",
            "Lentes de seguridad con filtro UV",
            "Guantes de protección mecánica",
          ].map((label) => (
            <div
              key={label}
              className="bg-white p-2 rounded-lg border border-gray-200 flex items-center gap-2"
            >
              <span className="text-teal-600 font-bold">✓</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-gray-800 pt-5 flex flex-col gap-4">
        <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
          3. Declaración de Recepción y Conformidad del Trabajador
        </h4>
        <p className="text-[11px] text-gray-700 leading-relaxed">
          {IRL_WORKER_DECLARATION_INTRO} <strong>{cargoName}</strong>. {IRL_WORKER_DECLARATION_OUTRO}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 pb-2">
          <div className="border-t border-gray-400 pt-3 flex flex-col text-xs text-center gap-2">
            <span className="font-bold text-gray-900">FIRMA DEL TRABAJADOR / TRABAJADORA</span>
            {workerSignature?.imageUrl ? (
              <div className="mx-auto w-full max-w-[220px] min-h-[72px] flex items-center justify-center border border-gray-200 rounded-lg bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={workerSignature.imageUrl}
                  alt="Firma del trabajador"
                  className="max-h-16 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="h-16 border border-dashed border-gray-300 rounded-lg mx-4" />
            )}
            <span className="text-[10px] text-gray-700">
              Nombre: <strong>{workerName}</strong>
            </span>
            <span className="text-[10px] text-gray-700">
              RUT/ID: <strong>{workerRut}</strong> · Fecha: <strong>{signedDate}</strong>
            </span>
          </div>

          <div className="border-t border-gray-400 pt-3 flex flex-col text-xs text-center">
            <span className="font-bold text-gray-900">POR LA EMPRESA / PREVENCIONISTA (APR)</span>
            <span className="text-[10px] text-gray-500 mt-2">Nombre: {responsible || "—"}</span>
            <span className="text-[10px] text-gray-500 mt-0.5">Firma y Timbre Departamento SST</span>
          </div>
        </div>
      </div>
    </div>
  );
}
