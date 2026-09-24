export type UserRole = "Lector" | "Editor" | "Administrador";

export interface MemberContext {
  memberId: string;
  organizationId: string;
  organizationName: string;
  email: string;
  displayName: string;
  role: UserRole;
  cargoId: string | null;
  cargoName: string | null;
  workCenterId: string | null;
  workCenterName: string | null;
  authUserId: string;
}

export interface IrlEvaluation {
  id?: string;
  task?: string;
  process?: string;
  hazard?: string;
  riskEvent?: string;
  initialLevel?: string;
  controls?: string;
  cargo?: string;
}

export interface IrlMatrixEntry {
  memberId: string;
  organizationId: string;
  organizationName: string;
  matrixId: string;
  matrixCode: string;
  matrixTitle: string;
  workCenterId: string | null;
  workCenterName: string;
  cargoId: string | null;
  cargoName: string;
  matrixUpdatedAt: string | null;
  sortKey?: number;
  evaluations: IrlEvaluation[];
}

export type DeliveryStatus =
  | "pendiente_revision"
  | "pendiente_firma"
  | "firmado"
  | "anulado";

export type DeliverySourceType = "irl" | "technical_document";

export interface DocumentDelivery {
  id: string;
  organization_id: string;
  assignee_member_id: string;
  assignee_auth_user_id: string;
  source_type: DeliverySourceType;
  source_id: string;
  cargo_id: string | null;
  cargo_name: string | null;
  work_center_id: string | null;
  work_center_name: string | null;
  title: string;
  document_code: string | null;
  content_snapshot: Record<string, unknown>;
  content_hash: string;
  source_updated_at: string | null;
  status: DeliveryStatus;
  assigned_at: string;
  opened_at: string | null;
  signed_at: string | null;
  signed_by_auth_user_id: string | null;
  signature_path: string | null;
}
