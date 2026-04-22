import { z } from 'zod';

// ── Helper ───────────────────────────────────────────────────
export function flattenZodErrors(result) {
  if (result.success) return {};
  return Object.fromEntries(
    Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
  );
}

// ── Trainer ──────────────────────────────────────────────────
export const trainerSchema = z.object({
  first_name:      z.string().min(1, 'Required').max(50),
  last_name:       z.string().min(1, 'Required').max(50),
  email:           z.string().min(1, 'Required').email('Invalid email').toLowerCase(),
  phone:           z.string().min(7, 'Too short').max(20).regex(/^[+\d\s\-()]+$/, 'Invalid'),
  specialization:  z.string().max(100).optional(),
  bio:             z.string().max(500).optional(),
  hire_date:       z.string().optional(),
});

// ── Lead ─────────────────────────────────────────────────────
export const leadSchema = z.object({
  first_name: z.string().min(1, 'Required').max(50),
  last_name:  z.string().max(50).optional(),
  email:      z.string().email('Invalid email').optional().or(z.literal('')),
  phone:      z.string().min(7, 'Too short').max(20).regex(/^[+\d\s\-()]+$/, 'Invalid').optional().or(z.literal('')),
  source:     z.enum(['walk_in', 'referral', 'instagram', 'facebook', 'google', 'other']),
  status:     z.enum(['new', 'contacted', 'interested', 'converted', 'lost']).default('new'),
  notes:      z.string().max(500).optional(),
}).refine((d) => d.email || d.phone, {
  message: 'Either email or phone is required',
  path:    ['phone'],
});

// ── Followup ─────────────────────────────────────────────────
export const followupSchema = z.object({
  method: z.enum(['call', 'whatsapp', 'email', 'in_person', 'walk_in', 'other']),
  notes:  z.string().min(1, 'Required').max(500),
});

// ── Payment ──────────────────────────────────────────────────
export const paymentSchema = z.object({
  member_id:      z.string().uuid('Required'),
  amount:         z.string().min(1, 'Required').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be > 0'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  reference_no:   z.string().max(100).optional(),
  notes:          z.string().max(500).optional(),
});

// ── Renew Subscription ───────────────────────────────────────
export const renewSchema = z.object({
  member_id:      z.string().uuid(),
  plan_id:        z.string().uuid('Select a plan'),
  start_date:     z.string().min(1, 'Required'),
  amount_paid:    z.string().min(1, 'Required').refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Invalid'),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'other']),
  reference_no:   z.string().max(100).optional(),
  notes:          z.string().max(500).optional(),
});

// ── Branch Settings ──────────────────────────────────────────
export const branchSchema = z.object({
  name:    z.string().min(1, 'Required').max(100),
  address: z.string().max(300).optional(),
  phone:   z.string().max(20).optional(),
  email:   z.string().email('Invalid email').optional().or(z.literal('')),
});

// ── Plan Settings ────────────────────────────────────────────
export const planSchema = z.object({
  billing_cycle: z.enum(['day_pass', 'weekly', 'monthly', 'yearly']),
  price:         z.string().min(1, 'Required').refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Invalid'),
  description:   z.string().max(200).optional(),
  is_active:     z.boolean().default(true),
});
