CREATE TABLE "insurance_service_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insurance_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"coverage_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"plafond" numeric(10, 2),
	"requires_authorization" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_insurances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"insurance_id" uuid NOT NULL,
	"insurance_number" varchar(100),
	"insurance_card_number" varchar(100),
	"insurance_expiry_date" varchar(10),
	"coverage_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pharmacy_sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"lot_id" uuid NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pharmacy_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_date" timestamp DEFAULT now() NOT NULL,
	"status" varchar(50) DEFAULT 'confirmed' NOT NULL,
	"payment_method" varchar(50) DEFAULT 'cash' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'paid' NOT NULL,
	"customer_name" varchar(255),
	"subtotal" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"commune_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "quartiers" DROP CONSTRAINT "quartiers_commune_id_communes_id_fk";
--> statement-breakpoint
DROP INDEX "quartiers_commune_id_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "medicines" ADD COLUMN "selling_price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "insurance_expiry_date" varchar(10);--> statement-breakpoint
ALTER TABLE "quartiers" ADD COLUMN "zone_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "insurance_service_rules" ADD CONSTRAINT "insurance_service_rules_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "insurance_service_rules" ADD CONSTRAINT "insurance_service_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_insurances" ADD CONSTRAINT "patient_insurances_insurance_id_insurances_id_fk" FOREIGN KEY ("insurance_id") REFERENCES "public"."insurances"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_sale_id_pharmacy_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."pharmacy_sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_sale_items" ADD CONSTRAINT "pharmacy_sale_items_lot_id_medicine_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."medicine_lots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_commune_id_communes_id_fk" FOREIGN KEY ("commune_id") REFERENCES "public"."communes"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "insurance_service_rules_insurance_id_idx" ON "insurance_service_rules" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "insurance_service_rules_service_id_idx" ON "insurance_service_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "patient_insurances_patient_id_idx" ON "patient_insurances" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_insurances_insurance_id_idx" ON "patient_insurances" USING btree ("insurance_id");--> statement-breakpoint
CREATE INDEX "pharmacy_sale_items_sale_idx" ON "pharmacy_sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "pharmacy_sale_items_medicine_idx" ON "pharmacy_sale_items" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "pharmacy_sale_items_lot_idx" ON "pharmacy_sale_items" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "zones_commune_id_idx" ON "zones" USING btree ("commune_id");--> statement-breakpoint
ALTER TABLE "quartiers" ADD CONSTRAINT "quartiers_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "quartiers_zone_id_idx" ON "quartiers" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
ALTER TABLE "quartiers" DROP COLUMN "commune_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");