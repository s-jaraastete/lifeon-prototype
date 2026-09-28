"use client";

import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import LoadingState from "@/components/reusable/LoadingState";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  createArtpExecution,
  registerArtpAcknowledgement,
  transitionArtpExecution,
} from "@/lib/repositories/artpRepository";
import { evaluateExecutionReadiness } from "@/lib/artp/executionReadiness";
import { useArtpOrgId, useArtpVersionDetail } from "@/hooks/useArtp";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { ArtpSignaturePad } from "./ArtpSignaturePad";
import type { ArtpCheckAnswer } from "@/types/artp";

interface ArtpExecutionPanelProps {
  versionId: string;
  executionId?: string;
  onBack: () => void;
}

export function ArtpExecutionPanel({
  versionId,
  executionId: initialExecutionId,
  onBack,
}: ArtpExecutionPanelProps) {
  const orgId = useArtpOrgId();
  const { currentUser } = useLifeOnPreferences();
  const { data: detail, isLoading } = useArtpVersionDetail(versionId);
  const [executionId, setExecutionId] = useState(initialExecutionId ?? "");
  const [specificLocation, setSpecificLocation] = useState("");
  const [environmentOk, setEnvironmentOk] = useState<boolean | null>(null);
  const [peopleAsPlanned, setPeopleAsPlanned] = useState<boolean | null>(true);
  const [toolsAsPlanned, setToolsAsPlanned] = useState<boolean | null>(true);
  const [fitToWork, setFitToWork] = useState<boolean | null>(null);
  const [alertOk, setAlertOk] = useState<boolean | null>(null);
  const [checks, setChecks] = useState<Record<string, ArtpCheckAnswer | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [ackId, setAckId] = useState<string | null>(null);

  const controls = useMemo(() => {
    if (!detail) return [];
    const list: { id: string; isCritical: boolean; question?: string; label: string }[] = [];
    for (const step of detail.steps) {
      for (const h of step.hazards) {
        for (const r of h.risks) {
          for (const c of r.controls) {
            list.push({
              id: c.id,
              isCritical: c.isCritical,
              question: c.verificationQuestion,
              label: c.description,
            });
          }
        }
      }
    }
    return list;
  }, [detail]);

  useEffect(() => {
    if (initialExecutionId) setExecutionId(initialExecutionId);
  }, [initialExecutionId]);

  const ensureExecution = async () => {
    if (executionId) return executionId;
    const id = await createArtpExecution(orgId, versionId, {
      specificLocation,
    });
    if (id) setExecutionId(id);
    return id;
  };

  const readiness = evaluateExecutionReadiness({
    status: "pendiente",
    participantCount: 1,
    participants: [
      {
        memberId: "self",
        fitToWork,
        alertOk,
        acknowledgementConfirmed: false,
      },
    ],
    environmentOk,
    peopleAsPlanned,
    toolsAsPlanned,
    changes: [],
    checks: controls.map((c) => ({
      controlId: c.id,
      isCritical: c.isCritical,
      answer: checks[c.id] ?? null,
    })),
    warnings: [],
  });

  const startExecution = async () => {
    const exId = await ensureExecution();
    if (!exId) {
      setMessage("No se pudo crear la ejecución.");
      return;
    }
    const client = getSupabaseClient();
    if (client) {
      await client
        .from("artp_executions")
        .update({
          environment_ok: environmentOk,
          people_as_planned: peopleAsPlanned,
          tools_as_planned: toolsAsPlanned,
          specific_location: specificLocation,
        })
        .eq("id", exId);
      for (const [controlId, answer] of Object.entries(checks)) {
        if (!answer) continue;
        await client.from("artp_execution_checks").upsert({
          id: `${exId}_${controlId}`,
          organization_id: orgId,
          execution_id: exId,
          control_id: controlId,
          answer,
          answered_at: new Date().toISOString(),
        });
      }
    }
    const res = await transitionArtpExecution(exId, "en_ejecucion");
    setMessage(res.ok ? "Ejecución iniciada." : res.message ?? "No apta para comenzar.");
  };

  const handleSignature = async (dataUrl: string) => {
    const exId = await ensureExecution();
    if (!exId || !detail?.version.contentHash) return;
    const client = getSupabaseClient();
    if (!client) return;

    const memberRes = await client
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", currentUser?.email ?? "")
      .maybeSingle();
    const memberId = memberRes.data?.id;
    if (!memberId) {
      setMessage("No se encontró membresía activa.");
      return;
    }

    await client
      .from("artp_execution_participants")
      .upsert({
        id: `${exId}_${memberId}`,
        organization_id: orgId,
        execution_id: exId,
        member_id: memberId,
        fit_to_work: fitToWork,
        alert_ok: alertOk,
        fit_declared_at: fitToWork !== null ? new Date().toISOString() : null,
        alert_declared_at: alertOk !== null ? new Date().toISOString() : null,
      });

    const { data: ackIdRow, error: ackErr } = await client.rpc("ensure_artp_acknowledgement", {
      p_execution_id: exId,
      p_member_id: memberId,
    });
    if (ackErr || !ackIdRow) {
      setMessage(ackErr?.message ?? "No se pudo preparar la toma de conocimiento.");
      return;
    }
    const ackRowId = String(ackIdRow);

    const user = (await client.auth.getUser()).data.user;
    if (!user) return;

    const blob = await (await fetch(dataUrl)).blob();
    const path = `${orgId}/${user.id}/artp_${ackRowId}.png`;
    await client.storage.from("acknowledgement-evidence").upload(path, blob, {
      contentType: "image/png",
      upsert: true,
    });

    const reg = await registerArtpAcknowledgement(ackRowId, path);
    setMessage(reg.ok ? "Toma de conocimiento registrada." : reg.message ?? "Error al firmar");
    setAckId(ackRowId);
  };

  if (isLoading || !detail) {
    return <LoadingState />;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600"
      >
        <LuArrowLeft /> Volver
      </button>

      <h2 className="text-xl font-bold text-gray-900">Ejecución ARTP — {detail.document.name}</h2>

      <section className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <label className="block text-sm font-medium">
          Lugar específico
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            value={specificLocation}
            onChange={(e) => setSpecificLocation(e.target.value)}
          />
        </label>
        <YesNoBlock
          label="¿Las condiciones del entorno permiten ejecutar la tarea de manera segura?"
          value={environmentOk}
          onChange={setEnvironmentOk}
        />
        <YesNoBlock
          label="¿Las personas son las planificadas?"
          value={peopleAsPlanned}
          onChange={setPeopleAsPlanned}
        />
        <YesNoBlock
          label="¿Herramientas y equipos son los planificados?"
          value={toolsAsPlanned}
          onChange={setToolsAsPlanned}
        />
      </section>

      <section className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <YesNoBlock
          label="¿Te encuentras en condiciones físicas y psicológicas adecuadas para realizar esta tarea?"
          value={fitToWork}
          onChange={setFitToWork}
        />
        <YesNoBlock
          label="¿Te encuentras alerta y en condiciones de concentrarte en la tarea?"
          value={alertOk}
          onChange={setAlertOk}
        />
        {(fitToWork === false || alertOk === false) && (
          <p className="text-sm text-amber-800 bg-amber-50 rounded-xl p-3">
            Informa al supervisor y no continúes hasta resolver la condición según el procedimiento
            interno.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 p-4 space-y-4">
        <h3 className="font-semibold">Verificación de controles</h3>
        {controls.map((c) => (
          <div key={c.id} className="text-sm border-b border-gray-100 pb-3">
            <p className="font-medium">
              {c.label}
              {c.isCritical && (
                <span className="ml-2 text-xs text-red-600 font-bold">Crítico</span>
              )}
            </p>
            {c.question && <p className="text-gray-500 text-xs mt-1">{c.question}</p>}
            <div className="flex gap-2 mt-2">
              {(["si", "no", "no_aplica"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setChecks((prev) => ({ ...prev, [c.id]: a }))}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold border ${
                    checks[c.id] === a
                      ? "bg-teal-100 border-teal-400"
                      : "border-gray-200"
                  }`}
                >
                  {a === "si" ? "Sí" : a === "no" ? "No" : "N/A"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {!readiness.readyToStart && readiness.blockReasons.length > 0 && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          <p className="font-semibold">Requiere corrección del responsable</p>
          <ul className="list-disc ml-4 mt-1">
            {readiness.blockReasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <ArtpSignaturePad onConfirm={handleSignature} disabled={Boolean(ackId)} />

      <button
        type="button"
        onClick={() => void startExecution()}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white"
      >
        Marcar apta e iniciar ejecución
      </button>

      {message && (
        <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-xl p-3">{message}</p>
      )}
    </div>
  );
}

function YesNoBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
            value === true ? "bg-teal-100 border-teal-400" : "border-gray-200"
          }`}
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
            value === false ? "bg-red-50 border-red-300" : "border-gray-200"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
