import { useState, useCallback } from 'react';
import {
  validateEmail,
  validatePhone,
  validateName,
  validateLastName,
} from '../lib/validators/validateForm';

export type FormFields = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
};

export type FormErrors = {
  [K in keyof FormFields]?: string | null;
};

export default function useFormValidation(form: FormFields) {
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback(() => {
    const newErrors: FormErrors = {};
    if ('name' in form) newErrors.name = validateName(form.name ?? '');
    if ('last_name' in form) newErrors.last_name = validateLastName(form.last_name ?? '');
    if ('email' in form) newErrors.email = validateEmail(form.email ?? '');
    if ('phone' in form) newErrors.phone = validatePhone(form.phone ?? '');
    setErrors(newErrors);
    return newErrors;
  }, [form]);

  return { errors, validate };
};