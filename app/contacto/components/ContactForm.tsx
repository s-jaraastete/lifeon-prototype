"use client";

import { useState } from "react";
import Link from "next/link";
import TextInput from "../../components/ui/TextInput";
import TextArea from "../../components/ui/TextArea";

const ContactForm = () => {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [mensaje, setMensaje] = useState("");

  const isDisabled = !nombre || !apellidos || !email || !telefono || !empresa || !mensaje;

  return (
    <form className="bg-white p-7.5 rounded-[14px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TextInput
          label="Nombre"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <TextInput
          label="Apellidos"
          placeholder="Tus apellidos"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-4 mb-4">
        <div className="md:col-span-6">
          <TextInput
            label="Correo electrónico"
            placeholder="Tu correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <TextInput
            label="Teléfono"
            placeholder="+56"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
      </div>
      <div className="mb-4">
        <TextInput
          label="Empresa"
          placeholder="Nombre de tu empresa"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
        />
      </div>
      <div className="mb-6">
        <TextArea
          label="Tu mensaje"
          placeholder="Escribe aquí como podemos ayudarte..."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
      </div>
      <button
        disabled={isDisabled}
        type="submit"
        className={`
          w-full font-medium px-6 py-3 rounded-[14px] transition duration-200
          ${isDisabled
            ? "text-secondary-text bg-gray-300"
            : "text-white bg-primary hover:bg-red-600 cursor-pointer"
          }
        `}
      >
        Enviar mensaje
      </button>
      <p className="mt-7.5 text-[12px] text-primary-text text-center">
        Al enviar tu información, autorizas a LifeOn a procesar tus datos
        personales para fines comerciales y de contacto relacionados con
        nuestros productos y servicios, conforme a nuestra{" "}
        <Link href="/" className="underline">
          Política de Privacidad
        </Link>
        .
      </p>
    </form>
  );
};

export default ContactForm;
