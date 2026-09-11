export type EntityStatus = "Activo" | "Inactivo";

export type UserRole = "Lector" | "Editor" | "Administrador";

export interface OrgWorkCenter {
  id: string;
  name: string;
  code?: string;
  address?: string;
  description?: string;
  status: EntityStatus;
  createdAt?: string;
  organizationId?: string;
}

export interface OrgSubprocess {
  id: string;
  name: string;
  code?: string;
  description?: string;
  processId?: string;
  status?: EntityStatus;
  organizationId?: string;
}

export interface OrgProcess {
  id: string;
  name: string;
  code?: string;
  description?: string;
  areaId?: string;
  areaName?: string;
  workCenterId?: string;
  workCenterName?: string;
  status?: EntityStatus;
  subprocesses: OrgSubprocess[];
  organizationId?: string;
}

export interface OrgArea {
  id: string;
  name: string;
  code?: string;
  workCenterId?: string;
  workCenter?: string;
  workCenterName?: string;
  description?: string;
  status?: EntityStatus;
  processes: OrgProcess[];
  organizationId?: string;
}

export interface OrgPosition {
  id: string;
  name: string;
  code?: string;
  description?: string;
  // Dotación diferenciada (Req 18)
  totalStaff?: number;
  menCount?: number;
  womenCount?: number;
  otherCount?: number;
  // Características especiales agregadas (Req 19)
  disabledCount?: number;
  sensitiveCount?: number;
  specialConditionsNote?: string;
  status: EntityStatus;
  createdAt?: string;
  areaId?: string;
  areaName?: string;
  organizationId?: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  cargoId?: string;
  cargoName?: string;
  areaId?: string;
  areaName?: string;
  role?: UserRole;
  status: EntityStatus;
  createdAt?: string;
  organizationId?: string;
}

export interface OrgStructureData {
  workCenters: OrgWorkCenter[];
  areas: OrgArea[];
  positions: OrgPosition[];
  users: OrgUser[];
  lastUpdated?: string;
}

export interface OrgStructureState {
  workCenters: OrgWorkCenter[];
  areas: OrgArea[];
  positions: OrgPosition[];
  users: OrgUser[];
  lastUpdated?: string;
}

export interface ImportRow {
  workCenterName?: string;
  areaName: string;
  processName: string;
  subprocessName: string;
  cargoName: string;
  userName: string;
  userEmail: string;
  userRole?: UserRole;
}

export interface ImportErrorRecord {
  rowNumber: number;
  data: Partial<ImportRow>;
  errors: string[];
}

export interface ImportValidationReport {
  validRows: ImportRow[];
  errorRows: ImportErrorRecord[];
  totalRows: number;
  isValid: boolean;
  summary: {
    newWorkCentersCount?: number;
    newAreasCount: number;
    newProcessesCount: number;
    newSubprocessesCount: number;
    newPositionsCount: number;
    newUsersCount: number;
  };
}

export interface XlsxWorkCenterRow {
  code: string;
  name: string;
  address?: string;
  description?: string;
  status?: EntityStatus;
}

export interface XlsxAreaRow {
  code: string;
  name: string;
  workCenter?: string;
  workCenterCode?: string;
  workCenterName?: string;
  description?: string;
  status?: EntityStatus;
}

export interface XlsxProcessRow {
  code: string;
  name: string;
  areaCode?: string;
  areaName: string;
  description?: string;
  status?: EntityStatus;
}

export interface XlsxSubprocessRow {
  code?: string;
  name: string;
  processCode?: string;
  processName: string;
  description?: string;
  status?: EntityStatus;
}

export interface XlsxPositionRow {
  code?: string;
  name: string;
  description?: string;
  totalStaff?: number;
  menCount?: number;
  womenCount?: number;
  otherCount?: number;
  disabledCount?: number;
  sensitiveCount?: number;
  status?: EntityStatus;
}

export interface XlsxUserRow {
  name: string;
  lastName?: string;
  email: string;
  cargo: string;
  area?: string;
  role?: UserRole;
  status?: EntityStatus;
}

export interface XlsxImportError {
  sheet: string;
  rowNumber: number;
  item: string;
  error: string;
}

export interface XlsxValidationReport {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  isValid: boolean;
  errors: XlsxImportError[];
  parsedData: {
    workCenters: XlsxWorkCenterRow[];
    areas: XlsxAreaRow[];
    processes: XlsxProcessRow[];
    subprocesses: XlsxSubprocessRow[];
    positions: XlsxPositionRow[];
    users: XlsxUserRow[];
  };
  summary: {
    workCentersCount: number;
    newWorkCentersCount?: number;
    areasCount: number;
    processesCount: number;
    subprocessesCount: number;
    positionsCount: number;
    usersCount: number;
  };
}
