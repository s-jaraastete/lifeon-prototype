export type DashboardMenuKey =
  | "dashboard"
  | "users"
  | "org"
  | "iper"
  | "artp"
  | "docs"
  | "apr"
  | "techDocs";

/** Módulos de la sección Gestión técnica del sidebar */
export const TECHNICAL_MANAGEMENT_MENU_KEYS: DashboardMenuKey[] = [
  "iper",
  "artp",
  "docs",
  "techDocs",
  "apr",
];

export function isTechnicalManagementMenu(key: DashboardMenuKey): boolean {
  return TECHNICAL_MANAGEMENT_MENU_KEYS.includes(key);
}
