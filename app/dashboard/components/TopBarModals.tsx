"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  LuX,
  LuCheck,
  LuCheckCheck,
  LuTriangleAlert,
  LuShieldAlert,
  LuUserRound,
  LuBuilding2,
  LuLogOut,
  LuSettings,
  LuCircleHelp,
  LuFileText,
  LuTable,
  LuAtom,
  LuExternalLink,
  LuSearch,
  LuSparkles,
  LuCreditCard,
  LuStar,
  LuCircleCheck,
  LuIdCard,
  LuMail,
  LuPhone,
  LuBriefcase,
  LuAward,
  LuSave,
  LuBell,
  LuShield,
  LuArrowUpRight,
  LuZap,
  LuSlidersHorizontal,
  LuRotateCcw,
  LuLightbulb,
  LuImage,
  LuUpload,
  LuTrash2,
  LuLock,
  LuKey,
  LuCamera,
} from "react-icons/lu";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import {
  ExperienceLevel,
  GuidanceLevel,
  RiskEvaluationMethod,
  RiskManagementApproach,
} from "@/types/preferences";
import { OrgWorkCenter } from "@/types/orgStructure";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "alert" | "info" | "success";
}

export function NotificationsDropdown({
  notifications,
  onMarkAllAsRead,
  onClose,
  onNavigateTab,
}: {
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}) {
  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900 text-sm">Notificaciones</h4>
          <span className="bg-red-50 text-[#F04438] text-xs font-bold px-2 py-0.5 rounded-full">
            {notifications.filter((n) => !n.read).length} nuevas
          </span>
        </div>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 cursor-pointer"
        >
          <LuCheckCheck className="w-3.5 h-3.5" />
          Marcar leídas
        </button>
      </div>

      <div className="flex flex-col gap-2.5 my-3 max-h-72 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">No tienes notificaciones pendientes</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.title.includes("IPER")) onNavigateTab("iper");
                else if (n.title.includes("Documento") || n.title.includes("Programa")) onNavigateTab("docs");
                else if (n.title.includes("APR")) onNavigateTab("apr");
                onClose();
              }}
              className={clsx(
                "p-3 rounded-xl border text-left transition cursor-pointer flex gap-3",
                n.read
                  ? "bg-gray-50/70 border-gray-100 hover:bg-gray-100/70"
                  : "bg-teal-50/40 border-teal-100 hover:bg-teal-50"
              )}
            >
              <div
                className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  n.type === "alert" && "bg-red-100 text-red-600",
                  n.type === "info" && "bg-blue-100 text-blue-600",
                  n.type === "success" && "bg-emerald-100 text-emerald-600"
                )}
              >
                {n.type === "alert" ? (
                  <LuTriangleAlert className="w-4 h-4" />
                ) : n.type === "success" ? (
                  <LuCheck className="w-4 h-4" />
                ) : (
                  <LuFileText className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{n.title}</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{n.desc}</p>
                <span className="text-[10px] text-gray-400 mt-1.5 block">{n.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
        <span className="text-gray-400 text-[11px]">Sistema SST LifeOn V2</span>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function AlertsDropdown({ onClose, onNavigateTab }: { onClose: () => void; onNavigateTab: (tab: string) => void }) {
  return (
    <div className="absolute left-0 sm:left-auto sm:right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-amber-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-amber-600">
          <LuShieldAlert className="w-5 h-5" />
          <h4 className="font-semibold text-gray-900 text-sm">Alertas Preventivas DS 44</h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3 my-3">
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-xs font-bold text-amber-900">Revisión Obligatoria de Matriz</p>
          </div>
          <p className="text-[11px] text-amber-800 mt-1 leading-snug">
            La Matriz de Riesgos del Proceso &quot;Montaje Estructural&quot; cumple 6 meses de vigencia y requiere re-evaluación según DS 44.
          </p>
          <button
            onClick={() => {
              onNavigateTab("iper");
              onClose();
            }}
            className="mt-2 text-xs font-semibold text-amber-900 bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            Ir a Matriz IPER &rarr;
          </button>
        </div>

        <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <p className="text-xs font-bold text-red-900">Protocolo TMERT Pendiente</p>
          </div>
          <p className="text-[11px] text-red-800 mt-1 leading-snug">
            Existen 3 puestos de trabajo con tareas repetitivas sin evaluación ergonómica documentada en el programa anual.
          </p>
          <button
            onClick={() => {
              onNavigateTab("docs");
              onClose();
            }}
            className="mt-2 text-xs font-semibold text-red-900 bg-red-200/60 hover:bg-red-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
          >
            Ver Programa y Documentos &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserProfileDropdown({
  userDisplayName,
  userEmail,
  activeWorkplace,
  organizationName,
  profilePhoto,
  onOpenAccountModal,
  onOpenSettingsModal,
  onOpenSubscriptionModal,
  onOpenTour,
  onResetTestAccount,
  onLogout,
  onClose,
}: {
  userDisplayName: string;
  userEmail: string;
  activeWorkplace: string;
  organizationName?: string;
  profilePhoto?: string | null;
  onOpenAccountModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenTour?: () => void;
  onResetTestAccount?: () => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const initials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  const displayOrg = organizationName || (userEmail.includes("luis") ? "Mi Organización" : "Constructora y Servicios Santiago SpA");

  return (
    <div className="absolute right-0 top-12 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Cabecera del Usuario */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt={userDisplayName}
            className="w-11 h-11 rounded-full object-cover shadow-xs flex-shrink-0 border border-teal-200"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate" title={userDisplayName}>
            {userDisplayName}
          </p>
          <p className="text-xs text-gray-500 truncate" title={userEmail}>
            {userEmail}
          </p>
          <span className="inline-block bg-teal-50 text-teal-700 text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1">
            Administrador SST
          </span>
        </div>
      </div>

      {/* Datos del Espacio de Trabajo */}
      <div className="py-3 border-b border-gray-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span className="text-gray-400">Organización:</span>
          <span className="font-semibold text-gray-800 truncate max-w-[150px]" title={displayOrg}>{displayOrg}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSubscriptionModal();
          }}
          className="flex items-center justify-between text-xs text-gray-600 hover:bg-emerald-50/60 p-1.5 rounded-lg transition cursor-pointer text-left"
        >
          <span className="text-gray-400">Plan:</span>
          <span className="font-semibold text-emerald-600 flex items-center gap-1">
            Pro Enterprise <LuArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </span>
        </button>
      </div>

      {/* Opciones de Menú */}
      <div className="py-2 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenAccountModal();
          }}
          className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <LuUserRound className="w-4 h-4 text-gray-500" />
          Mi Cuenta y Credenciales SST
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSettingsModal();
          }}
          className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <LuSettings className="w-4 h-4 text-gray-500" />
          Configuración del Espacio
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenSubscriptionModal();
          }}
          className="w-full text-left px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
        >
          <LuZap className="w-4 h-4 text-teal-600" />
          Mejorar Suscripción / Add-ons
        </button>

        {onOpenTour && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTour();
            }}
            className="w-full text-left px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <LuSparkles className="w-4 h-4 text-teal-600" />
            Ver Tutorial Interactivo
          </button>
        )}
      </div>

      {/* Botón Restablecer Cuenta (Exclusivo cuenta de prueba luis.godoy@safetyclub.cl) */}
      {userEmail.toLowerCase().trim() === "luis.godoy@safetyclub.cl" && onResetTestAccount && (
        <div className="pt-2 border-t border-amber-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onResetTestAccount();
            }}
            className="w-full py-2 px-3 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LuRotateCcw className="w-4 h-4 text-amber-600" />
            Restablecer cuenta de prueba
          </button>
        </div>
      )}

      {/* Botón Cerrar Sesión */}
      <div className="pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="w-full py-2 px-3 text-xs font-semibold text-[#F04438] hover:bg-red-50 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <LuLogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 1: TU CUENTA Y CREDENCIALES SST
   ========================================================================= */
export function AccountModal({
  isOpen,
  onClose,
  userDisplayName,
  userEmail,
  organizationName,
}: {
  isOpen: boolean;
  onClose: () => void;
  userDisplayName: string;
  userEmail: string;
  organizationName?: string;
}) {
  const { preferences, updatePreferences } = useLifeOnPreferences();
  const [name, setName] = useState(userDisplayName || "Sergio A. Jara Astete");
  const [rut, setRut] = useState("15.842.190-K");
  const [seremiCode, setSeremiCode] = useState("REG-SEREMI-45291 (DS 40)");
  const [email, setEmail] = useState(userEmail || "sergio.jara@lifeon.cl");
  const [phone, setPhone] = useState("+56 9 8765 4321");
  const [company, setCompany] = useState(organizationName || "Constructora y Servicios Santiago SpA");
  const [position, setPosition] = useState("Jefe de Prevención de Riesgos y Medio Ambiente");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Foto de perfil y Logo de empresa
  const [profilePhoto, setProfilePhoto] = useState<string | null>(preferences.profilePhoto || null);
  const [orgLogo, setOrgLogo] = useState<string | null>(preferences.organizationLogo || null);

  // Estados de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (userDisplayName) setName(userDisplayName);
    if (userEmail) setEmail(userEmail);
    if (organizationName) setCompany(organizationName);
    setProfilePhoto(preferences.profilePhoto || null);
    setOrgLogo(preferences.organizationLogo || null);
  }, [userDisplayName, userEmail, organizationName, preferences.profilePhoto, preferences.organizationLogo]);

  if (!isOpen) return null;

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      alert("Formato no compatible. Por favor selecciona una imagen JPG, PNG o WEBP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen excede el límite recomendado de 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setProfilePhoto(dataUrl);
      updatePreferences({ profilePhoto: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProfilePhoto = () => {
    setProfilePhoto(null);
    updatePreferences({ profilePhoto: null });
  };

  const handleOrgLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/i)) {
      alert("Formato no compatible. Por favor selecciona un logo PNG, JPG, WEBP o SVG.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("El logo excede el límite de 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setOrgLogo(dataUrl);
      updatePreferences({ organizationLogo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteOrgLogo = () => {
    setOrgLogo(null);
    updatePreferences({ organizationLogo: null });
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Debes ingresar tu contraseña actual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const client = getSupabaseClient();
      if (client && isSupabaseConfigured()) {
        const { error } = await client.auth.updateUser({ password: newPassword });
        if (error) {
          setPasswordError(error.message || "Error al actualizar contraseña en el proveedor de autenticación.");
          setIsChangingPassword(false);
          return;
        }
      } else {
        const isLuis = userEmail.toLowerCase().includes("luis.godoy");
        const expectedCurrent = isLuis ? "luis" : "serg";
        if (currentPassword !== expectedCurrent && currentPassword !== "admin123") {
          setPasswordError("La contraseña actual no es correcta.");
          setIsChangingPassword(false);
          return;
        }
      }

      setPasswordSuccess("Contraseña actualizada exitosamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError("Error al procesar el cambio de contraseña.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      profilePhoto,
      organizationLogo: orgLogo,
      organizationName: company,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const userInitials = name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SJ";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Encabezado con Avatar / Foto */}
        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-100">
          <div className="relative">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt={name}
                className="w-14 h-14 rounded-2xl object-cover border border-teal-200 shadow-xs"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {userInitials}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tu Cuenta y Credenciales SST</h3>
            <p className="text-xs text-gray-500">
              Datos personales, fotografía, logo institucional, credenciales y seguridad.
            </p>
          </div>
        </div>

        {/* Sección: Fotografía de Perfil */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border border-gray-300">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-500">{userInitials}</span>
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Foto de Perfil</h4>
              <p className="text-[11px] text-gray-500">Formatos JPG, PNG, WEBP (máx. 3MB)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer transition flex items-center gap-1.5">
              <LuUpload className="w-3.5 h-3.5" />
              <span>{profilePhoto ? "Cambiar foto" : "Subir foto"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
            </label>
            {profilePhoto && (
              <button
                type="button"
                onClick={handleDeleteProfilePhoto}
                className="p-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                title="Eliminar foto y volver al avatar por defecto"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sección: Logo de la Empresa */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-20 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
              {orgLogo ? (
                <img src={orgLogo} alt="Logo empresa" className="max-w-full max-h-full object-contain" />
              ) : (
                <LuBuilding2 className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-800">Logo de la Empresa</h4>
              <p className="text-[11px] text-gray-500">Visible en la barra lateral (PNG, JPG, WEBP, SVG)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 cursor-pointer transition flex items-center gap-1.5">
              <LuUpload className="w-3.5 h-3.5" />
              <span>{orgLogo ? "Cambiar logo" : "Cargar logo"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleOrgLogoChange}
                className="hidden"
              />
            </label>
            {orgLogo && (
              <button
                type="button"
                onClick={handleDeleteOrgLogo}
                className="p-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                title="Eliminar logo corporativo"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Formulario de Datos Personales */}
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                RUT / Cédula de Identidad
              </label>
              <input
                type="text"
                required
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Registro SEREMI de Salud / SNS (DS 40)
              </label>
              <input
                type="text"
                required
                value={seremiCode}
                onChange={(e) => setSeremiCode(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono bg-teal-50/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Cargo / Especialidad
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">
              Empresa / Razón Social
            </label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Sello de Validación */}
          <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuAward className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Firma y Sello Digital Habilitado</p>
                <p className="text-[11px] text-gray-500">
                  Las matrices IPER y fichas APR emitidas incluirán automáticamente tus credenciales.
                </p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
              Vigente
            </span>
          </div>

          {savedSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <LuCircleCheck className="w-4 h-4 text-emerald-600" />
              <span>Datos personales y credenciales guardados exitosamente.</span>
            </div>
          )}

          {/* Botón Guardar Datos Personales */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
            >
              <LuSave className="w-4 h-4" />
              Guardar Datos de Cuenta
            </button>
          </div>
        </form>

        {/* Sección: Cambiar Contraseña */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <LuKey className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-gray-900">Cambiar Contraseña</h4>
          </div>

          <form onSubmit={handlePasswordChangeSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2">
                {passwordError}
              </p>
            )}

            {passwordSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center gap-1.5">
                <LuCircleCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isChangingPassword ? "Actualizando..." : "Actualizar Contraseña"}
              </button>
            </div>
          </form>
        </div>

        {/* Botón Cerrar Modal */}
        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
/* =========================================================================
   MODAL 2: CONFIGURACIÓN DEL ESPACIO DE TRABAJO
   ========================================================================= */
export function SettingsModal({
  isOpen,
  onClose,
  onOpenOnboarding,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}) {
  const { preferences, updatePreferences } = useLifeOnPreferences();

  // Tab activo dentro del modal de configuración
  const [activeTab, setActiveTab] = useState<"general" | "notifications" | "security">("general");

  // Campos editables del espacio
  const [orgName, setOrgName] = useState(preferences.organizationName || "");
  const [orgSector, setOrgSector] = useState(preferences.organizationSector || "Construcción");
  const [orgSize, setOrgSize] = useState(preferences.organizationSize || "51 a 100 trabajadores");

  // Estados secundarios normativos y notificaciones
  const [reviewPeriod, setReviewPeriod] = useState("semestral");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [aprAlerts, setAprAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [saved, setSaved] = useState(false);

  // Actualizar estado local cuando se abra el modal o cambien las preferencias
  useEffect(() => {
    if (isOpen) {
      setOrgName(preferences.organizationName || "");
      setOrgSector(preferences.organizationSector || "Construcción");
      setOrgSize(preferences.organizationSize || "51 a 100 trabajadores");
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      organizationName: orgName.trim() || preferences.organizationName,
      organizationSector: orgSector,
      organizationSize: orgSize,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const SECTORS_LIST = [
    "Construcción",
    "Minería y Extracción",
    "Servicios e Ingeniería",
    "Manufactura e Industria",
    "Logística y Transporte",
    "Salud y Asistencia",
    "Comercio y Retail",
    "Otro Rubro",
  ];

  const WORKER_RANGES_LIST = [
    "1 a 20 trabajadores",
    "21 a 50 trabajadores",
    "51 a 100 trabajadores",
    "101 a 200 trabajadores",
    "201 a 500 trabajadores",
    "Más de 500 trabajadores",
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LuSettings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Configuración del Espacio</h3>
            <p className="text-xs text-gray-500">
              Administra los datos generales de la organización, notificaciones y criterios normativos.
            </p>
          </div>
        </div>

        {/* Pestañas de Configuración */}
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              activeTab === "general"
                ? "bg-teal-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <LuBuilding2 className="w-3.5 h-3.5" />
            Información del Espacio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              activeTab === "notifications"
                ? "bg-teal-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <LuBell className="w-3.5 h-3.5" />
            Notificaciones
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5",
              activeTab === "security"
                ? "bg-teal-600 text-white shadow-2xs"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <LuShield className="w-3.5 h-3.5" />
            Seguridad & Normativa
          </button>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {/* =========================================================================
              TAB 1: INFORMACIÓN DEL ESPACIO
              ========================================================================= */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              {/* Bloque Informativo: Configuraciones Iniciales del Onboarding (NO MODIFICABLES) */}
              <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-200/80 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                    <LuLock className="w-4 h-4 text-teal-600" />
                    <span>Configuración Inicial de la Organización</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-gray-200/80 text-gray-700 px-2 py-0.5 rounded-full">
                    No modificable
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Las siguientes decisiones fueron establecidas durante el Onboarding general y constituyen la base metodológica de la organización:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. Nivel de conocimientos */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Nivel de Conocimientos
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {preferences.experienceLevel === "expert"
                        ? "Conocimientos avanzados"
                        : preferences.experienceLevel === "intermediate"
                        ? "Básico / Intermedio"
                        : "Sin conocimientos especializados"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Definido en onboarding</span>
                  </div>

                  {/* 2. Enfoque de Gestión de Riesgos */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Enfoque de Gestión
                    </span>
                    <span className="text-xs font-bold text-teal-700">
                      {preferences.riskManagementApproach === "critical_controls"
                        ? "Controles Críticos (ICMM)"
                        : "Gestión de Riesgos IPER (Simple)"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Metodología base</span>
                  </div>

                  {/* 3. Nivel de Acompañamiento */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Nivel de Acompañamiento
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {preferences.guidanceLevel === "high"
                        ? "Guíame paso a paso"
                        : preferences.guidanceLevel === "contextual"
                        ? "Ayuda cuando la necesite"
                        : "Experiencia directa"}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">Asistencia de interfaz</span>
                  </div>
                </div>
              </div>

              {/* Campos Editables de la Organización */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <LuBuilding2 className="w-3.5 h-3.5 text-teal-600" /> Datos de la Empresa
                </span>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Nombre de la Organización o Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Sector Económico / Rubro
                    </label>
                    <select
                      value={orgSector}
                      onChange={(e) => setOrgSector(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white"
                    >
                      {SECTORS_LIST.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Cantidad de Trabajadores
                    </label>
                    <select
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white"
                    >
                      {WORKER_RANGES_LIST.map((rng) => (
                        <option key={rng} value={rng}>
                          {rng}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: NOTIFICACIONES
              ========================================================================= */}
          {activeTab === "notifications" && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <LuBell className="w-4 h-4 text-teal-600" /> Notificaciones Automáticas
              </span>

              <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer pt-1">
                <span>Alertas de vencimiento de matrices y protocolos Minsal por email</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
                <span>Avisar cuando una cuadrilla genere un nuevo APR en terreno</span>
                <input
                  type="checkbox"
                  checked={aprAlerts}
                  onChange={(e) => setAprAlerts(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
                <span>Informe semanal de cumplimiento del Programa Anual SST</span>
                <input
                  type="checkbox"
                  checked={weeklyReport}
                  onChange={(e) => setWeeklyReport(e.target.checked)}
                  className="w-4 h-4 accent-teal-600 rounded"
                />
              </label>
            </div>
          )}

          {/* =========================================================================
              TAB 3: SEGURIDAD & NORMATIVA
              ========================================================================= */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <LuShield className="w-4 h-4 text-teal-600" /> Criterios Normativos DS 44
                </span>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Periodo de Revisión Obligatoria de Matrices
                  </label>
                  <select
                    value={reviewPeriod}
                    onChange={(e) => setReviewPeriod(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white"
                  >
                    <option value="semestral">Semestral (Cada 6 meses - Recomendado DS 44)</option>
                    <option value="anual">Anual (Cada 12 meses)</option>
                    <option value="trimestral">Trimestral (Faenas de Alto Riesgo)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <LuShieldAlert className="w-4 h-4 text-teal-600" /> Seguridad de Acceso
                </span>

                <label className="flex items-center justify-between text-xs text-gray-700 cursor-pointer pt-1">
                  <span>Doble Factor de Autenticación (2FA) para Administradores</span>
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {saved && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <LuCircleCheck className="w-4 h-4 text-emerald-600" />
              <span>Configuración guardada correctamente.</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">
              Preferencias activas de organización
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                <LuSave className="w-4 h-4" />
                Guardar Preferencias
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL 3: GESTIÓN DE SUSCRIPCIÓN Y MEJORAS (UPGRADE)
   ========================================================================= */
export function SubscriptionUpgradeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successUpgrade, setSuccessUpgrade] = useState<string | null>(null);

  if (!isOpen) return null;

  const addons = [
    {
      id: "addon-multi",
      name: "Módulo Multi-Faena & Empresas Ilimitadas",
      desc: "Gestión centralizada de múltiples razones sociales, sedes y proyectos con reportería corporativa.",
      price: "+ 2,5 UF/mes",
      popular: true,
    },
    {
      id: "addon-contratistas",
      name: "Módulo de Gestión de Contratistas (DS 76)",
      desc: "Control automático de documentación laboral, F30-1 y acreditación de trabajadores contratistas.",
      price: "+ 1,4 UF/mes",
      popular: false,
    },
    {
      id: "addon-users",
      name: "Paquete de +100 Usuarios Terreno (App Móvil)",
      desc: "Acceso ilimitado para capataces y cuadrillas con firma digital offline de charlas de 5 minutos.",
      price: "+ 0,8 UF/mes",
      popular: false,
    },
    {
      id: "addon-iot",
      name: "Integración de Sensores IoT & Ruido/Polvo",
      desc: "Conexión en tiempo real con estaciones de monitoreo ambiental y alertas automáticas a Prevención.",
      price: "+ 1,9 UF/mes",
      popular: false,
    },
  ];

  const handleUpgrade = (addonName: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessUpgrade(addonName);
      setTimeout(() => {
        setSuccessUpgrade(null);
        onClose();
      }, 2000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
            <LuCreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">Estado de Suscripción & Mejoras</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Activa
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Administra tu plan contratado y amplía capacidades con módulos avanzados.
            </p>
          </div>
        </div>

        {/* Tarjeta Plan Actual */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 mb-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider">
                Plan Actual Activo
              </span>
              <h4 className="text-xl font-black text-white mt-0.5">LifeOn Pro Enterprise</h4>
              <p className="text-xs text-gray-300 mt-1">
                Facturación Anual • Próxima renovación: <b>01 de enero de 2027</b>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-right">
              <span className="text-[10px] text-gray-300 block">Tarifa Actual</span>
              <span className="text-lg font-black text-teal-300">4,5 UF / mes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/10 text-[11px] text-gray-200">
            <div>✓ Matrices IPER Ilimitadas</div>
            <div>✓ APR con IA 2.0</div>
            <div>✓ 50 Usuarios Terreno</div>
            <div>✓ Soporte Prioritario</div>
          </div>
        </div>

        {/* Sección de Mejoras y Add-ons */}
        <div className="mb-4">
          <h4 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
            <LuZap className="w-4 h-4 text-amber-500" /> Mejorar Plan con Add-ons Adicionales
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            Selecciona un módulo para agregarlo a tu facturación mensual de inmediato:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className={clsx(
                  "p-4 rounded-xl border transition flex flex-col justify-between gap-3",
                  addon.popular
                    ? "bg-teal-50/40 border-teal-300 hover:bg-teal-50"
                    : "bg-gray-50/70 border-gray-200 hover:bg-gray-100/70"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold text-gray-900">{addon.name}</h5>
                    {addon.popular && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">{addon.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                  <span className="text-xs font-bold text-teal-800">{addon.price}</span>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleUpgrade(addon.name)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    {isProcessing ? "Procesando..." : "Contratar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {successUpgrade && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in mb-3">
            <LuCircleCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>
              ¡Excelente! Se ha agregado <b>{successUpgrade}</b> a tu suscripción con éxito.
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs">
          <span className="text-gray-400 text-[11px]">Pagos seguros respaldados por Webpay Oneclick</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function HelpModal({
  isOpen,
  onClose,
  onOpenTour,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenTour?: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LuCircleHelp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Centro de Ayuda y Soporte LifeOn</h3>
            <p className="text-xs text-gray-500">Guías operativas y asistencia técnica para Prevención de Riesgos</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 my-4">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition">
            <h5 className="text-sm font-semibold text-gray-900">📋 Guía de Cumplimiento DS 44 (Gestión de Riesgos)</h5>
            <p className="text-xs text-gray-600 mt-1">
              Aprende a estructurar matrices IPER continuas, jerarquía de controles y asignación de responsables conforme a la normativa chilena.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition">
            <h5 className="text-sm font-semibold text-gray-900">🤖 Uso de APR Virtual con IA</h5>
            <p className="text-xs text-gray-600 mt-1">
              Genera Análisis de Peligros y Riesgos en menos de 1 minuto mediante nuestro motor especializado con prompts guiados.
            </p>
          </div>

          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition">
            <h5 className="text-sm font-semibold text-gray-900">📞 Contacto con Soporte Especialista SST</h5>
            <p className="text-xs text-gray-600 mt-1">
              Atención directa por correo a <b>soporte@lifeon.cl</b> o a través de nuestra mesa de ayuda disponible de lunes a viernes.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-gray-100">
          {onOpenTour ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTour();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LuSparkles className="w-3.5 h-3.5" />
              Iniciar Tutorial Guiado
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilterWorkplaceModal({
  isOpen,
  activeWorkplace,
  setActiveWorkplace,
  workCenters = [],
  onClose,
}: {
  isOpen: boolean;
  activeWorkplace: string;
  setActiveWorkplace: (wp: string) => void;
  workCenters?: OrgWorkCenter[];
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const hasMultiple = workCenters.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LuBuilding2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Centro de Trabajo</h3>
            <p className="text-xs text-gray-500">Selecciona el centro para filtrar la información de la organización</p>
          </div>
        </div>

        {workCenters.length === 0 ? (
          <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl border border-gray-200 my-4 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
              <LuBuilding2 className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-gray-800">Sin Centros de Trabajo</h4>
            <p className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
              Tu organización aún no registra Centros de Trabajo. Puedes crearlos o importarlos desde el módulo de Estructura Organizacional.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 my-4 max-h-72 overflow-y-auto pr-1">
            {hasMultiple && (
              <button
                type="button"
                onClick={() => {
                  setActiveWorkplace("Todos los Centros de Trabajo");
                  onClose();
                }}
                className={clsx(
                  "p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between",
                  activeWorkplace === "Todos los Centros de Trabajo"
                    ? "bg-teal-50/70 border-teal-500 text-teal-900 font-semibold"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-800"
                )}
              >
                <div>
                  <p className="text-xs font-semibold">Todos los Centros de Trabajo</p>
                  <p className="text-[10px] text-gray-500">Vista consolidada de toda la organización</p>
                </div>
                {activeWorkplace === "Todos los Centros de Trabajo" && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">
                    <LuCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            )}

            {workCenters.map((wc) => (
              <button
                key={wc.id}
                type="button"
                onClick={() => {
                  setActiveWorkplace(wc.name);
                  onClose();
                }}
                className={clsx(
                  "p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between",
                  activeWorkplace === wc.name
                    ? "bg-teal-50/70 border-teal-500 text-teal-900 font-semibold"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-800"
                )}
              >
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs font-semibold truncate">{wc.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{wc.address || wc.code || "Sede operativa"}</p>
                </div>
                {activeWorkplace === wc.name && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs flex-shrink-0">
                    <LuCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function GlobalSearchDropdown({
  query,
  onClose,
  onNavigateTab,
}: {
  query: string;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}) {
  const sampleItems = [
    { title: "Matriz IPER - Trabajos en Altura (DS 44)", cat: "Matriz IPER", tab: "iper", icon: LuTable },
    { title: "Matriz IPER - Excavaciones y Entibaciones", cat: "Matriz IPER", tab: "iper", icon: LuTable },
    { title: "Procedimiento de Bloqueo LOTO (PTS-04)", cat: "Documentación", tab: "docs", icon: LuFileText },
    { title: "Programa Anual SST 2026", cat: "Programa SST", tab: "docs", icon: LuFileText },
    { title: "Asistente APR: Generador de Análisis de Riesgo", cat: "APR Virtual IA", tab: "apr", icon: LuAtom },
  ];

  const filtered = sampleItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.cat.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="absolute left-0 right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-80 overflow-y-auto">
      <div className="text-[11px] font-semibold text-gray-400 px-2 py-1 uppercase tracking-wider">
        Resultados para &quot;{query}&quot; ({filtered.length})
      </div>

      <div className="flex flex-col gap-1 mt-1">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 p-4 text-center">
            No se encontraron elementos que coincidan con la búsqueda.
          </p>
        ) : (
          filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onNavigateTab(item.tab);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-100 text-gray-600 group-hover:text-teal-700 flex items-center justify-center flex-shrink-0 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 group-hover:text-teal-900">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-gray-400">{item.cat}</span>
                  </div>
                </div>
                <span className="text-xs text-teal-600 opacity-0 group-hover:opacity-100 transition">
                  Abrir &rarr;
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   MODAL DE CONFIRMACIÓN: RESTABLECER CUENTA DE PRUEBA
   ========================================================================= */
export function ResetAccountConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-red-100 p-6 relative">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
          <LuTriangleAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">¿Restablecer cuenta?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Esta acción eliminará toda la configuración y datos creados en esta cuenta de prueba y la dejará como una cuenta nueva.
        </p>
        <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl mb-6">
          <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
            <LuTriangleAlert className="w-4 h-4 shrink-0 text-red-600" />
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition cursor-pointer"
          >
            Restablecer cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

