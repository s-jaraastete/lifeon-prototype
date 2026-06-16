import Link from "next/link";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="flex flex-col mx-auto w-full h-full">
      <div className="w-full bg-secondary text-white">
        {/* TODO: Verify responsive layout for mobile */}
        <div className="flex flex-col py-[50px] px-[16px] lg:flex lg:py-20 lg:px-10 h-full mx-auto max-w-[1300px]">
          <div className="text-center lg:text-left grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-6 pb-10 w-full border-b border-teal-400">
            <div className="flex flex-col items-center lg:items-start space-y-7 mb-6 lg:mb-0">
              <Link href="/">
                <h3 className="text-[40px] font-semibold">Life
                  <span className="font-extrabold">On</span>
                </h3>
              </Link>
              <div className="flex items-center space-x-2.5">
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de LifeOn"
                >
                  <FaInstagram size={22} />
                </Link>
                <Link
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn de LifeOn"
                >
                  <FaLinkedin size={22} />
                </Link>
                <Link
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube de LifeOn"
                >
                  <FaYoutube size={28} />
                </Link>
              </div>
            </div>

            <div className="mb lg:col-span-2">
              <h6 className="font-semibold text-[18px] mb-3">Módulos</h6>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5">
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/">MIPER</Link>
                  </li>
                  <li>
                    <Link href="/">Investigación de Accidentes</Link>
                  </li>
                  <li>
                    <Link href="/">Process Safety</Link>
                  </li>
                  <li>
                    <Link href="/">Auditorías</Link>
                  </li>
                  <li>
                    <Link href="/">Verificación de Controles Críticos</Link>
                  </li>
                </ul>
                <ul className="space-y-2.5">
                  <li>
                    <Link href="/">Asset Integrity e Inspecciones Estructurales</Link>
                  </li>
                  <li>
                    <Link href="/">Gestión del Cambio</Link>
                  </li>
                  <li>
                    <Link href="/">Búsqueda documental</Link>
                  </li>
                  <li>
                    <Link href="/">Formaciones</Link>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h6 className="font-semibold text-xl mb-3">Soporte</h6>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/">Centro de ayuda</Link>
                </li>
                <li>
                  <Link href="/">Contacto</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col-reverse items-center text-center lg:flex-row lg:justify-between lg:items-center lg:text-left pt-10 space-y-4 lg:space-y-0">
            <p className="text-[15px] lg:text-[16px]">
              © 2026 LifeOn, un producto de Technologies by SafetyCo. Todos los
              derechos reservados.
            </p>
            <ul className="flex flex-col mb-[50px] lg:mb-0 lg:flex-row space-y-2 lg:space-y-0 lg:space-x-5.5 text-[14px] ">
              <li>
                <Link href="/">Términos de uso</Link>
              </li>
              <li>
                <Link href="/">Política de Privacidad</Link>
              </li>
              <li>
                <Link href="/">Cookies</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;