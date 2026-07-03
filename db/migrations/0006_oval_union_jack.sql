CREATE TABLE "corporate_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"employee_number" varchar(100) NOT NULL,
	"department" varchar(255),
	"position" varchar(255),
	"hire_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "corporate_employees_employee_number_unique" UNIQUE("employee_number")
);
--> statement-breakpoint
CREATE TABLE "corporate_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"registration_number" varchar(100),
	"tax_id" varchar(100),
	"contact_person" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"address" text,
	"website" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"partnership_start_date" timestamp NOT NULL,
	"partnership_end_date" timestamp,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "corporate_partners_company_name_unique" UNIQUE("company_name"),
	CONSTRAINT "corporate_partners_registration_number_unique" UNIQUE("registration_number"),
	CONSTRAINT "corporate_partners_tax_id_unique" UNIQUE("tax_id")
);
--> statement-breakpoint
CREATE TABLE "insurance_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insurance_id" uuid NOT NULL,
	"batch_number" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurance_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "menu_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group" varchar(255) NOT NULL,
	"roles" text DEFAULT '*' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_permissions_group_unique" UNIQUE("group")
);
--> statement-breakpoint
CREATE TABLE "partnership_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"agreement_number" varchar(100) NOT NULL,
	"agreement_type" varchar(50) NOT NULL,
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"global_discount_percentage" numeric(5, 2),
	"max_discount_per_visit" numeric(10, 2),
	"max_discount_per_year" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partnership_agreements_agreement_number_unique" UNIQUE("agreement_number")
);
--> statement-breakpoint
CREATE TABLE "partnership_discount_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"invoice_item_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"original_price" numeric(10, 2) NOT NULL,
	"discounted_price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"discount_type" varchar(50) NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_service_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"agreement_id" uuid NOT NULL,
	"service_id" uuid,
	"medical_act_id" uuid,
	"specialty_id" uuid,
	"reduction_type" varchar(50) NOT NULL,
	"reduction_value" numeric(10, 2) NOT NULL,
	"max_reduction_amount" numeric(10, 2),
	"min_billable_amount" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" numeric DEFAULT '1' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_visit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"visit_id" uuid NOT NULL,
	"invoice_id" uuid,
	"total_discount_applied" numeric(10, 2) DEFAULT '0' NOT NULL,
	"original_total" numeric(10, 2) NOT NULL,
	"final_total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "insurance_payments" DROP CONSTRAINT "insurance_payments_claim_id_insurance_claims_id_fk";
--> statement-breakpoint
ALTER TABLE "insurance_payments" ALTER COLUMN "claim_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quartiers" ALTER COLUMN "zone_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_register" ADD COLUMN "assigned_to_user_id" uuid;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "opened_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "closed_by" uuid;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "expected_balance" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "physical_balance" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD COLUMN "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD COLUMN "batch_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD COLUMN "payment_method" varchar(50) DEFAULT 'transfer' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "insurance_paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "is_corporate_employee" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "corporate_partner_id" uuid;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "corporate_employee_id" uuid;--> statement-breakpoint
ALTER TABLE "corporate_employees" ADD CONSTRAINT "corporate_employees_partner_id_corporate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "corporate_employees" ADD CONSTRAINT "corporate_employees_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_batches" ADD CONSTRAINT "insurance_batches_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_agreements" ADD CONSTRAINT "partnership_agreements_partner_id_corporate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_discount_history" ADD CONSTRAINT "partnership_discount_history_partner_id_corporate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_discount_history" ADD CONSTRAINT "partnership_discount_history_invoice_item_id_invoice_items_id_fk" FOREIGN KEY ("invoice_item_id") REFERENCES "public"."invoice_items"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_discount_history" ADD CONSTRAINT "partnership_discount_history_rule_id_partnership_service_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."partnership_service_rules"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_service_rules" ADD CONSTRAINT "partnership_service_rules_partner_id_corporate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_service_rules" ADD CONSTRAINT "partnership_service_rules_agreement_id_partnership_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."partnership_agreements"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_service_rules" ADD CONSTRAINT "partnership_service_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_service_rules" ADD CONSTRAINT "partnership_service_rules_medical_act_id_medical_acts_id_fk" FOREIGN KEY ("medical_act_id") REFERENCES "public"."medical_acts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_service_rules" ADD CONSTRAINT "partnership_service_rules_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_visit_logs" ADD CONSTRAINT "partnership_visit_logs_partner_id_corporate_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_visit_logs" ADD CONSTRAINT "partnership_visit_logs_employee_id_corporate_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."corporate_employees"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_visit_logs" ADD CONSTRAINT "partnership_visit_logs_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partnership_visit_logs" ADD CONSTRAINT "partnership_visit_logs_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "corporate_employees_partner_id_idx" ON "corporate_employees" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "corporate_employees_patient_id_idx" ON "corporate_employees" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "corporate_employees_employee_number_idx" ON "corporate_employees" USING btree ("employee_number");--> statement-breakpoint
CREATE INDEX "corporate_partners_company_name_idx" ON "corporate_partners" USING btree ("company_name");--> statement-breakpoint
CREATE INDEX "corporate_partners_is_active_idx" ON "corporate_partners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "insurance_batches_insurance_id_idx" ON "insurance_batches" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "insurance_batches_status_idx" ON "insurance_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "menu_permissions_group_idx" ON "menu_permissions" USING btree ("group");--> statement-breakpoint
CREATE INDEX "partnership_agreements_partner_id_idx" ON "partnership_agreements" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partnership_agreements_agreement_number_idx" ON "partnership_agreements" USING btree ("agreement_number");--> statement-breakpoint
CREATE INDEX "partnership_agreements_is_active_idx" ON "partnership_agreements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "partnership_discount_history_partner_id_idx" ON "partnership_discount_history" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partnership_discount_history_invoice_item_id_idx" ON "partnership_discount_history" USING btree ("invoice_item_id");--> statement-breakpoint
CREATE INDEX "partnership_discount_history_rule_id_idx" ON "partnership_discount_history" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "partnership_service_rules_partner_id_idx" ON "partnership_service_rules" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partnership_service_rules_agreement_id_idx" ON "partnership_service_rules" USING btree ("agreement_id");--> statement-breakpoint
CREATE INDEX "partnership_service_rules_service_id_idx" ON "partnership_service_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "partnership_service_rules_medical_act_id_idx" ON "partnership_service_rules" USING btree ("medical_act_id");--> statement-breakpoint
CREATE INDEX "partnership_visit_logs_partner_id_idx" ON "partnership_visit_logs" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partnership_visit_logs_employee_id_idx" ON "partnership_visit_logs" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "partnership_visit_logs_visit_id_idx" ON "partnership_visit_logs" USING btree ("visit_id");--> statement-breakpoint
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_batch_id_insurance_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."insurance_batches"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD CONSTRAINT "insurance_payments_batch_id_insurance_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."insurance_batches"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD CONSTRAINT "insurance_payments_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."insurance_claims"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_corporate_partner_id_corporate_partners_id_fk" FOREIGN KEY ("corporate_partner_id") REFERENCES "public"."corporate_partners"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_corporate_employee_id_corporate_employees_id_fk" FOREIGN KEY ("corporate_employee_id") REFERENCES "public"."corporate_employees"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "insurance_claims_batch_id_idx" ON "insurance_claims" USING btree ("batch_id");--> statement-breakpoint
ALTER TABLE "cash_sessions" DROP COLUMN "opened_at";--> statement-breakpoint
ALTER TABLE "cash_sessions" DROP COLUMN "closed_at";--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoice_id_unique" UNIQUE("invoice_id");