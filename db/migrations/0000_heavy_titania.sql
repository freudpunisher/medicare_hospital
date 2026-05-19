CREATE TABLE "accounting_journal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" varchar(50) NOT NULL,
	"description" varchar(255) NOT NULL,
	"debit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"credit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reference_id" uuid,
	"reference_type" varchar(50),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounting_journal_entry_number_unique" UNIQUE("entry_number")
);
--> statement-breakpoint
CREATE TABLE "cash_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_register_id" uuid NOT NULL,
	"opening_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"closing_balance" numeric(10, 2),
	"total_income" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_expenses" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"specialty_id" uuid NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"license_number" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctors_phone_unique" UNIQUE("phone"),
	CONSTRAINT "doctors_email_unique" UNIQUE("email"),
	CONSTRAINT "doctors_license_number_unique" UNIQUE("license_number")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"cash_session_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_service_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insurance_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"coverage_rate" numeric(5, 2) NOT NULL,
	"plafond" numeric(10, 2),
	"requires_authorization" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_info" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "insurances_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"medical_act_id" uuid NOT NULL,
	"quantity" numeric(5, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"patient_id" uuid NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"insurance_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"patient_amount" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "medical_acts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"service_id" uuid NOT NULL,
	"specialty_id" uuid,
	"base_price" numeric(10, 2) NOT NULL,
	"requires_authorization" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "medical_acts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"date_of_birth" varchar(10) NOT NULL,
	"gender" varchar(10) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"address" text,
	"is_insured" boolean DEFAULT false NOT NULL,
	"insurance_id" uuid,
	"insurance_number" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "patients_phone_unique" UNIQUE("phone"),
	CONSTRAINT "patients_email_unique" UNIQUE("email"),
	CONSTRAINT "patients_insurance_number_unique" UNIQUE("insurance_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"reference_number" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"is_billable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_unique" UNIQUE("name"),
	CONSTRAINT "services_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "specialties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"department_id" uuid NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD CONSTRAINT "cash_sessions_cash_register_id_cash_register_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_register"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_service_rules" ADD CONSTRAINT "insurance_service_rules_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_service_rules" ADD CONSTRAINT "insurance_service_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_medical_act_id_medical_acts_id_fk" FOREIGN KEY ("medical_act_id") REFERENCES "public"."medical_acts"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "medical_acts" ADD CONSTRAINT "medical_acts_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "medical_acts" ADD CONSTRAINT "medical_acts_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "specialties" ADD CONSTRAINT "specialties_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "accounting_journal_entry_number_idx" ON "accounting_journal" USING btree ("entry_number");--> statement-breakpoint
CREATE INDEX "accounting_journal_reference_id_idx" ON "accounting_journal" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "cash_register_name_idx" ON "cash_register" USING btree ("name");--> statement-breakpoint
CREATE INDEX "cash_sessions_cash_register_id_idx" ON "cash_sessions" USING btree ("cash_register_id");--> statement-breakpoint
CREATE INDEX "cash_sessions_status_idx" ON "cash_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "departments_is_active_idx" ON "departments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "doctors_specialty_id_idx" ON "doctors" USING btree ("specialty_id");--> statement-breakpoint
CREATE INDEX "doctors_phone_idx" ON "doctors" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "doctors_is_active_idx" ON "doctors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "expenses_cash_session_id_idx" ON "expenses" USING btree ("cash_session_id");--> statement-breakpoint
CREATE INDEX "insurance_service_rules_insurance_id_idx" ON "insurance_service_rules" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "insurance_service_rules_service_id_idx" ON "insurance_service_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "insurances_name_idx" ON "insurances" USING btree ("name");--> statement-breakpoint
CREATE INDEX "insurances_is_active_idx" ON "insurances" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_items_medical_act_id_idx" ON "invoice_items" USING btree ("medical_act_id");--> statement-breakpoint
CREATE INDEX "invoices_invoice_number_idx" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoices_patient_id_idx" ON "invoices" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "invoices_status_idx" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medical_acts_code_idx" ON "medical_acts" USING btree ("code");--> statement-breakpoint
CREATE INDEX "medical_acts_service_id_idx" ON "medical_acts" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "medical_acts_specialty_id_idx" ON "medical_acts" USING btree ("specialty_id");--> statement-breakpoint
CREATE INDEX "medical_acts_is_active_idx" ON "medical_acts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "patients_phone_idx" ON "patients" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "patients_insurance_id_idx" ON "patients" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "patients_is_insured_idx" ON "patients" USING btree ("is_insured");--> statement-breakpoint
CREATE INDEX "payments_invoice_id_idx" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "payments_patient_id_idx" ON "payments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "payments_payment_method_idx" ON "payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "services_code_idx" ON "services" USING btree ("code");--> statement-breakpoint
CREATE INDEX "services_is_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "specialties_department_id_idx" ON "specialties" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "specialties_name_idx" ON "specialties" USING btree ("name");