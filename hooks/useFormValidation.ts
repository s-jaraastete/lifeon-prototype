import { useMemo, useCallback } from 'react';
import {
  validateEmail,
  validatePhone,
  validateName,
  validateLastName,
  validateRut,
  validateRequired,
  validateBusinessField,
} from '../lib/validators/validateForm';

export type FormFields = {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  rut?: string;
  business_name?: string;
  business_line?: string;
  billing_email?: string;
  address?: string;
  region?: string;
  comuna?: string;
};

export type FormErrors = {
  [K in keyof FormFields]?: string | null;
};

export default function useFormValidation(form: FormFields) {
  const errors = useMemo(() => {
    const newErrors: FormErrors = {};
    if ('name' in form) newErrors.name = validateName(form.name ?? '');
    if ('first_name' in form) newErrors.first_name = validateName(form.first_name ?? '');
    if ('last_name' in form) newErrors.last_name = validateLastName(form.last_name ?? '');
    if ('email' in form) newErrors.email = validateEmail(form.email ?? '');
    if ('phone' in form) newErrors.phone = validatePhone(form.phone ?? '');
    if ('rut' in form) newErrors.rut = validateRut(form.rut ?? '');
    if ('business_name' in form) newErrors.business_name = validateBusinessField(form.business_name ?? '');
    if ('business_line' in form) newErrors.business_line = validateBusinessField(form.business_line ?? '');
    if ('billing_email' in form) newErrors.billing_email = validateEmail(form.billing_email ?? '');
    if ('address' in form) newErrors.address = validateBusinessField(form.address ?? '');
    if ('region' in form) newErrors.region = validateRequired(form.region ?? '');
    if ('comuna' in form) newErrors.comuna = validateRequired(form.comuna ?? '');
    return newErrors;
  }, [form]);

  const validate = useCallback(() => {
    return errors;
  }, [errors]);

  return { errors, validate };
};
