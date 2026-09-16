export type UserIdentificationType = "RUT" | "Pasaporte" | "DNI";
export type UserRole = "Lector" | "Editor" | "Administrador";
export type UserStatus = "Activo" | "Inactivo";

export interface ModulePermission {
  ver?: boolean;
  crear?: boolean;
  editar?: boolean;
  eliminar?: boolean;
}

export interface UserPermissions {
  usuarios?: ModulePermission;
  estructuraOrganizacional?: ModulePermission;
  matrizIper?: ModulePermission;
  planificacion?: ModulePermission;
  documentacionTecnica?: ModulePermission;
}

export interface PlatformUser {
  id: string;
  firstName: string;
  lastName: string;
  identificationType: UserIdentificationType;
  identificationNumber: string;
  email: string;
  phone?: string;
  role: UserRole;
  permissions?: UserPermissions;
  status: UserStatus;
  cargoId?: string;
  cargoName?: string;
  areaId?: string;
  areaName?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersStorageData {
  users: PlatformUser[];
  lastUpdated?: string;
}

export interface UserXlsxRow {
  firstName: string;
  lastName: string;
  identificationType: UserIdentificationType;
  identificationNumber: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UserImportXlsxError {
  rowNumber: number;
  item: string;
  errors: string[];
}

export interface UserImportReport {
  totalRecords: number;
  validRecords: number;
  errorRecords: number;
  isValid: boolean;
  errors: UserImportXlsxError[];
  parsedData: UserXlsxRow[];
  summary: {
    newUsersCount: number;
    duplicateEmails: number;
  };
}
