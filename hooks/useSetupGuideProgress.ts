"use client";

import { useMemo } from "react";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { useUsers } from "./useUsers";
import { useOrgStructure } from "./useOrgStructure";

export interface SetupGuideStepProgress {
  id: "profile" | "users" | "structure";
  complete: boolean;
  subChecks?: { label: string; done: boolean }[];
}

export function useSetupGuideProgress() {
  const { preferences, currentUser } = useLifeOnPreferences();
  const { users } = useUsers();
  const { workCenters, areas, positions } = useOrgStructure();

  const hasPhoto = Boolean(
    preferences.profilePhoto || currentUser?.avatarUrl
  );
  const hasLogo = Boolean(preferences.organizationLogo);
  const hasOrgName = Boolean(
    preferences.organizationName?.trim() || currentUser?.orgName
  );
  const hasEmail = Boolean(currentUser?.email);

  const profileComplete = hasPhoto && hasLogo && hasOrgName && hasEmail;

  const usersComplete = users.length >= 1;

  const hasWorkCenter = workCenters.filter((w) => w.status !== "Inactivo").length >= 1;
  const activeAreas = areas.filter((a) => a.status !== "Inactivo");
  const hasArea = activeAreas.length >= 1;
  const processCount = activeAreas.reduce(
    (acc, a) => acc + (a.processes?.filter((p) => p.status !== "Inactivo").length || 0),
    0
  );
  const hasProcess = processCount >= 1;
  const hasPositions = positions.filter((p) => p.status !== "Inactivo").length >= 1;

  const structureComplete = hasWorkCenter && hasArea && hasProcess && hasPositions;

  const steps: SetupGuideStepProgress[] = useMemo(
    () => [
      {
        id: "profile",
        complete: profileComplete,
        subChecks: [
          { label: "Foto de perfil", done: hasPhoto },
          { label: "Logo de empresa", done: hasLogo },
          { label: "Nombre de organización", done: hasOrgName },
          { label: "Email", done: hasEmail },
        ],
      },
      {
        id: "users",
        complete: usersComplete,
        subChecks: [{ label: "Al menos un usuario creado", done: usersComplete }],
      },
      {
        id: "structure",
        complete: structureComplete,
        subChecks: [
          { label: "Centro de trabajo", done: hasWorkCenter },
          { label: "Área", done: hasArea },
          { label: "Proceso", done: hasProcess },
          { label: "Cargo", done: hasPositions },
        ],
      },
    ],
    [
      profileComplete,
      hasPhoto,
      hasLogo,
      hasOrgName,
      hasEmail,
      usersComplete,
      structureComplete,
      hasWorkCenter,
      hasArea,
      hasProcess,
      hasPositions,
    ]
  );

  const allComplete = steps.every((s) => s.complete);

  return { steps, allComplete };
}
