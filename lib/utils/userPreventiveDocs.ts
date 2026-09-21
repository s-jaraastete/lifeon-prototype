import type {
  UserPreventiveDocAcknowledgement,
  UserPreventiveDocKind,
  UserPreventiveDocStatus,
} from "@/types/preferences";
import type { IrlAcknowledgement } from "@/types/irlAcknowledgements";
import type { PlatformUser } from "@/types/users";

export function getUserPreventiveAck(
  list: UserPreventiveDocAcknowledgement[] | undefined,
  userId: string,
  kind: UserPreventiveDocKind
): UserPreventiveDocAcknowledgement | undefined {
  return list?.find((a) => a.userId === userId && a.kind === kind);
}

export function upsertUserPreventiveAck(
  list: UserPreventiveDocAcknowledgement[] | undefined,
  userId: string,
  kind: UserPreventiveDocKind,
  status: UserPreventiveDocStatus
): UserPreventiveDocAcknowledgement[] {
  const now = new Date().toISOString();
  const existing = getUserPreventiveAck(list, userId, kind);
  const next: UserPreventiveDocAcknowledgement = {
    userId,
    kind,
    status,
    signedAt: status === "Firmado" ? now : null,
    updatedAt: now,
  };
  if (!existing) return [...(list || []), next];
  return (list || []).map((a) => (a.userId === userId && a.kind === kind ? { ...a, ...next } : a));
}

export function findIrlAckForUser(
  acknowledgements: IrlAcknowledgement[],
  user: PlatformUser,
  matrixId?: string
): IrlAcknowledgement | undefined {
  const cargo = user.cargoName?.trim().toLowerCase();
  return acknowledgements.find((a) => {
    if (a.userId !== user.id) return false;
    if (matrixId && a.matrixId !== matrixId) return false;
    if (!cargo) return true;
    return a.cargoName?.trim().toLowerCase() === cargo;
  });
}
