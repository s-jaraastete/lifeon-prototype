export type DocumentType =
  | "RIOHS"
  | "PTS"
  | "Instructivo"
  | "PlanEmergencia"
  | "PoliticaSST";

export type DocumentStatus = "Borrador" | "En Revisión" | "Vigente" | "Archivado";

export interface DocumentSection {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
}

export interface DocumentTypeDefinition {
  type: DocumentType;
  label: string;
  description: string;
  colorClass: string;
  sections: DocumentSection[];
}

export interface TechnicalDocument {
  id: string;
  organizationId: string;
  documentType: DocumentType;
  name: string;
  status: DocumentStatus;
  content: Record<string, string>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalDocsStorageData {
  documents: TechnicalDocument[];
  lastUpdated?: string;
}
