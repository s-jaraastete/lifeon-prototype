"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

// import ShoppingCart from "../shopping/ShoppingCart";
import ModulesModal from "./ModulesModal";
import MobileMenu from "./MobileMenu";

// Icons
import {
  LuChevronDown,
  LuLogOut,
  LuMenu,
  LuUserRound,
  LuX,
} from "react-icons/lu";


const Header = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isHome = pathname === "/";

  type NavLink = {
    name: string;
    href?: string;
    modal?: string;
  };

  const mainLinks: NavLink[] = [
    { name: "Software", href: "/" },
    { name: "Módulos", modal: "modules" },
    { name: "Precios", href: "/precios" },
    { name: "Contacto", href: "/contacto" },
  ];

  const toggleModal = (type: string) => {
    setActiveModal(activeModal === type ? null : type);
  };

  const handleLogin = () => {
    const authFrontendUrl =
      process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL ??
      "http://localhost:3002";

    const loginUrl = new URL("/login", authFrontendUrl);

    loginUrl.searchParams.set(
      "callbackUrl",
      `${window.location.origin}/post-login`
    );

    window.location.assign(loginUrl.toString());
  };

  const handleAccountAccess = () => {
    window.location.assign("/post-login");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.assign("/");
  };

  const userDisplayName =
    session?.user?.name ||
    session?.user?.username ||
    session?.user?.email ||
    "Mi cuenta";

  const renderAuthControls = (compact = false) => {
    if (status === "authenticated") {
      return (
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleAccountAccess}
            title={userDisplayName}
            className={`
              flex items-center gap-2 font-medium py-1 text-sm
              text-black hover:text-primary-text transition duration-200 cursor-pointer
              ${compact ? "px-3" : "px-4"}
            `}
          >
            <span className={compact ? "max-w-30 truncate" : "max-w-50 truncate"}>
              {userDisplayName}
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-xl text-primary hover:bg-gray-100 transition duration-200 cursor-pointer hover:text-red-600"
          >
            <LuLogOut className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleLogin}
        disabled={status === "loading"}
        className="
          font-medium bg-primary px-4 py-1 rounded-xl text-white
          enabled:hover:bg-red-600 enabled:cursor-pointer
          disabled:opacity-60 disabled:cursor-wait
          transition duration-200
        "
      >
        <LuUserRound className="w-5 h-5 inline-block mr-1 mb-1" />
        {status === "loading" ? "Cargando..." : "Iniciar sesión"}
      </button>
    );
  };

  // TODO: Borrar comentarios
  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 w-full z-999 bg-white">
        <div
          className={`
            flex justify-between items-center px-4 py-2.5 h-16
            ${!isMenuOpen ? "border-b border-gray-400" : ""}
          `}>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              {pathname !== "/basket" && pathname !== "/checkout" && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  className="cursor-pointer"
                >
                  {isMenuOpen ? (
                    <LuX className="w-7 h-7 text-secondary" />
                  ) : (
                    <LuMenu className="w-7 h-7 text-secondary" />
                  )}
                </button>
              )}
              <Link href="/">
                <p className="text-3xl font-semibold text-primary">
                  Life
                  <span className="text-secondary font-extrabold">On</span>
                </p>
              </Link>
            </div>

            <div>{renderAuthControls(true)}</div>
          </div>
          {/* {pathname !== "/basket" && pathname !== "/checkout" && (
            <div className="">
              <ShoppingCart />
            </div>
          )} */}
        </div>
      </header>
      {/* Desktop header */}
      <header className="hidden lg:block sticky top-0 w-full z-999 bg-white border-b border-gray-400">
        <div className="px-4 xl:px-0">
          <div className="max-w-325 mx-auto py-4 flex justify-between items-center">
            {pathname === "/basket" || pathname.startsWith("/checkout") ? (
              <Link href="/" className="flex items-center py-1">
                {/* <Image
                    src="/"
                    alt="LifeOn"
                    width={120}
                    height={40}
                    className="w-30 h-10"
                  /> */}
                <p className="text-3xl font-semibold text-primary">Life<span className="text-secondary font-extrabold">On</span></p>
              </Link>
            ):(
              <>
                <Link href="/" className="flex items-center">
                  {/* <Image
                    src="/"
                    alt="LifeOn"
                    width={120}
                    height={40}
                    className="w-30 h-10"
                  /> */}
                  <p className="text-3xl font-semibold text-primary">Life<span className="text-secondary font-extrabold">On</span></p>
                </Link>

                <nav aria-label="Main" className="flex items-center gap-6">
                  <ul className="hidden md:flex gap-10 text-primary-text">
                    {mainLinks.map((link) => {
                      let isActive = false;

                      if (
                        link.name === "Software" &&
                        (pathname === "/")
                      ) {
                        isActive = true;
                      } else if (
                        link.name === "Módulos" &&
                        pathname.startsWith("/modulos")
                      ) {
                        isActive = true;
                      } else if (
                        link.name === "Precios" &&
                        pathname === "/precios"
                      ) {
                        isActive = true;
                      } else if (
                        link.name === "Contacto" &&
                        pathname === "/contacto"
                      ) {
                        isActive = true;
                      } 
                      return (
                        <li
                          key={link.name}
                          className={`transition-colors hover:text-primary ${
                            isActive ? "text-primary font-semibold" : ""
                          }`}
                        >
                          {link.modal && link.href ? (
                            <button
                              onClick={() => toggleModal(link.modal!)}
                              className="cursor-pointer flex items-center gap-1"
                            >
                              {link.name}
                              <LuChevronDown className="w-4 h-4" />
                            </button>
                          ) : link.modal ? (
                            <button
                              onClick={() => toggleModal(link.modal!)}
                              className="cursor-pointer flex items-center gap-1"
                            >
                              {link.name}
                              <LuChevronDown className="w-4 h-4" />
                            </button>
                          ) : (
                            <a href={link.href}>{link.name}</a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="flex items-center gap-8">
                  {/* <ShoppingCart /> */}

                  <div className="flex items-center gap-3">
                    {renderAuthControls()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <div className="relative z-990">
        <MobileMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
        <ModulesModal
          open={activeModal === "modules"}
          onClose={() => setActiveModal(null)}
          isHome={isHome}
        />
      </div>
    </>
  );
}

export default Header;
