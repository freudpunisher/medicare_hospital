CREATE TABLE "insurance_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insurance_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"claim_amount" numeric(10, 2) NOT NULL,
	"approved_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"denied_reason" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insurance_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insurance_id" uuid NOT NULL,
	"claim_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"reference_number" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "insurance_service_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "insurance_service_rules" CASCADE;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "insurance_card_number" varchar(100);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "coverage_rate" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD CONSTRAINT "insurance_payments_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_payments" ADD CONSTRAINT "insurance_payments_claim_id_insurance_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."insurance_claims"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "insurance_claims_insurance_id_idx" ON "insurance_claims" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "insurance_claims_patient_id_idx" ON "insurance_claims" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "insurance_claims_invoice_id_idx" ON "insurance_claims" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "insurance_payments_insurance_id_idx" ON "insurance_payments" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "insurance_payments_claim_id_idx" ON "insurance_payments" USING btree ("claim_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "patients_insurance_card_number_idx" ON "patients" USING btree ("insurance_card_number");--> statement-breakpoint
CREATE INDEX "patients_coverage_rate_idx" ON "patients" USING btree ("coverage_rate");--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_insurance_card_number_unique" UNIQUE("insurance_card_number");