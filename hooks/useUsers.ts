"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createThemedDataSheet,
  createThemedInstructionsSheet,
  normalizeImportedRows,
} from "@/lib/xlsx/lifeOnWorkbookTheme";
import {
  PlatformUser,
  UserRole,
  UserStatus,
  UserIdentificationType,
  UsersStorageData,
  UserXlsxRow,
  UserImportReport,
} from "@/types/users";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { getScopedStorageKey } from "@/lib/auth/authService";
import {
  deleteMember,
  fetchMembersByOrganization,
  upsertMember,
} from "@/lib/repositories/memberRepository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

export const PLATFORM_USERS_STORAGE_KEY = "lifeon_platform_users";
export const USERS_CHANGE_EVENT = "lifeon-platform-users-change";

export function useUsers() {
  const { currentUser } = useLifeOnPreferences();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = useMemo(() => getScopedStorageKey(PLATFORM_USERS_STORAGE_KEY, orgId), [orgId]);

  const loadUsers = useCallback(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed: UsersStorageData = JSON.parse(stored);
        setUsers(parsed.users || []);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    }

    if (isSupabaseConfigured()) {
      void fetchMembersByOrganization(orgId).then((cloudUsers) => {
        if (cloudUsers.length > 0) {
          setUsers(cloudUsers);
          try {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({ users: cloudUsers, lastUpdated: new Date().toISOString() })
              );
            }
          } catch {
            /* noop */
          }
        }
      });
    }

    setIsLoaded(true);
  }, [storageKey, orgId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const handler = () => loadUsers();
    window.addEventListener(USERS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(USERS_CHANGE_EVENT, handler);
  }, [loadUsers]);

  const persistUsers = useCallback(
    (updated: PlatformUser[]) => {
      const data: UsersStorageData = { users: updated, lastUpdated: new Date().toISOString() };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(data));
          window.dispatchEvent(new CustomEvent(USERS_CHANGE_EVENT, { detail: updated }));
        }
      } catch { /* noop */ }
      setUsers(updated);
      if (isSupabaseConfigured()) {
        void Promise.all(updated.map((u) => upsertMember(orgId, u))).then((results) => {
          if (results.some((r) => !r)) {
            console.warn("Algunos usuarios no se guardaron en Supabase.");
          }
        });
      }
    },
    [storageKey, orgId]
  );

  const addUser = useCallback(
    (userData: Omit<PlatformUser, "id" | "organizationId" | "createdAt" | "updatedAt">) => {
      const newUser: PlatformUser = {
        ...userData,
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        organizationId: orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistUsers([...users, newUser]);
      return newUser;
    },
    [users, persistUsers, orgId]
  );

  const updateUser = useCallback(
    (userId: string, updates: Partial<PlatformUser>) => {
      const updated = users.map((u) =>
        u.id === userId ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
      );
      persistUsers(updated);
    },
    [users, persistUsers]
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      const updated = users.map((u) => {
        if (u.id === userId) {
          const nextStatus: UserStatus = u.status === "Inactivo" ? "Activo" : "Inactivo";
          return { ...u, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return u;
      });
      persistUsers(updated);
    },
    [users, persistUsers]
  );

  const deleteUser = useCallback(
    (userId: string) => {
      persistUsers(users.filter((u) => u.id !== userId));
      if (isSupabaseConfigured()) {
        void deleteMember(orgId, userId);
      }
    },
    [users, persistUsers, orgId]
  );

  const downloadTemplateXlsx = useCallback(() => {
    const wb = XLSX.utils.book_new();

    const wsInstructions = createThemedInstructionsSheet({
      title: "PLANTILLA DE USUARIOS — LIFEON",
      subtitle: "Importación masiva de usuarios con acceso a la plataforma LifeOn.",
      legendNotes: [
        "Complete la hoja USUARIOS con los datos de cada persona que tendrá acceso a la plataforma.",
        "Los campos marcados con * [OBLIGATORIO] son obligatorios.",
        "El campo Email debe ser único dentro de la organización.",
      ],
      sections: [
        {
          title: "1. TIPOS DE IDENTIFICACIÓN",
          items: [
            "RUT: Para trabajadores chilenos. Formato sin puntos, con guión (Ej: 12345678-9).",
            "Pasaporte: Para trabajadores extranjeros con pasaporte.",
            "DNI: Para trabajadores extranjeros con documento nacional de identidad.",
          ],
        },
        {
          title: "2. ROLES DISPONIBLES",
          items: [
            "Lector: Solo puede visualizar matrices, programas y documentos.",
            "Editor: Puede crear, editar y cargar evidencias en módulos autorizados.",
            "Administrador: Gestión completa de usuarios, estructura y configuración.",
          ],
        },
        {
          title: "3. REGLAS DE VALIDACIÓN",
          items: [
            "Nombres y Apellidos son obligatorios.",
            "El email debe tener formato válido y ser único dentro de la organización.",
            "El Tipo de Identificación debe ser exactamente: RUT, Pasaporte o DNI.",
            "El Rol debe ser exactamente: Lector, Editor o Administrador.",
            "El Estado debe ser: Activo o Inactivo (por defecto Activo).",
          ],
        },
      ],
    });

    const wsUsers = createThemedDataSheet({
      sheetTitle: "USUARIOS",
      columns: [
        { header: "Nombres", key: "firstName", mandatory: true, width: 22 },
        { header: "Apellidos", key: "lastName", mandatory: true, width: 26 },
        { header: "Tipo de Identificación", key: "identificationType", mandatory: true, width: 24, notes: "RUT / Pasaporte / DNI" },
        { header: "Número de Identificación", key: "identificationNumber", mandatory: true, width: 26 },
        { header: "Email", key: "email", mandatory: true, width: 36 },
        { header: "Teléfono", key: "phone", mandatory: false, width: 18 },
        { header: "Rol", key: "role", mandatory: true, width: 18, notes: "Lector / Editor / Administrador" },
        { header: "Estado", key: "status", mandatory: false, width: 14, notes: "Activo / Inactivo" },
      ],
      data: [
        {
          firstName: "Carlos",
          lastName: "Mendoza Riquelme",
          identificationType: "RUT",
          identificationNumber: "12345678-9",
          email: "carlos.mendoza@empresa.cl",
          phone: "+56 9 1234 5678",
          role: "Administrador",
          status: "Activo",
        },
        {
          firstName: "María",
          lastName: "Rojas Soto",
          identificationType: "RUT",
          identificationNumber: "98765432-1",
          email: "maria.rojas@empresa.cl",
          phone: "+56 9 8765 4321",
          role: "Editor",
          status: "Activo",
        },
        {
          firstName: "Juan",
          lastName: "Pérez García",
          identificationType: "DNI",
          identificationNumber: "87654321",
          email: "juan.perez@empresa.cl",
          phone: "",
          role: "Lector",
          status: "Activo",
        },
      ],
    });

    XLSX.utils.book_append_sheet(wb, wsInstructions, "INSTRUCCIONES");
    XLSX.utils.book_append_sheet(wb, wsUsers, "USUARIOS");
    XLSX.writeFile(wb, "Plantilla_Usuarios_LifeOn.xlsx");
  }, []);

  const validateImportFile = useCallback(
    async (file: File): Promise<UserImportReport> => {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      const errors: UserImportReport["errors"] = [];
      const parsedData: UserXlsxRow[] = [];
      let totalRecords = 0;
      let validRecords = 0;
      let duplicateEmails = 0;

      const sheetName =
        wb.SheetNames.find((s) =>
          s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes("usuario")
        ) ||
        wb.SheetNames.find((s) => !s.toLowerCase().includes("instruc")) ||
        wb.SheetNames[0];

      if (!sheetName) {
        return {
          totalRecords: 0,
          validRecords: 0,
          errorRecords: 0,
          isValid: false,
          errors: [{ rowNumber: 0, item: "Archivo", errors: ["No se encontró la hoja USUARIOS en el archivo."] }],
          parsedData: [],
          summary: { newUsersCount: 0, duplicateEmails: 0 },
        };
      }

      const rows: any[] = normalizeImportedRows(wb.Sheets[sheetName]);
      const seenEmails = new Set<string>();
      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));

      rows.forEach((r, idx) => {
        totalRecords++;
        const rowNum = idx + 2;
        const firstName = String(r["nombres"] || r["nombre"] || "").trim();
        const lastName = String(r["apellidos"] || r["apellido"] || "").trim();
        const identificationType = String(
          r["tipo de identificacion"] || r["tipo de identificación"] || "RUT"
        ).trim() as UserIdentificationType;
        const identificationNumber = String(
          r["numero de identificacion"] || r["número de identificación"] || r["identificacion"] || ""
        ).trim();
        const email = String(r["email"] || r["correo"] || "").trim().toLowerCase();
        const phone = String(r["telefono"] || r["teléfono"] || "").trim();
        const rawRole = String(r["rol"] || "Editor").trim();
        const rawStatus = String(r["estado"] || "Activo").trim();

        const rowErrors: string[] = [];

        if (!firstName) rowErrors.push("El campo 'Nombres' es obligatorio.");
        if (!lastName) rowErrors.push("El campo 'Apellidos' es obligatorio.");
        if (!identificationNumber) rowErrors.push("El Número de Identificación es obligatorio.");
        if (!["RUT", "Pasaporte", "DNI"].includes(identificationType)) {
          rowErrors.push(
            `Tipo de identificación inválido: '${identificationType}'. Use: RUT, Pasaporte o DNI.`
          );
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          rowErrors.push(`Email '${email}' no es válido.`);
        } else if (seenEmails.has(email)) {
          rowErrors.push(`Email '${email}' está duplicado en el archivo.`);
          duplicateEmails++;
        } else if (existingEmails.has(email)) {
          rowErrors.push(`Email '${email}' ya existe en la organización.`);
          duplicateEmails++;
        }

        let role: UserRole = "Editor";
        if (rawRole.toLowerCase().includes("admin")) role = "Administrador";
        else if (rawRole.toLowerCase().includes("lector")) role = "Lector";
        else role = "Editor";

        const status: UserStatus = rawStatus.toLowerCase().includes("inac") ? "Inactivo" : "Activo";

        if (rowErrors.length > 0) {
          errors.push({
            rowNumber: rowNum,
            item: `${firstName} ${lastName}`.trim() || `Fila ${rowNum}`,
            errors: rowErrors,
          });
        } else {
          validRecords++;
          seenEmails.add(email);
          parsedData.push({
            firstName,
            lastName,
            identificationType,
            identificationNumber,
            email,
            phone: phone || undefined,
            role,
            status,
          });
        }
      });

      return {
        totalRecords,
        validRecords,
        errorRecords: errors.length,
        isValid: errors.length === 0 && validRecords > 0,
        errors,
        parsedData,
        summary: { newUsersCount: validRecords, duplicateEmails },
      };
    },
    [users]
  );

  const applyImport = useCallback(
    (parsedData: UserXlsxRow[]) => {
      const newUsers: PlatformUser[] = parsedData.map((row) => ({
        id: `usr-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        firstName: row.firstName,
        lastName: row.lastName,
        identificationType: row.identificationType,
        identificationNumber: row.identificationNumber,
        email: row.email,
        phone: row.phone,
        role: row.role,
        status: row.status || "Activo",
        organizationId: orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const existingEmails = new Set(users.map((u) => u.email.toLowerCase()));
      const toAdd = newUsers.filter((u) => !existingEmails.has(u.email.toLowerCase()));
      persistUsers([...users, ...toAdd]);
    },
    [users, persistUsers, orgId]
  );

  const totalUsersCount = users.length;
  const totalActiveUsersCount = useMemo(
    () => users.filter((u) => u.status === "Activo").length,
    [users]
  );
  const totalInactiveUsersCount = useMemo(
    () => users.filter((u) => u.status === "Inactivo").length,
    [users]
  );

  return {
    users,
    isLoaded,
    addUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    downloadTemplateXlsx,
    validateImportFile,
    applyImport,
    totalUsersCount,
    totalActiveUsersCount,
    totalInactiveUsersCount,
  };
}
