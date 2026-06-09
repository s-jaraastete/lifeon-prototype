export function validateEmail(email: string): string | null {
  if (!email) return 'El correo es obligatorio.';
  const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return 'El formato del correo es incorrecto.';
  return null;
};

export function validatePhone(phone: string): string | null {
  if (!phone) return 'El teléfono es obligatorio.';
  const phoneRegex = /^\+\d{7,30}$/;
  if (!phoneRegex.test(phone)) return 'El teléfono debe iniciar con + y el código de país Ej: +56995695987).';
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length > 15) return 'El teléfono tiene demasiados números (máximo 15 dígitos).';
  return null;
};

export function validateName(firstName: string): string | null {
  if (!firstName) return 'El nombre es obligatorio.';
  const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
  if (!nameRegex.test(firstName)) return 'El nombre sólo puede contener letras.';
  return null;
};

export function validateLastName(lastName: string): string | null {
  if (!lastName) return 'El apellido es obligatorio.';
  const lastNameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/;
  if (!lastNameRegex.test(lastName)) return 'El apellido sólo puede contener letras.';
  return null;
};