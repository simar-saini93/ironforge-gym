CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"method" text NOT NULL,
	"status" text NOT NULL,
	"denied_reason" text,
	"device_id" text,
	"accessed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"profile_id" text NOT NULL,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"email" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"currency" text DEFAULT 'BZD',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_access_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" text NOT NULL,
	"valid_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gym_day_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"date" date NOT NULL,
	"open_time" time,
	"close_time" time,
	"is_closed" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gym_holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"date" date NOT NULL,
	"title" text NOT NULL,
	"reason" text,
	"notify_sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_notify_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gym_schedule_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"default_open" time DEFAULT '06:00' NOT NULL,
	"default_close" time DEFAULT '22:00' NOT NULL,
	"weekly_off_days" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "gym_schedule_settings_branch_id_unique" UNIQUE("branch_id")
);
--> statement-breakpoint
CREATE TABLE "lead_followups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"notes" text NOT NULL,
	"method" text NOT NULL,
	"followed_by" text NOT NULL,
	"followed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"source" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"date_of_birth" date,
	"interested_plan_id" uuid,
	"converted_member_id" uuid,
	"assigned_to" text,
	"emergency_name" text,
	"emergency_phone" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"date" date NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now(),
	"method" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"renewed_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "member_trainer_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"trainer_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"member_number" text NOT NULL,
	"profile_pic_url" text,
	"card_url" text,
	"date_of_birth" date,
	"gender" text,
	"address" text,
	"emergency_name" text,
	"emergency_phone" text,
	"qr_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "members_profile_id_unique" UNIQUE("profile_id"),
	CONSTRAINT "members_member_number_unique" UNIQUE("member_number"),
	CONSTRAINT "members_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"billing_cycle" text NOT NULL,
	"price" numeric NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now(),
	"reference_no" text,
	"recorded_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pending_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"clerk_invite_id" text,
	"branch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "pending_invitations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" uuid NOT NULL,
	"role" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"push_token" text,
	"push_token_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "trainer_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"marked_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trainer_duty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"trainer_id" uuid,
	"date" date NOT NULL,
	"is_full_day" boolean DEFAULT true,
	"shift_start" time,
	"shift_end" time,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trainer_duty_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid,
	"trainer_id" uuid,
	"days_of_week" text[] NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_full_day" boolean DEFAULT true,
	"shift_start" time,
	"shift_end" time,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trainer_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trainers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"specialization" text,
	"bio" text,
	"hire_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "trainers_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_access_codes" ADD CONSTRAINT "daily_access_codes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_day_overrides" ADD CONSTRAINT "gym_day_overrides_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_holidays" ADD CONSTRAINT "gym_holidays_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gym_schedule_settings" ADD CONSTRAINT "gym_schedule_settings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_interested_plan_id_membership_plans_id_fk" FOREIGN KEY ("interested_plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_converted_member_id_members_id_fk" FOREIGN KEY ("converted_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_attendance" ADD CONSTRAINT "member_attendance_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_attendance" ADD CONSTRAINT "member_attendance_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_subscriptions" ADD CONSTRAINT "member_subscriptions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_trainer_assignments" ADD CONSTRAINT "member_trainer_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_trainer_assignments" ADD CONSTRAINT "member_trainer_assignments_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_trainer_assignments" ADD CONSTRAINT "member_trainer_assignments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_member_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."member_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_invitations" ADD CONSTRAINT "pending_invitations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_attendance" ADD CONSTRAINT "trainer_attendance_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_attendance" ADD CONSTRAINT "trainer_attendance_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_duty" ADD CONSTRAINT "trainer_duty_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_duty" ADD CONSTRAINT "trainer_duty_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_duty_patterns" ADD CONSTRAINT "trainer_duty_patterns_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_duty_patterns" ADD CONSTRAINT "trainer_duty_patterns_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_schedules" ADD CONSTRAINT "trainer_schedules_trainer_id_trainers_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainer_schedules" ADD CONSTRAINT "trainer_schedules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainers" ADD CONSTRAINT "trainers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_member_id_idx" ON "access_logs" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "access_logs_branch_id_idx" ON "access_logs" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "access_logs_accessed_at_idx" ON "access_logs" USING btree ("accessed_at");--> statement-breakpoint
CREATE INDEX "audit_logs_branch_id_idx" ON "audit_logs" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "audit_logs_profile_id_idx" ON "audit_logs" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "daily_access_codes_branch_id_idx" ON "daily_access_codes" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "daily_access_codes_valid_date_idx" ON "daily_access_codes" USING btree ("valid_date");--> statement-breakpoint
CREATE INDEX "gym_day_overrides_branch_id_idx" ON "gym_day_overrides" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "gym_day_overrides_date_idx" ON "gym_day_overrides" USING btree ("date");--> statement-breakpoint
CREATE INDEX "gym_holidays_branch_id_idx" ON "gym_holidays" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "gym_holidays_date_idx" ON "gym_holidays" USING btree ("date");--> statement-breakpoint
CREATE INDEX "lead_followups_lead_id_idx" ON "lead_followups" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_followups_followed_at_idx" ON "lead_followups" USING btree ("followed_at");--> statement-breakpoint
CREATE INDEX "leads_branch_id_idx" ON "leads" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "member_attendance_member_id_idx" ON "member_attendance" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_attendance_date_idx" ON "member_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "member_attendance_branch_id_idx" ON "member_attendance" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "member_subscriptions_member_id_idx" ON "member_subscriptions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "member_subscriptions_branch_id_idx" ON "member_subscriptions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "member_subscriptions_status_idx" ON "member_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "member_subscriptions_end_date_idx" ON "member_subscriptions" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "mta_member_id_idx" ON "member_trainer_assignments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "mta_trainer_id_idx" ON "member_trainer_assignments" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "mta_is_active_idx" ON "member_trainer_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "members_branch_id_idx" ON "members" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "members_is_active_idx" ON "members" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "members_profile_id_idx" ON "members" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "members_qr_token_idx" ON "members" USING btree ("qr_token");--> statement-breakpoint
CREATE INDEX "membership_plans_branch_id_idx" ON "membership_plans" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "membership_plans_is_active_idx" ON "membership_plans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "payments_member_id_idx" ON "payments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "payments_branch_id_idx" ON "payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "payments_payment_date_idx" ON "payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "pending_invitations_branch_id_idx" ON "pending_invitations" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "profiles_branch_id_idx" ON "profiles" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "profiles_role_idx" ON "profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "trainer_attendance_trainer_id_idx" ON "trainer_attendance" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_attendance_date_idx" ON "trainer_attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "trainer_attendance_branch_id_idx" ON "trainer_attendance" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trainer_duty_trainer_id_idx" ON "trainer_duty" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_duty_date_idx" ON "trainer_duty" USING btree ("date");--> statement-breakpoint
CREATE INDEX "trainer_duty_branch_id_idx" ON "trainer_duty" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trainer_duty_patterns_trainer_id_idx" ON "trainer_duty_patterns" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_duty_patterns_branch_id_idx" ON "trainer_duty_patterns" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trainer_schedules_trainer_id_idx" ON "trainer_schedules" USING btree ("trainer_id");--> statement-breakpoint
CREATE INDEX "trainer_schedules_branch_id_idx" ON "trainer_schedules" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trainers_branch_id_idx" ON "trainers" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "trainers_is_active_idx" ON "trainers" USING btree ("is_active");