"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

// import ShoppingCart from "../shopping/ShoppingCart";
import ModulesModal from "./ModulesModal";
import MobileMenu from "./MobileMenu";
import UserMenu from "@/app/components/ui/UserMenu";

// Icons
import {
  LuChevronDown,
  LuMenu,
  LuUserRound,
  LuX,
} from "react-icons/lu";


const Header = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
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
    router.push("/login");
  };

  const renderAuthControls = () => {
    if (status === "authenticated") {
      return <UserMenu />;
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

            <div>{renderAuthControls()}</div>
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
            ) : (
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
                          className={`transition-colors hover:text-primary ${isActive ? "text-primary font-semibold" : ""
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
