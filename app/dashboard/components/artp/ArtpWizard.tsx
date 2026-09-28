"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";
import { LuArrowLeft, LuArrowRight, LuPlus, LuTrash2 } from "react-icons/lu";
import Modal, { ModalActionButtons, ModalBody, ModalTitle } from "@/components/reusable/Modal";
import {
  createArtpDocumentWithVersion,
  fetchArtpDocumentOrgTaskId,
  fetchArtpVersionDetail,
  saveArtpPlanningMeta,
  saveArtpStepsTree,
  submitArtpForSignatures,
  upsertOrgTask,
} from "@/lib/repositories/artpRepository";
import type { ArtpPrefillFromIper } from "./ArtpHomeView";
import type {
  ArtpChangeAnswer,
  ArtpCheckAnswer,
  ArtpPlanningBundle,
  ArtpStep,
  ArtpStepControl,
  ArtpStepEvent,
  ArtpWorkerSignature,
  ArtpWorkContext,
} from "@/types/artp";
import { scopedArtpId } from "@/types/artp";
import { ARTP_CHANGE_SECTIONS, ARTP_CHANGE_SECTION_LABELS, buildInitialChangeAnswers } from "@/lib/artp/changeManagementQuestions";
import { loadWizardStateFromDetail, artpIperTaskOptionKey } from "@/lib/artp/loadArtpWizardState";
import {
  newStepControl,
  newStepEvent,
  stepsEventsToHazardTree,
} from "@/lib/artp/stepTreeMapper";
import { useArtpIperTaskOptions } from "@/hooks/useArtpIperTaskOptions";
import { useUsers } from "@/hooks/useUsers";
import type { PlatformUser } from "@/types/users";
import {
  filterActiveParticipants,
  filterSupervisorCandidates,
  formatPlatformUserName,
} from "@/lib/artp/participantOptions";

const WIZARD_STEPS = [
  "Tarea",
  "Antecedentes del trabajo",
  "Gestión de cambios",
  "Paso a paso",
  "Participantes",
  "Revisión",
];

const EMPTY_WORK_CONTEXT: ArtpWorkContext = {
  workDate: "",
  startTime: "",
  endTime: "",
  specificLocation: "",
  workArea: "",
  supervisorName: "",
  supervisorSignatureDataUrl: null,
};

function newId(orgId: string, prefix: string) {
  return scopedArtpId(orgId, `${prefix}_${Math.random().toString(36).slice(2, 9)}`);
}

function resequence(steps: ArtpStep[]): ArtpStep[] {
  return steps.map((s, i) => ({ ...s, sequence: i + 1 }));
}

function changeFollowUpComplete(row: ArtpChangeAnswer): boolean {
  if (row.answer !== false) return true;
  return (
    Boolean(row.changeDescription?.trim()) &&
    Boolean(row.undesiredEvent?.trim()) &&
    Boolean(row.additionalControl?.trim()) &&
    row.implementationVerified !== null
  );
}

function allChangeChecksResolved(changeAnswers: ArtpChangeAnswer[]): boolean {
  return changeAnswers.every(
    (c) => c.answer !== null && (c.answer === true || changeFollowUpComplete(c))
  );
}

function canProceedAfterChangeManagement(changeAnswers: ArtpChangeAnswer[]): boolean {
  if (!allChangeChecksResolved(changeAnswers)) return false;
  return changeAnswers.every((c) => c.answer === true || changeFollowUpComplete(c));
}

function isChangeRowResolved(row: ArtpChangeAnswer): boolean {
  return row.answer !== null && (row.answer === true || changeFollowUpComplete(row));
}

function sectionChangeResolved(sectionIndex: number, changeAnswers: ArtpChangeAnswer[]): boolean {
  const category = ARTP_CHANGE_SECTIONS[sectionIndex]?.category;
  if (!category) return true;
  return changeAnswers.filter((r) => r.category === category).every(isChangeRowResolved);
}

function canNavigateToChangeSection(
  targetIndex: number,
  currentIndex: number,
  changeAnswers: ArtpChangeAnswer[]
): boolean {
  if (targetIndex <= currentIndex) return true;
  for (let j = 0; j < targetIndex; j++) {
    if (!sectionChangeResolved(j, changeAnswers)) return false;
  }
  return true;
}

interface ArtpWizardProps {
  open: boolean;
  orgId: string;
  prefill?: ArtpPrefillFromIper;
  editVersionId?: string | null;
  onClose: () => void;
  onSaved: (versionId: string) => void;
}

export function ArtpWizard({ open, orgId, prefill, editVersionId, onClose, onSaved }: ArtpWizardProps) {
  const iperTasks = useArtpIperTaskOptions();
  const { users } = useUsers();
  const supervisorCandidates = useMemo(() => filterSupervisorCandidates(users), [users]);
  const participantCandidates = useMemo(() => filterActiveParticipants(users), [users]);

  const [step, setStep] = useState(0);
  const [taskMode, setTaskMode] = useState<"iper" | "manual">("manual");
  const [taskName, setTaskName] = useState("");
  const [iperMatrixId, setIperMatrixId] = useState<string | undefined>();
  const [selectedIperKey, setSelectedIperKey] = useState("");
  const [workContext, setWorkContext] = useState<ArtpWorkContext>(EMPTY_WORK_CONTEXT);
  const [changeAnswers, setChangeAnswers] = useState<ArtpChangeAnswer[]>(() =>
    buildInitialChangeAnswers()
  );
  const [changeSectionIndex, setChangeSectionIndex] = useState(0);
  const [steps, setSteps] = useState<ArtpStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [stepDraftOpen, setStepDraftOpen] = useState(false);
  const [stepDraftText, setStepDraftText] = useState("");
  const [workers, setWorkers] = useState<ArtpWorkerSignature[]>([]);
  const [orgTaskId, setOrgTaskId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (!open) return;

    const resetNew = () => {
      setStep(0);
      const initialTask = prefill?.taskName ?? "";
      setTaskName(initialTask);
      setIperMatrixId(prefill?.matrixId);
      setTaskMode(prefill?.matrixId ? "iper" : "manual");
      setSelectedIperKey("");
      setWorkContext({ ...EMPTY_WORK_CONTEXT, workDate: new Date().toISOString().slice(0, 10) });
      setChangeAnswers(buildInitialChangeAnswers());
      setChangeSectionIndex(0);
      setSteps([]);
      setActiveStepId(null);
      setStepDraftOpen(false);
      setStepDraftText("");
      setWorkers([]);
      setOrgTaskId(undefined);
      setSaveError(null);
      setVersionId(null);
      setDocumentId(null);
    };

    if (editVersionId) {
      setLoadingEdit(true);
      void (async () => {
        const detail = await fetchArtpVersionDetail(editVersionId);
        if (!detail) {
          setSaveError("No se pudo cargar el borrador para editar.");
          resetNew();
          setLoadingEdit(false);
          return;
        }
        const loaded = loadWizardStateFromDetail(detail);
        const taskId = await fetchArtpDocumentOrgTaskId(loaded.documentId);
        setStep(0);
        setTaskName(loaded.taskName);
        setIperMatrixId(loaded.iperMatrixId);
        setTaskMode(loaded.iperMatrixId ? "iper" : "manual");
        if (loaded.iperMatrixId && loaded.taskName.trim()) {
          setSelectedIperKey(artpIperTaskOptionKey(loaded.iperMatrixId, loaded.taskName.trim()));
        } else {
          setSelectedIperKey("");
        }
        setWorkContext(loaded.workContext);
        setChangeAnswers(loaded.changeAnswers);
        setChangeSectionIndex(0);
        setSteps(loaded.steps);
        setActiveStepId(loaded.steps[0]?.id ?? null);
        setWorkers(loaded.workers);
        setVersionId(loaded.versionId);
        setDocumentId(loaded.documentId);
        setOrgTaskId(taskId ?? undefined);
        setSaveError(null);
        setLoadingEdit(false);
      })();
      return;
    }

    resetNew();
  }, [open, prefill, editVersionId]);

  useEffect(() => {
    if (!open || taskMode !== "iper" || !iperMatrixId || !taskName.trim()) return;
    const key = artpIperTaskOptionKey(iperMatrixId, taskName.trim());
    if (selectedIperKey === key) return;
    const inList = iperTasks.some(
      (t) => artpIperTaskOptionKey(t.matrixId, t.taskName) === key
    );
    if (inList) setSelectedIperKey(key);
  }, [open, taskMode, iperMatrixId, taskName, iperTasks, selectedIperKey]);

  const activeStep = steps.find((s) => s.id === activeStepId) ?? steps[0];

  useEffect(() => {
    if (steps.length && !activeStepId) setActiveStepId(steps[0].id);
  }, [steps, activeStepId]);

  const updateSteps = (updater: (prev: ArtpStep[]) => ArtpStep[]) => {
    setSteps((prev) => resequence(updater(prev)));
  };

  const patchActiveStep = (patch: Partial<ArtpStep>) => {
    if (!activeStep) return;
    updateSteps((prev) => prev.map((s) => (s.id === activeStep.id ? { ...s, ...patch } : s)));
  };

  const patchEvent = (eventId: string, patch: Partial<ArtpStepEvent>) => {
    if (!activeStep) return;
    const events = activeStep.events ?? [];
    patchActiveStep({
      events: events.map((e) => (e.id === eventId ? { ...e, ...patch } : e)),
    });
  };

  const patchControl = (eventId: string, controlId: string, patch: Partial<ArtpStepControl>) => {
    if (!activeStep) return;
    const events = activeStep.events ?? [];
    patchActiveStep({
      events: events.map((e) =>
        e.id !== eventId
          ? e
          : {
              ...e,
              controls: e.controls.map((c) => (c.id === controlId ? { ...c, ...patch } : c)),
            }
      ),
    });
  };

  const confirmAddStep = () => {
    const description = stepDraftText.trim();
    if (!description) return;
    const id = newId(orgId, "step");
    updateSteps((prev) => [
      ...prev,
      {
        id,
        sequence: prev.length + 1,
        description,
        tools: [],
        energyTypeIds: [],
        events: [],
        hazards: [],
      },
    ]);
    setActiveStepId(id);
    setStepDraftOpen(false);
    setStepDraftText("");
  };

  const beginAddStep = () => {
    setStepDraftOpen(true);
    setStepDraftText("");
  };

  const cancelAddStep = () => {
    setStepDraftOpen(false);
    setStepDraftText("");
  };

  const removeStep = (stepId: string) => {
    const next = resequence(steps.filter((s) => s.id !== stepId));
    setSteps(next);
    if (activeStepId === stepId) setActiveStepId(next[0]?.id ?? null);
  };

  const removeEvent = (eventId: string) => {
    if (!activeStep) return;
    patchActiveStep({
      events: (activeStep.events ?? []).filter((e) => e.id !== eventId),
    });
  };

  const removeControl = (eventId: string, controlId: string) => {
    if (!activeStep) return;
    patchActiveStep({
      events: (activeStep.events ?? []).map((e) =>
        e.id !== eventId
          ? e
          : { ...e, controls: e.controls.filter((c) => c.id !== controlId) }
      ),
    });
  };

  const addEvent = () => {
    if (!activeStep) return;
    const ev = newStepEvent(orgId, "ev");
    ev.controls = [newStepControl(orgId)];
    patchActiveStep({ events: [...(activeStep.events ?? []), ev] });
  };

  const addControl = (eventId: string) => {
    if (!activeStep) return;
    const ev = activeStep.events?.find((e) => e.id === eventId);
    if (!ev) return;
    patchEvent(eventId, { controls: [...ev.controls, newStepControl(orgId)] });
  };

  const persistDraft = useCallback(async (): Promise<string | null> => {
    setSaving(true);
    setSaveError(null);
    try {
      if (!orgId?.trim()) {
        setSaveError("No se detectó la organización. Vuelva a iniciar sesión.");
        return null;
      }
      if (!taskName.trim()) {
        setSaveError("Indique el nombre de la tarea.");
        return null;
      }

      const controlAnswers: Record<string, ArtpCheckAnswer> = {};
      for (const s of steps) {
        for (const ev of s.events ?? []) {
          for (const c of ev.controls) {
            if (c.verificationAnswer) controlAnswers[c.id] = c.verificationAnswer;
          }
        }
      }

      const planning: ArtpPlanningBundle = {
        taskName: taskName.trim(),
        iperMatrixId,
        workContext: {
          ...workContext,
          supervisorSignatureDataUrl: null,
        },
        changeAnswers,
        workers,
        controlAnswers,
      };

      const task = await upsertOrgTask(orgId, {
        id: orgTaskId,
        name: taskName.trim(),
        origin: iperMatrixId ? "iper" : "artp",
        iperMatrixId,
        iperTaskLabel: taskName.trim(),
      });
      if (!task) {
        setSaveError(
          "No se pudo registrar la tarea (puede existir ya en la organización). Revise permisos o conexión."
        );
        return null;
      }
      setOrgTaskId(task.id);

      let vId = versionId;
      let dId = documentId;
      if (!vId || !dId) {
        const created = await createArtpDocumentWithVersion(orgId, {
          name: taskName.trim(),
          taskName: taskName.trim(),
          orgTaskId: task.id,
          positionIds: [],
        });
        if (!created) {
          setSaveError("No se pudo crear el documento ARTP.");
          return null;
        }
        vId = created.versionId;
        dId = created.documentId;
        setVersionId(vId);
        setDocumentId(dId);
      }

      const treeSteps = stepsEventsToHazardTree(orgId, steps);
      const stepsOk = await saveArtpStepsTree(orgId, vId, treeSteps);
      if (!stepsOk) {
        setSaveError("No se pudieron guardar los pasos del ARTP.");
        return null;
      }
      const metaOk = await saveArtpPlanningMeta(orgId, vId, dId, planning);
      if (!metaOk) {
        setSaveError("No se pudo guardar antecedentes y gestión de cambios.");
        return null;
      }
      return vId;
    } finally {
      setSaving(false);
    }
  }, [orgId, taskName, iperMatrixId, workContext, changeAnswers, workers, steps, versionId, documentId, orgTaskId]);

  const handleFinish = async (mode: "draft" | "submit_signatures") => {
    const vId = await persistDraft();
    if (!vId) return;
    if (mode === "submit_signatures") {
      const ok = await submitArtpForSignatures(vId);
      if (!ok) {
        setSaveError(
          "El borrador se guardó, pero no se pudo enviar a solicitud de firmas. Aplique la migración ARTP 20261007 en Supabase si el error persiste."
        );
        return;
      }
    }
    onSaved(vId);
    onClose();
  };

  const canNext = useMemo(() => {
    switch (step) {
      case 0:
        if (taskMode === "iper") {
          return selectedIperKey.length > 0 && taskName.trim().length > 0;
        }
        return taskName.trim().length > 0;
      case 1:
        return (
          workContext.workDate &&
          workContext.startTime &&
          workContext.endTime &&
          workContext.specificLocation.trim() &&
          workContext.workArea.trim() &&
          Boolean(workContext.supervisorMemberId)
        );
      case 2:
        return canProceedAfterChangeManagement(changeAnswers);
      case 3:
        return (
          steps.length > 0 &&
          steps.every((s) => {
            if (!s.description.trim()) return false;
            const events = s.events ?? [];
            if (!events.length) return false;
            return events.every(
              (ev) =>
                ev.name.trim() &&
                ev.controls.length > 0 &&
                ev.controls.every(
                  (c) =>
                    c.description.trim() &&
                    (c.verificationQuestion?.trim() ?? "").length > 0 &&
                    c.verificationAnswer !== null &&
                    c.verificationAnswer !== undefined
                )
            );
          })
        );
      case 4:
        return (
          workers.length > 0 &&
          workers.every((w) => w.memberId && w.workerName.trim())
        );
      default:
        return true;
    }
  }, [step, taskMode, selectedIperKey, taskName, workContext, changeAnswers, steps, workers]);

  return (
    <Modal open={open} onClose={onClose} size="xl" closeOnBackdropClick={false}>
      <ModalTitle>ARTP — {WIZARD_STEPS[step]}</ModalTitle>
      <ModalBody>
        {loadingEdit ? (
          <p className="text-sm text-gray-600 py-8 text-center">Cargando planificación…</p>
        ) : (
          <>
        <div className="flex flex-wrap gap-2 mb-4">
          {WIZARD_STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={i > step}
              onClick={() => i < step && setStep(i)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                i === step ? "bg-[#F04438] text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {step === 0 && (
          <StepTask
            taskMode={taskMode}
            setTaskMode={setTaskMode}
            taskName={taskName}
            setTaskName={setTaskName}
            iperMatrixId={iperMatrixId}
            selectedIperKey={selectedIperKey}
            setSelectedIperKey={setSelectedIperKey}
            setIperMatrixId={setIperMatrixId}
            iperTasks={iperTasks}
          />
        )}

        {step === 1 && (
          <StepWorkContext
            workContext={workContext}
            setWorkContext={setWorkContext}
            supervisorCandidates={supervisorCandidates}
          />
        )}

        {step === 2 && (
          <StepChangeManagement
            changeAnswers={changeAnswers}
            setChangeAnswers={setChangeAnswers}
            sectionIndex={changeSectionIndex}
            onSectionIndexChange={setChangeSectionIndex}
          />
        )}

        {step === 3 && (
          <StepTaskBreakdown
            steps={steps}
            activeStep={activeStep}
            activeStepId={activeStepId}
            setActiveStepId={setActiveStepId}
            stepDraftOpen={stepDraftOpen}
            stepDraftText={stepDraftText}
            setStepDraftText={setStepDraftText}
            beginAddStep={beginAddStep}
            confirmAddStep={confirmAddStep}
            cancelAddStep={cancelAddStep}
            patchActiveStep={patchActiveStep}
            patchEvent={patchEvent}
            patchControl={patchControl}
            addEvent={addEvent}
            addControl={addControl}
            removeStep={removeStep}
            removeEvent={removeEvent}
            removeControl={removeControl}
          />
        )}

        {step === 4 && (
          <StepParticipants
            workers={workers}
            setWorkers={setWorkers}
            candidates={participantCandidates}
            orgId={orgId}
            supervisorMemberId={workContext.supervisorMemberId}
          />
        )}

        {step === 5 && (
          <div className="text-sm space-y-2 max-h-[50vh] overflow-y-auto">
            <p>
              <strong>Tarea / ARTP:</strong> {taskName}
            </p>
            <p>
              <strong>Fecha:</strong> {workContext.workDate} · {workContext.startTime} –{" "}
              {workContext.endTime}
            </p>
            <p>
              <strong>Lugar:</strong> {workContext.specificLocation} · Área: {workContext.workArea}
            </p>
            <p>
              <strong>Supervisor:</strong> {workContext.supervisorName}
            </p>
            <p>
              <strong>Pasos significativos:</strong> {steps.length} ·{" "}
              <strong>Trabajadores:</strong> {workers.length}
            </p>
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              Las firmas del supervisor y de los trabajadores seleccionados se solicitan en la
              aplicación móvil al ejecutar el ARTP.
            </p>
          </div>
        )}

        {saveError && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {saveError}
          </p>
        )}
          </>
        )}
      </ModalBody>
      <ModalActionButtons>
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm disabled:opacity-40"
        >
          <LuArrowLeft /> Anterior
        </button>
        {step < 5 ? (
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex items-center gap-1 rounded-xl bg-[#F04438] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Siguiente <LuArrowRight />
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={saving || loadingEdit}
              onClick={() => void handleFinish("draft")}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              disabled={saving || loadingEdit}
              onClick={() => void handleFinish("submit_signatures")}
              className="rounded-xl bg-[#F04438] px-4 py-2 text-sm font-semibold text-white"
            >
              Enviar solicitud de firmas
            </button>
          </>
        )}
      </ModalActionButtons>
    </Modal>
  );
}

function StepTask(props: {
  taskMode: "iper" | "manual";
  setTaskMode: (m: "iper" | "manual") => void;
  taskName: string;
  setTaskName: (v: string) => void;
  iperMatrixId?: string;
  selectedIperKey: string;
  setSelectedIperKey: (v: string) => void;
  setIperMatrixId: (id?: string) => void;
  iperTasks: { taskName: string; matrixId: string; matrixLabel: string }[];
}) {
  const optionKeys = new Set(
    props.iperTasks.map((t) => artpIperTaskOptionKey(t.matrixId, t.taskName))
  );
  const savedKey =
    props.iperMatrixId && props.taskName.trim()
      ? artpIperTaskOptionKey(props.iperMatrixId, props.taskName.trim())
      : "";
  const showSavedOption = Boolean(savedKey) && !optionKeys.has(savedKey);

  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
      <p className="text-xs text-gray-500">
        El nombre del ARTP es el mismo que el nombre de la tarea.
      </p>
      <div className="flex gap-2">
        <ModeChip active={props.taskMode === "iper"} onClick={() => props.setTaskMode("iper")}>
          Desde matriz IPER vigente
        </ModeChip>
        <ModeChip active={props.taskMode === "manual"} onClick={() => props.setTaskMode("manual")}>
          Ingreso manual
        </ModeChip>
      </div>
      {props.taskMode === "iper" ? (
        <label className="block text-sm font-medium text-gray-700">
          Tarea (matrices vigentes)
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={props.selectedIperKey}
            onChange={(e) => {
              const key = e.target.value;
              props.setSelectedIperKey(key);
              const found = props.iperTasks.find(
                (t) => artpIperTaskOptionKey(t.matrixId, t.taskName) === key
              );
              if (found) {
                props.setTaskName(found.taskName);
                props.setIperMatrixId(found.matrixId);
              } else if (key === savedKey && props.iperMatrixId) {
                props.setTaskName(props.taskName.trim());
                props.setIperMatrixId(props.iperMatrixId);
              }
            }}
          >
            <option value="">Seleccionar tarea…</option>
            {showSavedOption ? (
              <option value={savedKey}>
                {props.taskName} (guardado en borrador)
              </option>
            ) : null}
            {props.iperTasks.map((t) => {
              const key = artpIperTaskOptionKey(t.matrixId, t.taskName);
              return (
              <option key={key} value={key}>
                {t.taskName} — {t.matrixLabel}
              </option>
            );
            })}
          </select>
          {props.taskMode === "iper" && !props.selectedIperKey && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Debe seleccionar una tarea de la lista para continuar.
            </p>
          )}
        </label>
      ) : (
        <label className="block text-sm font-medium text-gray-700">
          Nombre de la tarea
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={props.taskName}
            onChange={(e) => {
              props.setTaskName(e.target.value);
              props.setIperMatrixId(undefined);
            }}
            placeholder="Describa la tarea planificada"
          />
        </label>
      )}
      {props.taskName && (
        <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
          Documento ARTP: <strong>{props.taskName}</strong>
        </p>
      )}
    </div>
  );
}

function StepWorkContext(props: {
  workContext: ArtpWorkContext;
  setWorkContext: (v: ArtpWorkContext) => void;
  supervisorCandidates: PlatformUser[];
}) {
  const patch = (p: Partial<ArtpWorkContext>) =>
    props.setWorkContext({ ...props.workContext, ...p });

  return (
    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
      <Field label="Fecha" type="date" value={props.workContext.workDate} onChange={(v) => patch({ workDate: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Hora de inicio"
          type="time"
          value={props.workContext.startTime}
          onChange={(v) => patch({ startTime: v })}
        />
        <Field
          label="Hora de término"
          type="time"
          value={props.workContext.endTime}
          onChange={(v) => patch({ endTime: v })}
        />
      </div>
      <Field
        label="Lugar específico"
        value={props.workContext.specificLocation}
        onChange={(v) => patch({ specificLocation: v })}
      />
      <Field
        label="Área de trabajo"
        value={props.workContext.workArea}
        onChange={(v) => patch({ workArea: v })}
      />
      <label className="block text-sm font-medium text-gray-700">
        Supervisor responsable
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={props.workContext.supervisorMemberId ?? ""}
          onChange={(e) => {
            const memberId = e.target.value;
            const user = props.supervisorCandidates.find((u) => u.id === memberId);
            patch({
              supervisorMemberId: memberId || undefined,
              supervisorName: user ? formatPlatformUserName(user) : "",
            });
          }}
        >
          <option value="">Seleccionar supervisor…</option>
          {props.supervisorCandidates.map((u) => (
            <option key={u.id} value={u.id}>
              {formatPlatformUserName(u)}
              {u.cargoName ? ` · ${u.cargoName}` : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
        La firma del supervisor se solicita en la <strong>aplicación móvil</strong> al ejecutar el
        ARTP.
      </p>
    </div>
  );
}

function StepChangeManagement(props: {
  changeAnswers: ArtpChangeAnswer[];
  setChangeAnswers: (v: ArtpChangeAnswer[]) => void;
  sectionIndex: number;
  onSectionIndexChange: (i: number) => void;
}) {
  const section = ARTP_CHANGE_SECTIONS[props.sectionIndex];
  const sectionRows = props.changeAnswers.filter((r) => r.category === section.category);
  const sectionComplete = sectionChangeResolved(props.sectionIndex, props.changeAnswers);
  const isLastSection = props.sectionIndex >= ARTP_CHANGE_SECTIONS.length - 1;

  const patchRow = (questionId: string, patch: Partial<ArtpChangeAnswer>) => {
    props.setChangeAnswers(
      props.changeAnswers.map((r) => (r.questionId === questionId ? { ...r, ...patch } : r))
    );
  };

  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
      <div className="flex flex-wrap gap-2">
        {ARTP_CHANGE_SECTIONS.map((s, i) => (
          <button
            key={s.category}
            type="button"
            disabled={!canNavigateToChangeSection(i, props.sectionIndex, props.changeAnswers)}
            onClick={() => {
              if (canNavigateToChangeSection(i, props.sectionIndex, props.changeAnswers)) {
                props.onSectionIndexChange(i);
              }
            }}
            className={clsx(
              "rounded-full px-3 py-1 text-[10px] font-bold border",
              i === props.sectionIndex
                ? "bg-[#F04438] text-white border-[#F04438]"
                : sectionChangeResolved(i, props.changeAnswers)
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            {i + 1}. {ARTP_CHANGE_SECTION_LABELS[i]}
          </button>
        ))}
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase">
        Grupo {props.sectionIndex + 1} de {ARTP_CHANGE_SECTIONS.length}
      </p>

      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">
            {props.sectionIndex + 1}. {ARTP_CHANGE_SECTION_LABELS[props.sectionIndex]}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">{section.description}</p>
        </div>
        <div className="p-3 space-y-3">
          {sectionRows.map((row) => (
            <div
              key={row.questionId}
              className="rounded-xl border border-gray-100 bg-white p-3 space-y-2"
            >
              <p className="text-sm font-medium text-gray-900">{row.question}</p>
              <div className="flex gap-2">
                <YesNoButton
                  label="Sí"
                  active={row.answer === true}
                  onClick={() => patchRow(row.questionId, { answer: true })}
                />
                <YesNoButton
                  label="No"
                  active={row.answer === false}
                  onClick={() => patchRow(row.questionId, { answer: false })}
                />
              </div>
              {row.answer === false && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <MiniField
                    label="¿Cuál es el cambio?"
                    value={row.changeDescription ?? ""}
                    onChange={(v) => patchRow(row.questionId, { changeDescription: v })}
                  />
                  <MiniField
                    label="Evento no deseado o consecuencia"
                    value={row.undesiredEvent ?? ""}
                    onChange={(v) => patchRow(row.questionId, { undesiredEvent: v })}
                  />
                  <MiniField
                    label="Controles adicionales"
                    value={row.additionalControl ?? ""}
                    onChange={(v) => patchRow(row.questionId, { additionalControl: v })}
                  />
                  <p className="text-xs font-medium text-gray-700">
                    Verificación de la implementación de los controles adicionales
                  </p>
                  <div className="flex gap-2">
                    <YesNoButton
                      label="Sí"
                      active={row.implementationVerified === true}
                      onClick={() => patchRow(row.questionId, { implementationVerified: true })}
                    />
                    <YesNoButton
                      label="No"
                      active={row.implementationVerified === false}
                      onClick={() => patchRow(row.questionId, { implementationVerified: false })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!sectionComplete && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Responda todas las preguntas de este grupo. Si alguna es No, complete el detalle
          correspondiente.
        </p>
      )}

      {sectionComplete && !isLastSection && (
        <button
          type="button"
          onClick={() => props.onSectionIndexChange(props.sectionIndex + 1)}
          className="w-full rounded-xl bg-[#F04438] text-white text-xs font-bold py-2.5"
        >
          Continuar: {ARTP_CHANGE_SECTIONS[props.sectionIndex + 1]?.title}
        </button>
      )}

      {sectionComplete && isLastSection && (
        <p className="text-xs text-emerald-700 font-semibold">
          Gestión de cambios completada. Use &quot;Siguiente&quot; para continuar.
        </p>
      )}
    </div>
  );
}

function StepTaskBreakdown(props: {
  steps: ArtpStep[];
  activeStep?: ArtpStep;
  activeStepId: string | null;
  setActiveStepId: (id: string) => void;
  stepDraftOpen: boolean;
  stepDraftText: string;
  setStepDraftText: (v: string) => void;
  beginAddStep: () => void;
  confirmAddStep: () => void;
  cancelAddStep: () => void;
  patchActiveStep: (p: Partial<ArtpStep>) => void;
  patchEvent: (id: string, p: Partial<ArtpStepEvent>) => void;
  patchControl: (eid: string, cid: string, p: Partial<ArtpStepControl>) => void;
  addEvent: () => void;
  addControl: (eventId: string) => void;
  removeStep: (stepId: string) => void;
  removeEvent: (eventId: string) => void;
  removeControl: (eventId: string, controlId: string) => void;
}) {
  const step = props.activeStep;
  const canRemoveStep = props.steps.length > 1;
  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
      {props.steps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {props.steps.map((s) => (
            <div key={s.id} className="flex items-stretch gap-0.5 max-w-full">
              <button
                type="button"
                onClick={() => props.setActiveStepId(s.id)}
                className={clsx(
                  "rounded-xl px-3 py-2 text-left text-xs font-semibold border max-w-full",
                  props.activeStepId === s.id
                    ? "border-[#F04438] bg-red-50 text-gray-900"
                    : "border-gray-200 bg-white text-gray-700"
                )}
              >
                Paso {s.sequence}:{" "}
                {s.description.length > 48 ? `${s.description.slice(0, 48)}…` : s.description}
              </button>
              {canRemoveStep && props.activeStepId === s.id ? (
                <button
                  type="button"
                  title="Eliminar paso"
                  onClick={() => props.removeStep(s.id)}
                  className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-2 hover:bg-red-100"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {props.stepDraftOpen ? (
        <div className="rounded-2xl border-2 border-dashed border-[#F04438] bg-red-50/40 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-900">Nuevo paso significativo</p>
          <MiniField
            label="Describa el paso antes de agregarlo"
            value={props.stepDraftText}
            onChange={props.setStepDraftText}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!props.stepDraftText.trim()}
              onClick={props.confirmAddStep}
              className="rounded-xl bg-[#F04438] text-white text-xs font-bold px-4 py-2 disabled:opacity-40"
            >
              Confirmar paso
            </button>
            <button
              type="button"
              onClick={props.cancelAddStep}
              className="rounded-xl border border-gray-200 text-xs font-semibold px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <AddActionButton onClick={props.beginAddStep}>Agregar paso significativo</AddActionButton>
      )}

      {step && !props.stepDraftOpen && (
        <div className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gray-50/50">
          <MiniField
            label="Descripción del paso significativo"
            value={step.description}
            onChange={(v) => props.patchActiveStep({ description: v })}
          />
          <MiniField
            label="Herramientas y equipos necesarios (separar con coma)"
            value={step.tools.join(", ")}
            onChange={(v) =>
              props.patchActiveStep({
                tools: v
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              })
            }
          />
          <AddActionButton variant="secondary" onClick={props.addEvent}>
            Agregar evento no deseado
          </AddActionButton>
          {(step.events ?? []).map((ev, evIdx) => (
            <div key={ev.id} className="rounded-xl border border-gray-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-gray-500 uppercase">Evento {evIdx + 1}</p>
                <button
                  type="button"
                  onClick={() => props.removeEvent(ev.id)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 hover:text-red-900"
                >
                  <LuTrash2 className="w-3.5 h-3.5" /> Eliminar evento
                </button>
              </div>
              <MiniField
                label="Evento no deseado o consecuencia"
                value={ev.name}
                onChange={(v) => props.patchEvent(ev.id, { name: v })}
              />
              {ev.controls.map((c, cIdx) => (
                <div key={c.id} className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Control {cIdx + 1}</p>
                    <button
                      type="button"
                      onClick={() => props.removeControl(ev.id, c.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 hover:text-red-900"
                    >
                      <LuTrash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                  <MiniField
                    label="Control para gestionar el evento"
                    value={c.description}
                    onChange={(v) => props.patchControl(ev.id, c.id, { description: v })}
                  />
                  <MiniField
                    label="Pregunta clave (verificación del control)"
                    value={c.verificationQuestion ?? ""}
                    onChange={(v) => props.patchControl(ev.id, c.id, { verificationQuestion: v })}
                  />
                  <p className="text-xs font-medium text-gray-700">Respuesta planificada (Sí / No)</p>
                  <div className="flex gap-2">
                    {(["si", "no"] as ArtpCheckAnswer[]).map((ans) => (
                      <YesNoButton
                        key={ans}
                        label={ans === "si" ? "Sí" : "No"}
                        active={c.verificationAnswer === ans}
                        onClick={() => props.patchControl(ev.id, c.id, { verificationAnswer: ans })}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <AddActionButton variant="outline" onClick={() => props.addControl(ev.id)}>
                Agregar control para este evento
              </AddActionButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepParticipants(props: {
  workers: ArtpWorkerSignature[];
  setWorkers: (w: ArtpWorkerSignature[]) => void;
  candidates: PlatformUser[];
  orgId: string;
  supervisorMemberId?: string;
}) {
  const pool = props.candidates.filter((u) => u.id !== props.supervisorMemberId);
  const selectedIds = new Set(props.workers.map((w) => w.memberId).filter(Boolean));

  const toggleMember = (memberId: string, checked: boolean) => {
    const user = props.candidates.find((u) => u.id === memberId);
    if (!user) return;
    if (checked) {
      if (selectedIds.has(memberId)) return;
      props.setWorkers([
        ...props.workers,
        {
          id: newId(props.orgId, "wrk"),
          memberId: user.id,
          workerName: formatPlatformUserName(user),
          signatureDataUrl: null,
        },
      ]);
    } else {
      props.setWorkers(props.workers.filter((w) => w.memberId !== memberId));
    }
  };

  return (
    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
      <p className="text-xs text-gray-600">
        Marque a todos los trabajadores que ejecutarán la tarea. Las firmas se solicitan en la
        aplicación móvil al enviar el ARTP a firma.
      </p>
      <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {pool.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No hay usuarios activos disponibles.</p>
        ) : (
          pool.map((u) => (
            <label
              key={u.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[#F04438] focus:ring-[#F04438]"
                checked={selectedIds.has(u.id)}
                onChange={(e) => toggleMember(u.id, e.target.checked)}
              />
              <span className="text-sm text-gray-900">
                <span className="font-semibold">{formatPlatformUserName(u)}</span>
                {u.cargoName ? (
                  <span className="text-gray-500 font-normal"> · {u.cargoName}</span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </div>
      {props.workers.length === 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Debe incluir al menos un trabajador involucrado.
        </p>
      )}
      {props.workers.length > 0 && (
        <p className="text-xs text-gray-600">
          Seleccionados: {props.workers.map((w) => w.workerName).join(", ")}
        </p>
      )}
    </div>
  );
}

function AddActionButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-xs",
        variant === "primary" && "bg-[#F04438] hover:bg-[#D92D20] text-white",
        variant === "secondary" && "bg-white border-2 border-[#F04438] text-[#F04438] hover:bg-red-50",
        variant === "outline" && "bg-teal-50 border border-teal-300 text-teal-900 hover:bg-teal-100"
      )}
    >
      <LuPlus className="w-4 h-4 shrink-0" />
      {children}
    </button>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1 text-xs font-semibold border",
        active ? "bg-[#F04438] text-white border-[#F04438]" : "border-gray-200 text-gray-600"
      )}
    >
      {children}
    </button>
  );
}

function YesNoButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-lg px-4 py-1.5 text-xs font-bold border",
        active ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600"
      )}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={clsx("block text-sm font-medium text-gray-700", className)}>
      {label}
      <input
        type={type}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function MiniField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-gray-700">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
