"use client";

import Link from "next/link";
import Image from "next/image";
import { LuChevronDown, LuShoppingCart, LuUserRound } from "react-icons/lu";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ShoppingCart from "./ShoppingCart";

const Header = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const pathname = usePathname();

  type NavLink = {
    name: string;
    href?: string;
    modal?: string;
  };

  const mainLinks: NavLink[] = [
    { name: "Software", href: "/" },
    { name: "Módulos", modal: "modules" },
    { name: "Recursos", href: "/", modal: "resources" },
    { name: "Contacto", href: "/contacto" },
  ];

  const toggleModal = (type: string) => {
    setActiveModal(activeModal === type ? null : type);
  };

  return (
    <>
      <div className="sticky top-0 w-full z-999 flex flex-col">
        <header className="hidden lg:block w-full border-b border-gray-400 left-0 z-100 top-0 ">
          <div className="bg-white">
            <div className="max-w-360 mx-auto py-4 flex justify-between items-center">
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

              <div className="flex items-center gap-6">
                <ul className="hidden md:flex gap-10 text-primary-text">
                  {mainLinks.map((link) => {
                    let isActive = false;

                    if (
                      link.name === "Software" &&
                      (pathname === "/inicio" || pathname === "/")
                    ) {
                      isActive = true;
                    } else if (
                      link.name === "Innovaciones" &&
                      pathname.startsWith("/innovaciones")
                    ) {
                      isActive = true;
                    } else if (
                      link.name === "Recursos" &&
                      (pathname.startsWith("/blog") ||
                        pathname.startsWith("/novedades"))
                    ) {
                      isActive = true;
                    } else if (
                      link.name === "Nuestro modelo" &&
                      pathname === "/nuestro-modelo"
                    ) {
                      isActive = true;
                    } else if (
                      link.name === "Ecosistema" &&
                      pathname.startsWith("/ecosistema")
                    ) {
                      isActive = true;
                    } else if (
                      link.name === "Empresa" &&
                      (pathname === "/quienes-somos" ||
                        pathname === "/modelo-cultural")
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
              </div>
              <div className="flex items-center gap-8">
                <ShoppingCart />
                <div className="flex items-center gap-3">
                  <button className="font-medium bg-primary px-4 py-1 rounded-xl text-white hover:bg-red-600 transition duration-200 cursor-pointer">
                    Pruébalo gratis
                  </button>
                  <button className="font-medium bg-white border border-primary px-4 py-1 rounded-xl text-primary hover:bg-gray-200 transition duration-200 cursor-pointer">
                    <LuUserRound className="w-5 h-5 inline-block mr-1" />
                    Acceder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>
      <div className="relative z-990">
        {/* <CompanieModal
          open={activeModal === "company"}
          onClose={() => setActiveModal(null)}
          isHome={isHome}
        /> */}
      </div>
    </>
  );
}

export default Header;