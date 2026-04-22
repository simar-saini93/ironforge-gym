import { z } from 'zod';

// ── Step 1 — Personal Info ───────────────────────────────────
export const memberStep1Schema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'Max 50 characters'),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Max 50 characters'),

  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),

  phone: z
    .string()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[+\d\s\-()]+$/, 'Invalid phone number'),

  dob: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now  = new Date();
      return date < now;
    }, 'Date of birth must be in the past'),

  gender: z
    .enum(['male', 'female', 'other', ''])
    .optional(),

  address: z
    .string()
    .max(300, 'Max 300 characters')
    .optional(),

  emergency_name: z
    .string()
    .max(100, 'Max 100 characters')
    .optional(),

  emergency_phone: z
    .string()
    .max(20, 'Max 20 characters')
    .regex(/^[+\d\s\-()]*$/, 'Invalid phone number')
    .optional(),
});

// ── Step 2 — Plan & Payment ──────────────────────────────────
export const memberStep2Schema = z.object({
  plan_id: z
    .string()
    .uuid('Please select a valid plan')
    .min(1, 'Please select a plan'),

  start_date: z
    .string()
    .min(1, 'Start date is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),

  amount_paid: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, 'Must be a valid amount'),

  payment_method: z
    .enum(['cash', 'card', 'bank_transfer', 'other'], {
      errorMap: () => ({ message: 'Please select a payment method' }),
    }),

  reference_no: z
    .string()
    .max(100, 'Max 100 characters')
    .optional(),

  notes: z
    .string()
    .max(500, 'Max 500 characters')
    .optional(),
});

// ── Full member schema (both steps combined) ─────────────────
export const createMemberSchema = memberStep1Schema.merge(memberStep2Schema);

// ── Invite API route schema ──────────────────────────────────
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .toLowerCase(),
  firstName: z
    .string()
    .max(50)
    .optional(),
});

// ── Edit member schema (email not editable) ──────────────────
export const editMemberSchema = memberStep1Schema.omit({ email: true }).extend({
  email: z.string().email().optional(), // read-only, not validated
});

// ── Helper — parse zod errors into flat { field: message } ───
export function flattenZodErrors(result) {
  if (result.success) return {};
  return Object.fromEntries(
    Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
  );
}
