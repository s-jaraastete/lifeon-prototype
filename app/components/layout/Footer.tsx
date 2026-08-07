"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const Footer = () => {
  const pathname = usePathname();
  const compact = pathname.startsWith("/basket") || pathname.startsWith("/checkout");

  return (
    <footer className="flex flex-col mx-auto w-full h-full">
      <div className="w-full bg-secondary text-white px-6.5">
        <div className="flex flex-col py-20 lg:flex h-full mx-auto max-w-325">
          <div
            className={`
              lg:text-left flex flex-col lg:flex-row justify-between gap-6
              text-center pb-10 w-full border-b border-teal-400
            `}
          >
            <div className="flex flex-col items-center lg:items-start space-y-7 mb-7.5">
              <Link
                href="/"
                className="mb-3.5 lg:mb-7.5 transition-colors duration-200 hover:text-gray-400"
              >
                <h3 className="text-[40px] font-semibold">
                  Life
                  <span className="font-extrabold">On</span>
                </h3>
              </Link>
              <div
                className={`
                flex items-center space-x-2.5
                ${compact ? "justify-center w-full" : "justify-start"}
              `}
              >
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de LifeOn"
                  className="transition-colors duration-200 hover:text-gray-400"
                >
                  <FaInstagram size={22} />
                </Link>
                <Link
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn de LifeOn"
                  className="transition-colors duration-200 hover:text-gray-400"
                >
                  <FaLinkedin size={22} />
                </Link>
                <Link
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube de LifeOn"
                  className="transition-colors duration-200 hover:text-gray-400"
                >
                  <FaYoutube size={28} />
                </Link>
              </div>
            </div>

            {!compact && (
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-25">
                <div className="mb-0 text-center lg:text-left">
                  <h6 className="font-semibold text-[18px] mb-3">Módulos</h6>
                  <ul className="space-y-2.5">
                    <li>
                      <Link href="/" className="transition-colors duration-200 hover:text-gray-400">MIPER</Link>
                    </li>
                    <li>
                      <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Programa y Documentación Preventiva</Link>
                    </li>
                    <li>
                      <Link href="/" className="transition-colors duration-200 hover:text-gray-400">APR Virtual</Link>
                    </li>
                  </ul>
                </div>

                <div className="mb-0 text-center lg:text-left">
                  <h6 className="font-semibold text-[18px] mb-3">Soporte</h6>
                  <ul className="space-y-2.5">
                    <li>
                      <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Centro de ayuda</Link>
                    </li>
                    <li>
                      <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Contacto</Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center text-center lg:flex-row lg:justify-between lg:items-center lg:text-left pt-10 space-y-4 lg:space-y-0">
            <p className="text-[15px] lg:text-[16px]">
              © 2026 LifeOn, un producto de Technologies by SafetyCo. Todos los
              derechos reservados.
            </p>
            <ul className="flex gap-5.5 space-y-2 lg:space-y-0 lg:space-x-5.5 text-[14px] ">
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Términos de uso</Link>
              </li>
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Política de Privacidad</Link>
              </li>
              <li>
                <Link href="/" className="transition-colors duration-200 hover:text-gray-400">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
