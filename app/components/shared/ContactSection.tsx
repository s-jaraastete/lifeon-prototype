"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ContactForm from "./contact/ContactForm";
import ScheduleForm from "./contact/ScheduleForm";

// Icons
import Instagram from "@/public/svg/Instagram";
import Linkedin from "@/public/svg/Linkedin";


interface ContactSectionProps {
  allSlots?: unknown[];
  title?: string;
  description?: string;
  padding?: boolean;
}

const ContactSection = ({ allSlots = [], title, description, padding = true }: ContactSectionProps) => {
  const [contact, setContact] = useState(false)
  const [schedule, setShedule] = useState(true)

  return (
    <section
      id="contacto"
      className="w-full flex flex-col justify-center items-center gap-2.5 min-h-162.5 px-4 xl:px-0 pb-25"
    >
      <div
        className={`w-full max-w-325 min-h-162.5 flex flex-col items-start gradient-deg1 gap-15 rounded-3xl bg-gray-200 lg:flex-row ${padding ? "px-5 py-7.5 lg:p-10" : "0"}`}
      >
        <div className="flex flex-col items-start justify-between flex-1 gap-10 lg:min-h-142.5">
          <div className="flex flex-col items-start gap-10 w-full lg:max-w-140">
            <div className="flex flex-col items-start gap-2.5">
              <h2 className="text-[30px] lg:text-5xl font-semibold max-w-137.5 leading-tight lg:leading-12 text-base-black">
                {title}
              </h2>
              <p className="lg:text-lg text-primary-text">{description}</p>
            </div>

            <div className="flex flex-col items-start gap-2.5">
              {contact === false ? (
                <button
                  className="lg:text-lg text-black cursor-pointer underline text-center"
                  onClick={() => {
                    (setContact(true), setShedule(false));
                  }}
                >
                  ¿Prefieres escribirnos? Envíanos un mensaje
                </button>
              ) : (
                <button
                  className="lg:text-lg text-black cursor-pointer underline text-center"
                  onClick={() => {
                    (setContact(false), setShedule(true));
                  }}
                >
                  ¿Prefieres una cita? Agenda una reunión
                </button>
              )}
            </div>
          </div>

          <div className="hidden lg:flex flex-row items-center gap-2 h-5">
            <Link
              href="https://www.instagram.com/safetyco.cl/"
              target="_blank"
              className="flex items-center"
            >
              <Instagram width="32" height="22" />
            </Link>
            <Link
              href="https://cl.linkedin.com/company/safety-co"
              target="_blank"
              className="flex items-center pt-0.5"
            >
              <Linkedin width="32" height="24" />
            </Link>
            <Link
              href="https://www.youtube.com/@SafetyCo_Chile"
              target="_blank"
              className="flex items-center"
            >
              <Image
                src={`/svg/youtube-logo.svg`}
                alt={"logo youtrube"}
                width={32}
                height={22}
              />
            </Link>
          </div>
        </div>

        {contact === true ? (
          <ContactForm />
        ) : (
          <ScheduleForm allSlots={allSlots} />
        )}
      </div>
    </section>
  );
};

export default ContactSection;