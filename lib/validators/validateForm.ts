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

export function validateRut(rut: string): string | null {
  if (!rut) return 'El RUT es obligatorio.';

  const clean = rut.replace(/\./g, '').toUpperCase();
  if (!/^\d{7,8}-[\dK]$/.test(clean)) return 'El formato del RUT no es válido (ej: 76.123.456-7).';

  const [body, dv] = clean.split('-');
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedDv = 11 - (sum % 11);
  const computedDv =
    expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : String(expectedDv);

  if (dv !== computedDv) return 'El RUT ingresado no es válido.';
  return null;
};

export function validateRequired(value: string): string | null {
  if (!value.trim()) return 'Este campo es obligatorio.';
  return null;
};

export function validateBusinessField(value: string): string | null {
  if (!value.trim()) return 'Este campo es obligatorio.';
  const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,;:()\-/&@#ºª]+$/;
  if (!regex.test(value)) return 'Este campo contiene caracteres no válidos.';
  return null;
};