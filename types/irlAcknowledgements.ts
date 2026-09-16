export type IrlAcknowledgementStatus = "Pendiente" | "Enviado" | "Firmado";

export interface IrlAcknowledgement {
  id: string;
  matrixId: string;
  cargoName: string;
  userId: string;
  userName: string;
  identificationNumber?: string;
  status: IrlAcknowledgementStatus;
  sentAt?: string | null;
  acknowledgedAt?: string | null;
  updatedAt: string;
}
