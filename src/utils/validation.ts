import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  company_email: z.string().email('Invalid company email address'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  phone: z.string().optional(),
  country: z.string().optional(),
}).refine(
  (data) => data.password === data.password_confirmation,
  {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  }
);

export const changePasswordSchema = z.object({
  current_password: z.string().min(6, 'Password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirmation: z.string(),
}).refine(
  (data) => data.new_password === data.new_password_confirmation,
  {
    message: 'Passwords do not match',
    path: ['new_password_confirmation'],
  }
);
