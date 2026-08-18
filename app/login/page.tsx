"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { LuArrowLeft, LuEye, LuEyeOff } from "react-icons/lu";

const PROFESSION_IMAGES = [
  "/images/login/prof-1.jpg",
  "/images/login/prof-2.jpg",
  "/images/login/prof-3.jpg",
  "/images/login/prof-4.jpg",
];

export default function LoginPage() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PROFESSION_IMAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage("");
    setStep("password");
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validación de credenciales demo
    if (password === "serg") {
      router.push("/dashboard");
    } else {
      setErrorMessage("Contraseña incorrecta. (Demo: serg)");
    }
  };

  const handleSocialLogin = () => {
    router.push("/dashboard");
  };

  return (
    <div className="relative w-full h-screen min-h-screen flex flex-col lg:flex-row overflow-hidden font-[family-name:var(--font-poppins)] select-none bg-gray-900">
      {/* Contenedor de Imágenes de Profesiones: Ubicado en la sección derecha con extensión debajo de las curvas */}
      <div className="absolute top-0 bottom-0 right-0 w-full lg:left-[calc(50%-48px)] lg:w-auto h-full z-0 overflow-hidden bg-gray-900">
        {PROFESSION_IMAGES.map((src, index) => (
          <div
            key={src}
            className={clsx(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === activeIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <Image
              src={src}
              alt={`Profesional LifeOn ${index + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover object-center w-full h-full"
              priority={index === 0}
            />
          </div>
        ))}
      </div>

      {/* Sección Izquierda: 50% exacto con bordes curvos hacia el centro */}
      <div className="relative z-10 w-full lg:w-1/2 h-full bg-white flex flex-col justify-between items-center px-6 sm:px-12 md:px-16 lg:px-20 py-8 sm:py-10 lg:py-12 lg:rounded-r-[44px] shadow-2xl overflow-y-auto">
        <div className="w-full max-w-md my-auto flex flex-col items-center py-4">
          {/* Logo LO */}
          <div className="flex items-center justify-center tracking-tighter mb-5">
            <span className="text-[44px] font-black text-[#F04438] leading-none">L</span>
            <span className="text-[44px] font-black text-[#0D9488] leading-none">O</span>
          </div>

          {/* Encabezado */}
          <h1 className="text-2xl sm:text-[32px] font-bold text-gray-900 tracking-tight leading-snug">
            Hola, bienvenido
          </h1>
          <p className="text-sm text-gray-500 mt-2 mb-8 text-center max-w-xs sm:max-w-sm">
            {step === "email"
              ? "Inicia sesión o regístrate para comenzar a usar LifeOn."
              : "Ingresa tu contraseña para acceder a tu cuenta."}
          </p>

          {step === "email" ? (
            <>
              {/* Botones de Proveedores Sociales */}
              <div className="w-full flex flex-col gap-3.5">
                {/* Botón Google */}
                <button
                  type="button"
                  onClick={handleSocialLogin}
                  className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-3 transition shadow-xs hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continuar con Google</span>
                </button>

                {/* Botón Microsoft */}
                <button
                  type="button"
                  onClick={handleSocialLogin}
                  className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-sm font-medium text-gray-700 flex items-center justify-center gap-3 transition shadow-xs hover:bg-gray-50 cursor-pointer"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 23 23">
                    <path fill="#f35325" d="M1 1h10v10H1z" />
                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                  </svg>
                  <span>Continuar con Microsoft</span>
                </button>
              </div>

              {/* Separador */}
              <div className="relative my-6 flex items-center justify-center w-full">
                <div className="border-t border-gray-200 w-full absolute"></div>
                <span className="bg-white px-3 text-xs text-gray-400 relative font-medium">
                  o
                </span>
              </div>

              {/* Formulario de Email */}
              <form onSubmit={handleEmailSubmit} className="w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Ingresa tu correo electrónico"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
                />

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className={clsx(
                    "w-full mt-4 py-3.5 rounded-xl text-sm font-medium transition duration-200",
                    email.trim()
                      ? "bg-[#D4D4D4] hover:bg-gray-400 text-gray-800 cursor-pointer"
                      : "bg-[#E0E0E0] text-gray-400 cursor-not-allowed"
                  )}
                >
                  Continuar
                </button>
              </form>
            </>
          ) : (
            /* Paso 2: Contraseña */
            <form onSubmit={handlePasswordSubmit} className="w-full">
              {/* Información del correo seleccionado */}
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl mb-4">
                <div className="text-left truncate">
                  <p className="text-[11px] text-gray-400 leading-tight">Accediendo como</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    setErrorMessage("");
                  }}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <LuArrowLeft className="w-3.5 h-3.5" />
                  Cambiar
                </button>
              </div>

              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Ingresa tu contraseña"
                  autoFocus
                  className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? (
                    <LuEyeOff className="w-5 h-5" />
                  ) : (
                    <LuEye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-500 mt-2 text-left">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={!password.trim()}
                className={clsx(
                  "w-full mt-4 py-3.5 rounded-xl text-sm font-medium transition duration-200",
                  password.trim()
                    ? "bg-[#D4D4D4] hover:bg-gray-400 text-gray-800 cursor-pointer"
                    : "bg-[#E0E0E0] text-gray-400 cursor-not-allowed"
                )}
              >
                Continuar
              </button>
            </form>
          )}

          {/* Términos y Privacidad */}
          <p className="mt-8 text-xs text-gray-400 text-center max-w-xs sm:max-w-sm leading-relaxed">
            Al continuar, aceptas los{" "}
            <Link
              href="/terminos-de-uso"
              className="underline text-gray-500 hover:text-gray-700 transition"
            >
              Términos de servicio
            </Link>{" "}
            y la{" "}
            <Link
              href="/politica-de-privacidad"
              className="underline text-gray-500 hover:text-gray-700 transition"
            >
              Política de privacidad
            </Link>{" "}
            de LifeOn.
          </p>
        </div>
      </div>

      {/* Sección Derecha: 50% de ancho (espacio transparente para interactividad) */}
      <div className="hidden lg:block lg:w-1/2 h-full pointer-events-none" />
    </div>
  );
}
