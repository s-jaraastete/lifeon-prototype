export type DashboardMenuKey =
  | "dashboard"
  | "users"
  | "org"
  | "iper"
  | "docs"
  | "apr"
  | "techDocs";

/** Módulos de la sección Gestión técnica del sidebar */
export const TECHNICAL_MANAGEMENT_MENU_KEYS: DashboardMenuKey[] = [
  "iper",
  "docs",
  "techDocs",
  "apr",
];

export function isTechnicalManagementMenu(key: DashboardMenuKey): boolean {
  return TECHNICAL_MANAGEMENT_MENU_KEYS.includes(key);
}
