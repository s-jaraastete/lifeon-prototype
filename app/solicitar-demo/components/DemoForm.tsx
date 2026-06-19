"use client";

import { useState } from "react";
import Link from "next/link";
import TextInput from "../../components/ui/TextInput";
import Select from "../../components/ui/Select";

const DemoForm = () => {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [modulos, setModulos] = useState("");

  const isDisabled = !nombre || !apellidos || !email || !telefono || !empresa || !modulos;

  return (
    <form className="bg-white p-7.5 rounded-[14px]">
      <h2 className="text-2xl font-bold mb-4">Completa tus datos</h2>
      <div className="mb-4">
        <TextInput
          label="Nombre"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <TextInput
          label="Apellidos"
          placeholder="Tus apellidos"
          value={apellidos}
          onChange={(e) => setApellidos(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TextInput
          label="Correo electrónico"
          placeholder="Tu correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          label="Teléfono"
          placeholder="+56"
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
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
        <label className="block text-lg font-medium mb-2">Módulos de interés</label>
        <Select
          placeholder="Selecciona una o más opciones"
          value={modulos}
          onValueChange={setModulos}
        >
          <option value="modulo1">Módulo 1</option>
          <option value="modulo2">Módulo 2</option>
        </Select>
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
        Solicitar
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

export default DemoForm;
