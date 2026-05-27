import { z } from 'zod';
import { NextResponse } from 'next/server';

// ── Reusable field schemas ────────────────────────────────────
export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email address')
  .toLowerCase()
  .trim();

export const nameSchema = z
  .string({ required_error: 'Name is required' })
  .min(1, 'Name cannot be empty')
  .max(100, 'Name too long')
  .trim();

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long');

export const uuidSchema = z
  .string({ required_error: 'ID is required' })
  .uuid('Invalid ID format');

// ── Route-specific schemas ────────────────────────────────────

export const inviteMemberSchema = z.object({
  email:     emailSchema,
  firstName: nameSchema,
  branchId:  uuidSchema.optional(),
});

export const resendInviteSchema = z.object({
  email:     emailSchema,
  firstName: nameSchema.optional(),
});

export const receiptSchema = z.object({
  payment_id: uuidSchema,
  type:       z.enum(['new', 'renewal']).default('new'),
});

export const searchSchema = z.object({
  q: z
    .string({ required_error: 'Search query is required' })
    .min(2, 'Query must be at least 2 characters')
    .max(100, 'Query too long')
    .trim(),
});

export const leadSubmitSchema = z.object({
  first_name: nameSchema,
  last_name:  nameSchema.optional(),
  email:      emailSchema.optional(),
  phone:      z.string().max(20).trim().optional(),
  message:    z.string().max(1000).trim().optional(),
  plan_id:    uuidSchema.optional(),
});

// ── Helper — validate + return error response ─────────────────
export function validateBody(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const first  = Object.values(errors).flat()[0] || 'Invalid input';
    return {
      success: false,
      error:   NextResponse.json({ error: first, errors }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}

// ── Helper — validate query params ───────────────────────────
export function validateQuery(schema, searchParams) {
  const obj = Object.fromEntries(searchParams.entries());
  return validateBody(schema, obj);
}
