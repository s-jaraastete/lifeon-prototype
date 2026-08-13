import api from '@/lib/axios';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import React, { useState } from 'react'


interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
};

interface ContactPayload extends ContactFormData {
  service_name: string;
};

const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const contactMutation = useMutation({
    mutationFn: async (payload: ContactPayload) => {
      const response = await api.post("new-contact/", payload);
      return response.data;
    },
    onSuccess: () => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        message: "",
      });
      setShowSuccess(true);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || contactMutation.isPending) return;

    contactMutation.reset();
    contactMutation.mutate({
      ...formData,
      service_name: "kliklab",
    });
  };

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.message.trim() !== "";
  
  const SuccesModal = () => {
    return (
      <div 
        className="flex flex-col items-center justify-center w-full h-142.5 bg-white p-8 rounded-2xl border border-gray-200 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#dcfce7] mb-6">
          <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" fill="#d1fae5"/><path d="M8 12l2.5 2.5L16 9"/></svg>
        </div>
        <h2 className="text-lg font-bold mb-2">¡Mensaje enviado con éxito!</h2>
        <p className="text-gray-600 text-sm mb-8">
          Gracias por contactarte con nosotros, nuestro equipo se <br/> contactará contigo dentro de 24 horas en horario hábil.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 px-8 py-3 border-2 border-[#9900FF] text-[#9900FF] rounded-full font-medium hover:bg-[#9900FF]/5 transition-colors">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          Volver al inicio
        </Link>
      </div>
    )
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-137.5 rounded-2xl min-h-95">
      {showSuccess ? (
        <SuccesModal />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full gap-4 bg-white p-6 rounded-2xl border border-gray-200"
        >
          <label className="mb-1 text-lg font-semibold">Envíanos tu mensaje</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Nombre y apellido"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base ring-1 ring-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Correo electrónico"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base ring-1 ring-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base ring-1 ring-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
          />
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Empresa (Opcional)"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base ring-1 ring-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
          />
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={3}
            placeholder="Escribe tu mensaje..."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base ring-1 ring-gray-300 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-2"
          />
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full rounded-[14px] py-3 text-lg font-medium mt-2 transition-colors duration-200 cursor-pointer ${
              isFormValid
                ? 'bg-primary text-white hover:bg-primary-pressed'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Enviar mensaje
          </button>
        </form>
      )}
    </div>
  );
};

export default ContactForm;