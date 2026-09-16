"use client";

import React, { useState, useMemo, useRef } from "react";
import clsx from "clsx";
import {
  LuUsers,
  LuPlus,
  LuUpload,
  LuSearch,
  LuPencil,
  LuPower,
  LuTrash2,
  LuX,
  LuTriangleAlert,
  LuCircleCheck,
  LuFileSpreadsheet,
  LuMail,
  LuPhone,
  LuUser,
} from "react-icons/lu";
import { useUsers } from "@/hooks/useUsers";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import {
  PlatformUser,
  UserRole,
  UserIdentificationType,
  UserStatus,
  UserImportReport,
} from "@/types/users";

const ROLES: UserRole[] = ["Lector", "Editor", "Administrador"];
const ID_TYPES: UserIdentificationType[] = ["RUT", "Pasaporte", "DNI"];

type UserFormState = {
  firstName: string;
  lastName: string;
  identificationType: UserIdentificationType;
  identificationNumber: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  cargoId: string;
  areaId: string;
};

type UserFormFieldsProps = {
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
  positions: { id: string; name: string }[];
  areas: { id: string; name: string }[];
};

function UserFormFields({ form, setForm, positions, areas }: UserFormFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Nombres *</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            placeholder="Ej: Carlos"
            required
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Apellidos *</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            placeholder="Ej: Mendoza Riquelme"
            required
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Identificación *</label>
        <div className="flex gap-2">
          {ID_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm((f) => ({ ...f, identificationType: t, identificationNumber: "" }))}
              className={clsx(
                "flex-1 py-2 rounded-xl text-xs font-bold border transition",
                form.identificationType === t
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-teal-400"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          {form.identificationType === "RUT"
            ? "RUT *"
            : form.identificationType === "Pasaporte"
            ? "Número de Pasaporte *"
            : "Número de DNI *"}
        </label>
        <input
          type="text"
          value={form.identificationNumber}
          onChange={(e) => setForm((f) => ({ ...f, identificationNumber: e.target.value }))}
          placeholder={
            form.identificationType === "RUT"
              ? "Ej: 12345678-9"
              : form.identificationType === "Pasaporte"
              ? "Ej: AA1234567"
              : "Ej: 87654321"
          }
          required
          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Ej: usuario@empresa.cl"
          required
          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono (opcional)</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="Ej: +56 9 1234 5678"
          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Rol *</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            required
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Estado</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
            className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {(positions.length > 0 || areas.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {positions.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cargo (opcional)</label>
              <select
                value={form.cargoId}
                onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Sin cargo asignado</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {areas.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Área (opcional)</label>
              <select
                value={form.areaId}
                onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="">Sin área asignada</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-[10px] font-bold border",
        role === "Administrador"
          ? "bg-purple-50 text-purple-700 border-purple-200"
          : role === "Lector"
          ? "bg-slate-100 text-slate-700 border-slate-200"
          : "bg-teal-50 text-teal-700 border-teal-200"
      )}
    >
      {role}
    </span>
  );
}

export default function UsersView() {
  const {
    users,
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
  } = useUsers();

  const { positions, areas } = useOrgStructure();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmId, setIsDeleteConfirmId] = useState<string | null>(null);

  const [importReport, setImportReport] = useState<UserImportReport | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UserFormState>({
    firstName: "",
    lastName: "",
    identificationType: "RUT",
    identificationNumber: "",
    email: "",
    phone: "",
    role: "Editor",
    status: "Activo",
    cargoId: "",
    areaId: "",
  });

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      identificationType: "RUT",
      identificationNumber: "",
      email: "",
      phone: "",
      role: "Editor",
      status: "Activo",
      cargoId: "",
      areaId: "",
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      identificationType: user.identificationType,
      identificationNumber: user.identificationNumber,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
      cargoId: user.cargoId || "",
      areaId: user.areaId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const emailExists = users.some((u) => u.email.toLowerCase() === form.email.toLowerCase());
    if (emailExists) {
      alert("Ya existe un usuario con ese email.");
      return;
    }
    const cargo = positions.find((p) => p.id === form.cargoId);
    const area = areas.find((a) => a.id === form.areaId);
    addUser({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identificationType: form.identificationType,
      identificationNumber: form.identificationNumber.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      status: form.status,
      cargoId: form.cargoId || undefined,
      cargoName: cargo?.name || undefined,
      areaId: form.areaId || undefined,
      areaName: area?.name || undefined,
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const emailExists = users.some(
      (u) => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editingUser.id
    );
    if (emailExists) {
      alert("Ya existe otro usuario con ese email.");
      return;
    }
    const cargo = positions.find((p) => p.id === form.cargoId);
    const area = areas.find((a) => a.id === form.areaId);
    updateUser(editingUser.id, {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      identificationType: form.identificationType,
      identificationNumber: form.identificationNumber.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      role: form.role,
      status: form.status,
      cargoId: form.cargoId || undefined,
      cargoName: cargo?.name || undefined,
      areaId: form.areaId || undefined,
      areaName: area?.name || undefined,
    });
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const report = await validateImportFile(file);
      setImportReport(report);
    } catch {
      setImportFeedback("Error al leer el archivo. Verifica que sea un XLSX válido.");
    }
  };

  const handleConfirmImport = () => {
    if (!importReport || importReport.validRecords === 0) return;
    applyImport(importReport.parsedData);
    setImportFeedback(`¡Se importaron ${importReport.validRecords} usuarios correctamente!`);
    setTimeout(() => {
      setImportFeedback(null);
      setIsImportModalOpen(false);
      setImportReport(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 2200);
  };

  const filteredUsers = useMemo(() => {
    let list = users;
    if (filterRole !== "all") list = list.filter((u) => u.role === filterRole);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cargoName && u.cargoName.toLowerCase().includes(q)) ||
        (u.areaName && u.areaName.toLowerCase().includes(q)) ||
        u.identificationNumber.toLowerCase().includes(q)
    );
  }, [users, searchQuery, filterRole]);

  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-poppins)] select-none">
      {/* Header */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <LuUsers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Usuarios</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Administra las personas con acceso a LifeOn, sus roles y permisos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadTemplateXlsx}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
          >
            <LuFileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Plantilla XLSX</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setImportReport(null);
              setImportFeedback(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
          >
            <LuUpload className="w-4 h-4 text-teal-600" />
            <span>Importar Usuarios</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            <LuUsers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalUsersCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Usuarios registrados</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Activos</span>
            <LuCircleCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{totalActiveUsersCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Con acceso activo</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Inactivos</span>
            <LuPower className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-500">{totalInactiveUsersCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Acceso suspendido</span>
        </div>
      </section>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterRole("all")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0",
              filterRole === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            )}
          >
            Todos ({totalUsersCount})
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={clsx(
                "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0",
                filterRole === r ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
              )}
            >
              {r} ({users.filter((u) => u.role === r).length})
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <LuSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email, cargo..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <LuUsers className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {totalUsersCount === 0 ? "Sin usuarios registrados" : "Sin resultados"}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              {totalUsersCount === 0
                ? "Crea el primer usuario haciendo clic en 'Nuevo Usuario' o importa desde una plantilla XLSX."
                : "No hay usuarios que coincidan con los filtros aplicados."}
            </p>
            {totalUsersCount === 0 && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                + Crear Primer Usuario
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Identificación</th>
                  <th className="py-3 px-4">Cargo / Área</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((usr) => {
                  const isInactive = usr.status === "Inactivo";
                  const fullName = `${usr.firstName} ${usr.lastName}`;
                  const initials = `${usr.firstName[0] || ""}${usr.lastName[0] || ""}`.toUpperCase();

                  return (
                    <tr key={usr.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initials || <LuUser className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{fullName}</p>
                            {usr.phone && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <LuPhone className="w-3 h-3" />
                                {usr.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-gray-600 flex items-center gap-1">
                          <LuMail className="w-3 h-3 text-gray-400 shrink-0" />
                          {usr.email}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                          {usr.identificationType}
                        </span>
                        <p className="font-mono text-[11px] text-gray-500 mt-0.5">{usr.identificationNumber}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800 text-[11px]">{usr.cargoName || "Sin cargo"}</p>
                        <p className="text-[11px] text-gray-400">{usr.areaName || ""}</p>
                      </td>
                      <td className="py-3 px-4">
                        <RoleBadge role={usr.role} />
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            isInactive
                              ? "bg-gray-100 text-gray-500 border-gray-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {usr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(usr)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                            title="Editar usuario"
                          >
                            <LuPencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(usr.id)}
                            className={clsx(
                              "p-1.5 rounded-lg transition",
                              isInactive
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : "text-gray-500 hover:bg-gray-100"
                            )}
                            title={isInactive ? "Activar usuario" : "Desactivar usuario"}
                          >
                            <LuPower className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDeleteConfirmId(usr.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition"
                            title="Eliminar usuario"
                          >
                            <LuTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {isDeleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <LuTriangleAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Eliminar Usuario</h3>
                <p className="text-xs text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(isDeleteConfirmId);
                  setIsDeleteConfirmId(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Nuevo Usuario</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <UserFormFields
                form={form}
                setForm={setForm}
                positions={positions}
                areas={areas}
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    !form.firstName.trim() ||
                    !form.lastName.trim() ||
                    !form.email.trim() ||
                    !form.identificationNumber.trim()
                  }
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Editar Usuario</h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <UserFormFields
                form={form}
                setForm={setForm}
                positions={positions}
                areas={areas}
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    !form.firstName.trim() ||
                    !form.lastName.trim() ||
                    !form.email.trim() ||
                    !form.identificationNumber.trim()
                  }
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Importar Usuarios</h3>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportReport(null);
                  setImportFeedback(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {importFeedback ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <LuCircleCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">{importFeedback}</p>
              </div>
            ) : (
              <>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-teal-400 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <LuUpload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-800">Selecciona el archivo XLSX</p>
                  <p className="text-xs text-gray-400 mt-1">Usa la plantilla oficial de Usuarios LifeOn</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                {importReport && (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-gray-50 rounded-xl text-center">
                        <p className="text-xl font-black text-gray-900">{importReport.totalRecords}</p>
                        <p className="text-[11px] text-gray-500">Total</p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-center">
                        <p className="text-xl font-black text-emerald-700">{importReport.validRecords}</p>
                        <p className="text-[11px] text-gray-500">Válidos</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-xl text-center">
                        <p className="text-xl font-black text-red-600">{importReport.errorRecords}</p>
                        <p className="text-[11px] text-gray-500">Con error</p>
                      </div>
                    </div>

                    {importReport.errors.length > 0 && (
                      <div className="bg-red-50/60 border border-red-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                          <LuTriangleAlert className="w-3.5 h-3.5" />
                          Errores encontrados:
                        </p>
                        {importReport.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-[11px] text-red-700 mb-1.5">
                            <span className="font-semibold">
                              Fila {err.rowNumber} ({err.item}):
                            </span>
                            {err.errors.map((e, j) => (
                              <span key={j} className="block ml-2">
                                • {e}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setImportReport(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                      >
                        Cambiar archivo
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={importReport.validRecords === 0}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                      >
                        Importar {importReport.validRecords} usuarios
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
