"use client";

import api from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import React, { useState } from "react";

import { LuCalendarDays, LuChevronLeft, LuChevronRight, LuCircleCheck, LuClock3, LuGlobe, LuVideo } from "react-icons/lu";

type Step = "overview" | "datetime" | "contact" | "success";

interface ScheduleFormProps {
  allSlots?: unknown[];
}

interface ScheduleContactData {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface PublicSlot {
  slot_id: number | string;
  time: string;
  available_admins?: number;
}

interface SchedulePayload {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  service_name: string;
  date: string;
  time: string;
}

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [];

  for (let index = 0; index < startingDayOfWeek; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
};

const isSameDay = (firstDate: Date, secondDate: Date) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const formatHolidayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isPastDay = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
};

const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const getDateLabel = (date: Date | null) => {
  if (!date) return "Fecha sin seleccionar";

  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getMeetingTimeRange = (time: string | null) => {
  if (!time) return "Horario por confirmar";

  const [rawHour, rawMinutes] = time.split(":");
  const minutesAndPeriod = rawMinutes.split(" ");
  const minutes = Number(minutesAndPeriod[0]);
  const period = minutesAndPeriod[1];
  let hour = Number(rawHour);

  if (period === "pm" && hour < 12) {
    hour += 12;
  }

  if (period === "am" && hour === 12) {
    hour = 0;
  }

  const startMinutes = hour * 60 + minutes;
  const endMinutes = startMinutes + 30;
  const endHour = Math.floor(endMinutes / 60) % 24;
  const endMinute = endMinutes % 60;

  return `${time} - ${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")} (${"GMT-5"})`;
};

const ScheduleForm = ({ allSlots: _allSlots = [] }: ScheduleFormProps) => {
  const [step, setStep] = useState<Step>("overview");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [contactData, setContactData] = useState<ScheduleContactData>({
    name: "",
    email: "",
    phone: "",
    company: "",
  });
  const queryClient = useQueryClient();

  const isContactFormValid =
    contactData.name.trim() !== "" &&
    contactData.email.trim() !== "" &&
    contactData.phone.trim() !== "";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const normalizedValue = name === "phone" ? value.replace(/[^0-9]/g, "") : value;

    setContactData({ ...contactData, [name]: normalizedValue });
  };

  const year = currentDate.getFullYear();

  const holidaysQuery = useQuery({
    queryKey: ["holidays", year],
    queryFn: async () => {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CL`);

      if (!response.ok) {
        throw new Error("No se pudieron cargar los feriados");
      }

      const data = await response.json();
      return Array.isArray(data) ? data.map((holiday: { date: string }) => holiday.date) : [];
    },
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  const holidays: string[] = holidaysQuery.data ?? [];
  const monthDays = getDaysInMonth(currentDate);
  const selectedDateStr = selectedDate ? formatHolidayKey(selectedDate) : "";

  const publicSlotsQuery = useQuery({
    queryKey: ["public-available-slots", "kliklab", selectedDateStr],
    enabled: Boolean(selectedDateStr),
    queryFn: async () => {
      const response = await api.get("public-available-slots/", {
        params: {
          service_name: "kliklab",
          date: selectedDateStr,
        },
      });

      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (payload: SchedulePayload) => {
      const response = await api.post("new-schedule/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-available-slots"] });
      setScheduleError(null);
      setStep("success");
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
      setScheduleError(
        axiosError.response?.data?.detail ??
        axiosError.response?.data?.message ??
        "No se pudo agendar la cita. Intenta nuevamente."
      );
    },
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDay(date) || isWeekend(date) || holidays.includes(formatHolidayKey(date))) {
      return;
    }

    setSelectedDate(date);
    setSelectedTime(null);
  };

  const parseTimeToDate = (baseDate: Date, time: string) => {
    const [rawHour, rawMinutes] = time.split(":");
    const [minutes, period] = rawMinutes.split(" ");
    let hour = Number(rawHour);

    if (period === "pm" && hour < 12) {
      hour += 12;
    }

    if (period === "am" && hour === 12) {
      hour = 0;
    }

    const result = new Date(baseDate);
    result.setHours(hour, Number(minutes), 0, 0);

    return result;
  };

  const isPastSlot = (time: string) => {
    if (!selectedDate) return false;

    const now = new Date();

    if (!isSameDay(selectedDate, now)) return false;

    return parseTimeToDate(selectedDate, time) <= now;
  };

  const selectedDateLabel = getDateLabel(selectedDate);

  const availableSlots: PublicSlot[] = Array.isArray(publicSlotsQuery.data)
    ? publicSlotsQuery.data
        .filter((slot: PublicSlot) => (slot?.available_admins ?? 0) > 0)
        .map((slot: PublicSlot) => ({
          slot_id: slot.slot_id,
          time: slot.time,
          available_admins: slot.available_admins,
        }))
    : [];

  const meetingDetailLabel = selectedTime
    ? `${selectedDateLabel}, ${selectedTime}.`
    : `${selectedDateLabel}, horario sin asignar.`;

  const meetingTimeRange = getMeetingTimeRange(selectedTime);

  const handleMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isContactFormValid || !selectedTime || !selectedDateStr || scheduleMutation.isPending) {
      return;
    }

    setScheduleError(null);
    scheduleMutation.mutate({
      name: contactData.name,
      email: contactData.email,
      phone: contactData.phone,
      company: contactData.company,
      message: "",
      service_name: "kliklab",
      date: selectedDateStr,
      time: selectedTime,
    });
  };

  return (
    <div className="flex w-full max-w-137.5 mx-auto lg:mx-0 flex-col rounded-2xl bg-white p-6">
      {step === "overview" && (
        <div className="flex min-h-95 flex-col justify-between gap-22">
          <div className="flex flex-col gap-8">
            <h3 className="text-[24px] font-semibold text-base-black">Detalles de la sesión</h3>

            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-3">
                <LuClock3 className="mt-0.5 h-6 w-6 text-primary-text" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[18px] font-medium text-black">Duración</span>
                  <span className="text-[18px] text-primary-text">30 minutos</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LuVideo className="mt-0.5 h-6 w-6 text-primary-text" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[18px] font-medium text-black">Modalidad</span>
                  <span className="text-[18px] text-primary-text">Google Meet (enlace automático)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <LuGlobe className="mt-0.5 h-6 w-6 text-primary-text" strokeWidth={2} />
                <div className="flex flex-col">
                  <span className="text-[18px] font-medium text-black">Zona horaria</span>
                  <span className="text-[18px] text-primary-text">Detectada automáticamente</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <div className="rounded-xl bg-[#F6F6F6] px-4 py-5 text-primary-text">
              Recibirás una invitación de calendario inmediatamente después de agendar tu cita
            </div>

            <button
              type="button"
              onClick={() => setStep("datetime")}
              className="flex h-12.5 w-full items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-[18px] text-white transition-colors cursor-pointer hover:bg-red-700"
            >
              <span>Seleccionar fecha</span>
              <LuChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {step === "datetime" && (
        <div className="flex min-h-95 flex-col justify-between gap-15">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("overview")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition-colors hover:bg-[#F6F6F6]"
              >
                <LuChevronLeft className="h-5 w-5 cursor-pointer" />
              </button>
              <h3 className="text-[18px] font-semibold text-base-black">Seleccionar fecha y hora</h3>
            </div>

            <div className="grid gap-5 md:grid-cols-[1.55fr_1fr] md:items-start">
              <div className="rounded-[10px] border border-gray-400 p-2">
                <div className="mb-4 flex items-center justify-between gap-4 text-[18px] text-black">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F6F6F6]"
                  >
                    <LuChevronLeft className="h-5 w-5 cursor-pointer" />
                  </button>
                  <div className="flex items-center gap-2">
                    <span>{months[currentDate.getMonth()]}</span>
                    <span>{currentDate.getFullYear()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F6F6F6]"
                  >
                    <LuChevronRight className="h-5 w-5 cursor-pointer" />
                  </button>
                </div>

                <div className="mb-4 grid grid-cols-7 gap-y-3 text-center text-[14px] text-[#656565]">
                  {weekDays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center text-base">
                  {monthDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="h-10" />;
                    }

                    const holiday = holidays.includes(formatHolidayKey(date));
                    const disabled = holiday || isPastDay(date) || isWeekend(date);
                    const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDateSelect(date)}
                        title={holiday ? "Feriado" : undefined}
                        className={`mx-auto flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors 
                          ${isSelected
                            ? "bg-navy text-white"
                            : holiday ? "bg-red-50 text-red-500 cursor-not-allowed"
                            : disabled
                              ? "cursor-not-allowed text-[#C9C9C9]"
                              : "text-black hover:bg-[#F4F5FB]"
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[18px] font-semibold text-black">Horarios disponibles:</span>
                {selectedDate ? (
                  <>
                    {publicSlotsQuery.isFetching && (
                      <p className="text-[16px] text-secondary-text">Cargando horarios...</p>
                    )}

                    {publicSlotsQuery.isError && (
                      <p className="text-[16px] text-[#B42318]">No se pudieron cargar los horarios disponibles.</p>
                    )}

                    {!publicSlotsQuery.isFetching && !publicSlotsQuery.isError && availableSlots.length === 0 && (
                      <p className="text-[16px] text-secondary-text">No hay horarios disponibles para este día.</p>
                    )}

                    {!publicSlotsQuery.isFetching && !publicSlotsQuery.isError && availableSlots.map((slot) => {
                      const time = slot.time;
                      const isSelected = selectedTime === time;
                      const disabled = isPastSlot(time);

                      return (
                        <button
                          key={slot.slot_id}
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedTime(time)}
                          className={`flex h-10 items-center justify-center rounded-lg border text-[18px] transition-colors ${
                            isSelected
                              ? "border-navy bg-navy text-white"
                              : disabled
                                ? "cursor-not-allowed border-[#E7E7E7] bg-gray-200 text-[#BDBDBD]"
                                : "border-gray-400 bg-white text-[#3C3C3C] hover:border-navy"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-[16px] text-secondary-text">
                    Selecciona una fecha para ver los horarios.
                  </p>
                )}
              </div>
            </div>

            {holidaysQuery.isError && (
              <p className="text-[14px] text-[#B42318]">
                No se pudieron cargar los feriados. El calendario seguirá funcionando sin ese bloqueo.
              </p>
            )}

            <div className="flex flex-col gap-1 text-black">
              <span className="text-[16px] font-semibold">Detalle de tu cita:</span>
              <span className="text-[16px] text-secondary-text">{meetingDetailLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => selectedTime && setStep("contact")}
            disabled={!selectedTime}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-[14px] px-6 text-[18px] transition-colors ${
              selectedTime
                ? "bg-navy text-white cursor-pointer hover:bg-[#151c5a]"
                : "bg-[#ECECEC] text-[#9A9A9A] cursor-not-allowed"
            }`}
          >
            <span>{selectedTime ? "Siguiente" : "Confirmar reunión"}</span>
            {selectedTime && <LuChevronRight className="h-5 w-5" />}
          </button>
        </div>
      )}

      {step === "contact" && (
        <form onSubmit={handleMeetingSubmit} className="flex min-h-95 h-132 flex-col justify-between gap-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("datetime")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-black transition-colors hover:bg-[#F6F6F6]"
              >
                <LuChevronLeft className="h-5 w-5 cursor-pointer" />
              </button>
              <h3 className="text-[18px] font-semibold text-base-black">Datos de contacto</h3>
            </div>

            <div className="flex flex-col gap-5">
              <input
                type="text"
                name="name"
                value={contactData.name}
                onChange={handleInputChange}
                placeholder="Nombre y apellido"
                className="h-10.5 rounded-[10px] border border-gray-400 px-5 text-[18px] text-[#3C3C3C] outline-none transition-colors placeholder:text-[#B8B8B8] focus:border-navy"
                required
              />
              <input
                type="email"
                name="email"
                value={contactData.email}
                onChange={handleInputChange}
                placeholder="Correo electrónico"
                className="h-10.5 rounded-[10px] border border-gray-400 px-5 text-[18px] text-[#3C3C3C] outline-none transition-colors placeholder:text-[#B8B8B8] focus:border-navy"
                required
              />
              <input
                type="tel"
                name="phone"
                value={contactData.phone}
                onChange={handleInputChange}
                placeholder="Teléfono"
                className="h-10.5 rounded-[10px] border border-gray-400 px-5 text-[18px] text-[#3C3C3C] outline-none transition-colors placeholder:text-[#B8B8B8] focus:border-navy"
                required
              />
              <input
                type="text"
                name="company"
                value={contactData.company}
                onChange={handleInputChange}
                placeholder="Empresa (Opcional)"
                className="h-10.5 rounded-[10px] border border-gray-400 px-5 text-[18px] text-[#3C3C3C] outline-none transition-colors placeholder:text-[#B8B8B8] focus:border-navy"
              />
            </div>

            <div className="flex flex-col gap-1 text-black">
              <span className="text-[16px] font-semibold">Detalle de tu cita:</span>
              <span className="text-[16px] text-[#656565]">{meetingDetailLabel}</span>
            </div>

            {scheduleError && (
              <p className="text-[14px] text-[#B42318]">{scheduleError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isContactFormValid || !selectedTime || scheduleMutation.isPending}
            className={`flex h-12.5 w-full items-center justify-center rounded-full px-6 text-[18px] transition-colors ${
              isContactFormValid && selectedTime && !scheduleMutation.isPending
                ? "bg-navy text-white cursor-pointer hover:bg-[#151c5a]"
                : "bg-[#ECECEC] cursor-not-allowed text-[#9A9A9A]"
            }`}
          >
            {scheduleMutation.isPending ? "Agendando..." : "Agendar reunión"}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="flex min-h-95 flex-col items-center justify-center gap-8 h-130 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#CFF3E7]">
            <LuCircleCheck className="h-8 w-8 text-[#06B37C]" strokeWidth={2} />
          </div>

          <div className="flex max-w-95 flex-col gap-4">
            <h3 className="text-[20px] font-semibold text-base-black">¡Cita agendada con éxito!</h3>
            <p className="text-[18px] text-[#656565]">
              Gracias por contactarte con nosotros, en los próximos minutos recibirás un correo con la confirmación y detalles de tu reunión.
            </p>
          </div>

          <div className="flex w-full max-w-95 items-start gap-4 rounded-xl bg-[#F6F6F6] px-5 py-4 text-left">
            <LuCalendarDays className="mt-1 h-6 w-6 text-text-secondary" />
            <div className="flex flex-col gap-1 text-black">
              <span className="text-base text-[#656565]">Fecha y hora</span>
              <span className="text-base font-semibold">{selectedDateLabel}</span>
              <span className="text-base text-[#3C3C3C]">{meetingTimeRange}</span>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex h-12.5 items-center justify-center gap-2 rounded-xl border border-purlple px-8 text-[18px]  text-purple transition-colors hover:bg-[#FAF2FF]"
          >
            <LuChevronLeft className="h-5 w-5" />
            <span>Volver al inicio</span>
          </a>
        </div>
      )}
    </div>
  );
};

export default ScheduleForm;