import {
  pgTable, uuid, text, boolean, numeric,
  timestamp, date, time, jsonb, char, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── Branches ──────────────────────────────────────────────────
export const branches = pgTable('branches', {
  id:         uuid('id').primaryKey().defaultRandom(),
  name:       text('name').notNull(),
  address:    text('address'),
  phone:      text('phone'),
  email:      text('email'),
  is_active:  boolean('is_active').notNull().default(true),
  currency:   text('currency').default('BZD'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Profiles ──────────────────────────────────────────────────
export const profiles = pgTable('profiles', {
  id:                    text('id').primaryKey(), // Clerk user ID
  branch_id:             uuid('branch_id').notNull().references(() => branches.id),
  role:                  text('role').notNull(),
  first_name:            text('first_name').notNull(),
  last_name:             text('last_name').notNull(),
  email:                 text('email').notNull().unique(),
  phone:                 text('phone'),
  avatar_url:            text('avatar_url'),
  is_active:             boolean('is_active').notNull().default(true),
  push_token:            text('push_token'),
  push_token_updated_at: timestamp('push_token_updated_at', { withTimezone: true }),
  created_at:            timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:            timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('profiles_branch_id_idx').on(t.branch_id),
  index('profiles_role_idx').on(t.role),
  index('profiles_email_idx').on(t.email),
]);

// ── Pending Invitations ───────────────────────────────────────
export const pendingInvitations = pgTable('pending_invitations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  email:           text('email').notNull().unique(),
  first_name:      text('first_name').notNull(),
  clerk_invite_id: text('clerk_invite_id'),
  branch_id:       uuid('branch_id').references(() => branches.id),
  created_at:      timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('pending_invitations_branch_id_idx').on(t.branch_id),
]);

// ── Membership Plans ──────────────────────────────────────────
export const membershipPlans = pgTable('membership_plans', {
  id:            uuid('id').primaryKey().defaultRandom(),
  branch_id:     uuid('branch_id').notNull().references(() => branches.id),
  billing_cycle: text('billing_cycle').notNull(),
  price:         numeric('price').notNull(),
  description:   text('description'),
  is_active:     boolean('is_active').notNull().default(true),
  created_at:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('membership_plans_branch_id_idx').on(t.branch_id),
  index('membership_plans_is_active_idx').on(t.is_active),
]);

// ── Members ───────────────────────────────────────────────────
export const members = pgTable('members', {
  id:              uuid('id').primaryKey().defaultRandom(),
  profile_id:      text('profile_id').notNull().unique().references(() => profiles.id),
  branch_id:       uuid('branch_id').notNull().references(() => branches.id),
  member_number:   text('member_number').notNull().unique(),
  profile_pic_url: text('profile_pic_url'),
  card_url:        text('card_url'),
  date_of_birth:   date('date_of_birth'),
  gender:          text('gender'),
  address:         text('address'),
  emergency_name:  text('emergency_name'),
  emergency_phone: text('emergency_phone'),
  qr_token:        text('qr_token').notNull().unique(),
  is_active:       boolean('is_active').notNull().default(true),
  created_at:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('members_branch_id_idx').on(t.branch_id),
  index('members_is_active_idx').on(t.is_active),
  index('members_profile_id_idx').on(t.profile_id),
  index('members_qr_token_idx').on(t.qr_token),
]);

// ── Member Subscriptions ──────────────────────────────────────
export const memberSubscriptions = pgTable('member_subscriptions', {
  id:         uuid('id').primaryKey().defaultRandom(),
  member_id:  uuid('member_id').notNull().references(() => members.id),
  plan_id:    uuid('plan_id').notNull().references(() => membershipPlans.id),
  branch_id:  uuid('branch_id').notNull().references(() => branches.id),
  start_date: date('start_date').notNull(),
  end_date:   date('end_date').notNull(),
  status:     text('status').notNull().default('active'),
  renewed_by: text('renewed_by'), // Clerk user ID
  notes:      text('notes'),
  frozen_at: timestamp('frozen_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('member_subscriptions_member_id_idx').on(t.member_id),
  index('member_subscriptions_branch_id_idx').on(t.branch_id),
  index('member_subscriptions_status_idx').on(t.status),
  index('member_subscriptions_end_date_idx').on(t.end_date),
]);

// ── Payments ──────────────────────────────────────────────────
export const payments = pgTable('payments', {
  id:              uuid('id').primaryKey().defaultRandom(),
  member_id:       uuid('member_id').notNull().references(() => members.id),
  subscription_id: uuid('subscription_id').notNull().references(() => memberSubscriptions.id),
  branch_id:       uuid('branch_id').notNull().references(() => branches.id),
  amount:          numeric('amount').notNull(),
  payment_method:  text('payment_method').notNull(),
  payment_date:    timestamp('payment_date', { withTimezone: true }).defaultNow(),
  reference_no:    text('reference_no'),
  recorded_by:     text('recorded_by'), // Clerk user ID
  notes:           text('notes'),
  created_at:      timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('payments_member_id_idx').on(t.member_id),
  index('payments_branch_id_idx').on(t.branch_id),
  index('payments_payment_date_idx').on(t.payment_date),
]);

// ── Trainers ──────────────────────────────────────────────────
export const trainers = pgTable('trainers', {
  id:             uuid('id').primaryKey().defaultRandom(),
  profile_id:     text('profile_id').notNull().unique().references(() => profiles.id),
  branch_id:      uuid('branch_id').notNull().references(() => branches.id),
  specialization: text('specialization'),
  bio:            text('bio'),
  hire_date:      date('hire_date'),
  is_active:      boolean('is_active').notNull().default(true),
  created_at:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('trainers_branch_id_idx').on(t.branch_id),
  index('trainers_is_active_idx').on(t.is_active),
]);

// ── Member Trainer Assignments ────────────────────────────────
export const memberTrainerAssignments = pgTable('member_trainer_assignments', {
  id:          uuid('id').primaryKey().defaultRandom(),
  member_id:   uuid('member_id').notNull().references(() => members.id),
  trainer_id:  uuid('trainer_id').notNull().references(() => trainers.id),
  branch_id:   uuid('branch_id').notNull().references(() => branches.id),
  assigned_by: text('assigned_by').notNull(), // Clerk user ID
  assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
  is_active:   boolean('is_active').notNull().default(true),
}, (t) => [
  index('mta_member_id_idx').on(t.member_id),
  index('mta_trainer_id_idx').on(t.trainer_id),
  index('mta_is_active_idx').on(t.is_active),
]);

// ── Trainer Attendance ────────────────────────────────────────
export const trainerAttendance = pgTable('trainer_attendance', {
  id:         uuid('id').primaryKey().defaultRandom(),
  trainer_id: uuid('trainer_id').notNull().references(() => trainers.id),
  branch_id:  uuid('branch_id').notNull().references(() => branches.id),
  date:       date('date').notNull(),
  status:     text('status').notNull(), // present | absent | leave
  marked_by:  text('marked_by').notNull(), // Clerk user ID
  notes:      text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('trainer_attendance_trainer_id_idx').on(t.trainer_id),
  index('trainer_attendance_date_idx').on(t.date),
  index('trainer_attendance_branch_id_idx').on(t.branch_id),
]);

// ── Trainer Duty ──────────────────────────────────────────────
export const trainerDuty = pgTable('trainer_duty', {
  id:          uuid('id').primaryKey().defaultRandom(),
  branch_id:   uuid('branch_id').references(() => branches.id),
  trainer_id:  uuid('trainer_id').references(() => trainers.id),
  date:        date('date').notNull(),
  is_full_day: boolean('is_full_day').default(true),
  shift_start: time('shift_start'),
  shift_end:   time('shift_end'),
  created_at:  timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('trainer_duty_trainer_id_idx').on(t.trainer_id),
  index('trainer_duty_date_idx').on(t.date),
  index('trainer_duty_branch_id_idx').on(t.branch_id),
]);

// ── Trainer Duty Patterns ─────────────────────────────────────
export const trainerDutyPatterns = pgTable('trainer_duty_patterns', {
  id:           uuid('id').primaryKey().defaultRandom(),
  branch_id:    uuid('branch_id').references(() => branches.id),
  trainer_id:   uuid('trainer_id').references(() => trainers.id),
  days_of_week: text('days_of_week').array().notNull(),
  start_date:   date('start_date').notNull(),
  end_date:     date('end_date').notNull(),
  is_full_day:  boolean('is_full_day').default(true),
  shift_start:  time('shift_start'),
  shift_end:    time('shift_end'),
  created_by:   text('created_by'), // Clerk user ID
  created_at:   timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('trainer_duty_patterns_trainer_id_idx').on(t.trainer_id),
  index('trainer_duty_patterns_branch_id_idx').on(t.branch_id),
]);

// ── Trainer Schedules ─────────────────────────────────────────
export const trainerSchedules = pgTable('trainer_schedules', {
  id:          uuid('id').primaryKey().defaultRandom(),
  trainer_id:  uuid('trainer_id').notNull().references(() => trainers.id),
  branch_id:   uuid('branch_id').notNull().references(() => branches.id),
  day_of_week: text('day_of_week').notNull(),
  start_time:  time('start_time').notNull(),
  end_time:    time('end_time').notNull(),
  notes:       text('notes'),
  created_at:  timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:  timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('trainer_schedules_trainer_id_idx').on(t.trainer_id),
  index('trainer_schedules_branch_id_idx').on(t.branch_id),
]);

// ── Access Logs ───────────────────────────────────────────────
export const accessLogs = pgTable('access_logs', {
  id:            uuid('id').primaryKey().defaultRandom(),
  member_id:     uuid('member_id').notNull().references(() => members.id),
  branch_id:     uuid('branch_id').notNull().references(() => branches.id),
  method:        text('method').notNull(), // qr | code
  status:        text('status').notNull(), // granted | denied
  denied_reason: text('denied_reason'),
  device_id:     text('device_id'),
  accessed_at:   timestamp('accessed_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('access_logs_member_id_idx').on(t.member_id),
  index('access_logs_branch_id_idx').on(t.branch_id),
  index('access_logs_accessed_at_idx').on(t.accessed_at),
]);

// ── Member Attendance ─────────────────────────────────────────
export const memberAttendance = pgTable('member_attendance', {
  id:            uuid('id').primaryKey().defaultRandom(),
  member_id:     uuid('member_id').notNull().references(() => members.id),
  branch_id:     uuid('branch_id').notNull().references(() => branches.id),
  date:          date('date').notNull(),
  checked_in_at: timestamp('checked_in_at', { withTimezone: true }).defaultNow(),
  method:        text('method').notNull(), // qr | code | manual
}, (t) => [
  index('member_attendance_member_id_idx').on(t.member_id),
  index('member_attendance_date_idx').on(t.date),
  index('member_attendance_branch_id_idx').on(t.branch_id),
]);

// ── Daily Access Codes ────────────────────────────────────────
export const dailyAccessCodes = pgTable('daily_access_codes', {
  id:         uuid('id').primaryKey().defaultRandom(),
  branch_id:  uuid('branch_id').notNull().references(() => branches.id),
  code:       text('code').notNull(),
  valid_date: date('valid_date').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('daily_access_codes_branch_id_idx').on(t.branch_id),
  index('daily_access_codes_valid_date_idx').on(t.valid_date),
]);

// ── Member Access Codes ────────────────────────────────────────

export const memberAccessCodes = pgTable('member_access_codes', {
  id:         uuid('id').primaryKey().defaultRandom(),
  member_id:  uuid('member_id').notNull().unique().references(() => members.id),
  code:       text('code').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ── Leads ─────────────────────────────────────────────────────
export const leads = pgTable('leads', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  branch_id:           uuid('branch_id').notNull().references(() => branches.id),
  first_name:          text('first_name').notNull(),
  last_name:           text('last_name').notNull(),
  email:               text('email'),
  phone:               text('phone'),
  source:              text('source').notNull(),
  status:              text('status').notNull().default('new'),
  notes:               text('notes'),
  date_of_birth:       date('date_of_birth'),
  interested_plan_id:  uuid('interested_plan_id').references(() => membershipPlans.id),
  converted_member_id: uuid('converted_member_id').references(() => members.id),
  assigned_to:         text('assigned_to'), // Clerk user ID
  emergency_name:      text('emergency_name'),
  emergency_phone:     text('emergency_phone'),
  created_at:          timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:          timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('leads_branch_id_idx').on(t.branch_id),
  index('leads_status_idx').on(t.status),
  index('leads_created_at_idx').on(t.created_at),
]);

// ── Lead Followups ────────────────────────────────────────────
export const leadFollowups = pgTable('lead_followups', {
  id:          uuid('id').primaryKey().defaultRandom(),
  lead_id:     uuid('lead_id').notNull().references(() => leads.id),
  notes:       text('notes').notNull(),
  method:      text('method').notNull(),
  followed_by: text('followed_by').notNull(), // Clerk user ID
  followed_at: timestamp('followed_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('lead_followups_lead_id_idx').on(t.lead_id),
  index('lead_followups_followed_at_idx').on(t.followed_at),
]);

// ── Gym Schedule Settings ─────────────────────────────────────
export const gymScheduleSettings = pgTable('gym_schedule_settings', {
  id:              uuid('id').primaryKey().defaultRandom(),
  branch_id:       uuid('branch_id').unique().references(() => branches.id),
  default_open:    time('default_open').notNull().default('06:00'),
  default_close:   time('default_close').notNull().default('22:00'),
  weekly_off_days: text('weekly_off_days').array().default([]),
  created_at:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ── Gym Holidays ──────────────────────────────────────────────
export const gymHolidays = pgTable('gym_holidays', {
  id:                    uuid('id').primaryKey().defaultRandom(),
  branch_id:             uuid('branch_id').references(() => branches.id),
  date:                  date('date').notNull(),
  title:                 text('title').notNull(),
  reason:                text('reason'),
  notify_sent_at:        timestamp('notify_sent_at', { withTimezone: true }),
  cancelled_at:          timestamp('cancelled_at', { withTimezone: true }),
  cancel_notify_sent_at: timestamp('cancel_notify_sent_at', { withTimezone: true }),
  created_at:            timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('gym_holidays_branch_id_idx').on(t.branch_id),
  index('gym_holidays_date_idx').on(t.date),
]);

// ── Gym Day Overrides ─────────────────────────────────────────
export const gymDayOverrides = pgTable('gym_day_overrides', {
  id:          uuid('id').primaryKey().defaultRandom(),
  branch_id:   uuid('branch_id').references(() => branches.id),
  date:        date('date').notNull(),
  open_time:   time('open_time'),
  close_time:  time('close_time'),
  is_closed:   boolean('is_closed').default(false),
  notes:       text('notes'),
  created_at:  timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('gym_day_overrides_branch_id_idx').on(t.branch_id),
  index('gym_day_overrides_date_idx').on(t.date),
]);

// ── Audit Logs ────────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id:         uuid('id').primaryKey().defaultRandom(),
  branch_id:  uuid('branch_id').notNull().references(() => branches.id),
  profile_id: text('profile_id').notNull(), // Clerk user ID
  action:     text('action').notNull(),
  entity:     text('entity').notNull(),
  entity_id:  uuid('entity_id').notNull(),
  old_value:  jsonb('old_value'),
  new_value:  jsonb('new_value'),
  ip_address: text('ip_address'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('audit_logs_branch_id_idx').on(t.branch_id),
  index('audit_logs_profile_id_idx').on(t.profile_id),
  index('audit_logs_created_at_idx').on(t.created_at),
]);

