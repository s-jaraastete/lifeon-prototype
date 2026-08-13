"use client";

import { useState } from "react";
import Link from "next/link";
import TextInput from "../../components/ui/TextInput";
import Select from "../../components/ui/Select";

const DemoForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [modules, setModules] = useState("");

  const isDisabled = !firstName || !lastName || !email || !phone || !company || !modules;

  return (
    <form className="bg-white p-7.5 rounded-[14px]">
      <h2 className="text-2xl font-bold mb-4">Completa tus datos</h2>
      <div className="mb-4">
        <TextInput
          id="firstName"
          label="Nombre"
          placeholder="Tu nombre"
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <TextInput
          id="lastName"
          label="Apellidos"
          placeholder="Tus apellidos"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <TextInput
          id="email"
          label="Correo electrónico"
          placeholder="Tu correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextInput
          id="phone"
          label="Teléfono"
          placeholder="+56"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <TextInput
          id="company"
          label="Empresa"
          placeholder="Nombre de tu empresa"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>
      <div className="mb-6">
        <Select
          id="modules"
          label="Módulos de interés"
          placeholder="Selecciona una o más opciones"
          value={modules}
          onValueChange={setModules}
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
            : "text-white bg-primary hover:bg-primary-hover cursor-pointer"
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
