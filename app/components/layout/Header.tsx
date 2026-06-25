"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import ShoppingCart from "../shopping/ShoppingCart";
import { CartItem, useCart } from "@/providers/CartProvider";

// Icons
import { LuChevronDown, LuTrash2, LuUserRound } from "react-icons/lu";
import ModulesModal from "./ModulesModal";


const Header = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { addItem, clearCart, hasItem } = useCart();

  const mockCartItem: CartItem = {
    id: "mock-module-basepack",
    name: "Paquete Base Esencial",
    description: "Mock para probar persistencia y badge del carrito",
    price: 99.99,
  };

  type NavLink = {
    name: string;
    href?: string;
    modal?: string;
  };

  const mainLinks: NavLink[] = [
    { name: "Software", href: "/" },
    { name: "Módulos", modal: "modules" },
    { name: "Recursos", modal: "resources" },
    { name: "Contacto", href: "/contacto" },
  ];

  const toggleModal = (type: string) => {
    setActiveModal(activeModal === type ? null : type);
  };

  const handleAddMockItem = () => {
    addItem(mockCartItem);
  };

  return (
    <>
      <div className="sticky top-0 w-full z-999 flex flex-col">
        <header className="hidden lg:block w-full border-b border-gray-400 left-0 z-100 top-0 ">
          <div className="bg-white">
            <div className="max-w-325 mx-auto py-4 flex justify-between items-center">
              {pathname === "/basket" || pathname === "/checkout" ? (
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
                          link.name === "Recursos" &&
                          (pathname === "/recursos")
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
                    <ShoppingCart />
                    {/* TESTING CART BUTTONS */}
                    <button
                      type="button"
                      onClick={handleAddMockItem}
                      className="font-medium border border-secondary px-4 py-1 rounded-xl text-secondary hover:bg-teal-50 transition duration-200 cursor-pointer"
                    >
                      {hasItem(mockCartItem.id) ? "Mock agregado" : "Agregar mock"}
                    </button>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="font-medium text-sm text-primary-text hover:text-primary transition duration-200 cursor-pointer"
                    >
                      <LuTrash2 className="w-5 h-5" />
                    </button>
                    {/* END TESTING CART BUTTONS */}
                    <div className="flex items-center gap-3">
                      {/* <button className="font-medium bg-primary px-4 py-1 rounded-xl text-white hover:bg-red-600 transition duration-200 cursor-pointer">
                        Pruébalo gratis
                      </button> */}
                      <button className="font-medium bg-primary px-4 py-1 rounded-xl text-white hover:bg-red-600 transition duration-200 cursor-pointer">
                        <LuUserRound className="w-5 h-5 inline-block mr-1" />
                        Acceder
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      {/* Modals */}
      <div className="relative z-990">
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