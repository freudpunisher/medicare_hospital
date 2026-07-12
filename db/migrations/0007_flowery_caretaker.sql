CREATE TYPE "public"."lab_order_status" AS ENUM('pending', 'sample_collected', 'in_analysis', 'results_entered', 'validated', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lab_test_type" AS ENUM('hematology', 'chemistry', 'microbiology', 'immunology', 'serology', 'urinalysis', 'parasitology', 'histopathology', 'molecular', 'endocrinology', 'other');--> statement-breakpoint
CREATE TYPE "public"."result_interpretation" AS ENUM('normal', 'low', 'high', 'critical_low', 'critical_high');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('laboratory', 'radiology', 'cardiology', 'neurology', 'oncology', 'orthopedics', 'pediatrics', 'obstetrics_gynecology', 'dermatology', 'ophthalmology', 'otolaryngology', 'urology', 'gastroenterology', 'pulmonology', 'psychiatry', 'anesthesiology', 'critical_care', 'emergency_medicine', 'general_surgery', 'laparoscopic_surgery', 'plastic_surgery', 'pathology', 'microbiology', 'mammography', 'echocardiography', 'mri', 'ct_scan', 'xray', 'physiotherapy', 'occupational_therapy', 'pharmacy', 'general_dentistry', 'oral_surgery', 'consultation', 'dialysis', 'chemotherapy', 'radiation_therapy', 'accommodation', 'other');--> statement-breakpoint
CREATE TABLE "clinic_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"nif" varchar(100),
	"rc" varchar(100),
	"forme_juridique" varchar(100),
	"address" text,
	"city" varchar(100),
	"commune" varchar(100),
	"province" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"website" varchar(255),
	"logo_url" text,
	"centre_fiscal" varchar(100),
	"slogan" varchar(255),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"exam_type" varchar(30) NOT NULL,
	"exam_name" varchar(255) NOT NULL,
	"priority" varchar(30) DEFAULT 'normal' NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"requested_by" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_request_id" uuid NOT NULL,
	"result_date" timestamp DEFAULT now() NOT NULL,
	"result_text" text,
	"file_url" text,
	"notes" text,
	"validated_by" uuid,
	"validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitalizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"department_id" uuid,
	"doctor_id" uuid,
	"admission_date" timestamp DEFAULT now() NOT NULL,
	"discharge_date" timestamp,
	"room_number" varchar(50),
	"bed_number" varchar(50),
	"status" varchar(30) DEFAULT 'admitted' NOT NULL,
	"reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"visit_id" uuid,
	"exam_request_id" uuid,
	"lab_test_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"ordered_by" uuid NOT NULL,
	"status" "lab_order_status" DEFAULT 'pending' NOT NULL,
	"priority" varchar(30) DEFAULT 'normal' NOT NULL,
	"sampled_at" timestamp,
	"sampled_by" uuid,
	"notes" text,
	"clinical_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "lab_result_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_result_id" uuid NOT NULL,
	"lab_test_parameter_id" uuid NOT NULL,
	"value" text NOT NULL,
	"numeric_value" numeric(12, 3),
	"unit" varchar(50),
	"interpretation" "result_interpretation",
	"flagged" boolean DEFAULT false NOT NULL,
	"reference_range_used" text,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_order_id" uuid NOT NULL,
	"recorded_by" uuid NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_results_lab_order_id_unique" UNIQUE("lab_order_id")
);
--> statement-breakpoint
CREATE TABLE "lab_test_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lab_test_id" uuid NOT NULL,
	"parameter_code" varchar(50) NOT NULL,
	"parameter_name" varchar(255) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"reference_range_low" numeric(12, 3),
	"reference_range_high" numeric(12, 3),
	"reference_range_text" text,
	"male_ref_range_low" numeric(12, 3),
	"male_ref_range_high" numeric(12, 3),
	"female_ref_range_low" numeric(12, 3),
	"female_ref_range_high" numeric(12, 3),
	"sort_order" numeric(3, 0) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"test_type" "lab_test_type" NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL,
	"turnaround_time_hours" numeric(5, 1) DEFAULT '24' NOT NULL,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lab_tests_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "medical_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"decision" varchar(50) NOT NULL,
	"specialist_id" uuid,
	"follow_up_date" timestamp,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "opened_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "cash_sessions" ADD COLUMN "closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "diagnosis_type" varchar(30) DEFAULT 'principal' NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnoses" ADD COLUMN "icd_code" varchar(20);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "patient_ref" varchar(50) DEFAULT 'PT-PENDING';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "cash_session_id" uuid;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "type" "service_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "oxygen_saturation" numeric;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "bmi" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "pain_level" numeric;--> statement-breakpoint
ALTER TABLE "triage" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "specialty_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_number" varchar(100);--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "consultation_number" varchar(50);--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "status" varchar(30) DEFAULT 'waiting' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "consultation_type" varchar(50) DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "symptoms" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "symptoms_duration" varchar(100);--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "pain_level" numeric;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "onset_date" timestamp;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "medical_history" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "surgical_history" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "family_history" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "allergies" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "current_medications" text;--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_requests" ADD CONSTRAINT "exam_requests_requested_by_doctors_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_request_id_exam_requests_id_fk" FOREIGN KEY ("exam_request_id") REFERENCES "public"."exam_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hospitalizations" ADD CONSTRAINT "hospitalizations_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_exam_request_id_exam_requests_id_fk" FOREIGN KEY ("exam_request_id") REFERENCES "public"."exam_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_lab_test_id_lab_tests_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."lab_tests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_ordered_by_users_id_fk" FOREIGN KEY ("ordered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_sampled_by_users_id_fk" FOREIGN KEY ("sampled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result_values" ADD CONSTRAINT "lab_result_values_lab_result_id_lab_results_id_fk" FOREIGN KEY ("lab_result_id") REFERENCES "public"."lab_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_result_values" ADD CONSTRAINT "lab_result_values_lab_test_parameter_id_lab_test_parameters_id_fk" FOREIGN KEY ("lab_test_parameter_id") REFERENCES "public"."lab_test_parameters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_lab_order_id_lab_orders_id_fk" FOREIGN KEY ("lab_order_id") REFERENCES "public"."lab_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_test_parameters" ADD CONSTRAINT "lab_test_parameters_lab_test_id_lab_tests_id_fk" FOREIGN KEY ("lab_test_id") REFERENCES "public"."lab_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_tests" ADD CONSTRAINT "lab_tests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_decisions" ADD CONSTRAINT "medical_decisions_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_decisions" ADD CONSTRAINT "medical_decisions_specialist_id_doctors_id_fk" FOREIGN KEY ("specialist_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "exam_requests_visit_idx" ON "exam_requests" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "exam_requests_status_idx" ON "exam_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exam_results_exam_request_idx" ON "exam_results" USING btree ("exam_request_id");--> statement-breakpoint
CREATE INDEX "hospitalizations_visit_idx" ON "hospitalizations" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "hospitalizations_patient_idx" ON "hospitalizations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "hospitalizations_status_idx" ON "hospitalizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_orders_order_number_idx" ON "lab_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "lab_orders_visit_id_idx" ON "lab_orders" USING btree ("visit_id");--> statement-breakpoint
CREATE INDEX "lab_orders_exam_request_id_idx" ON "lab_orders" USING btree ("exam_request_id");--> statement-breakpoint
CREATE INDEX "lab_orders_lab_test_id_idx" ON "lab_orders" USING btree ("lab_test_id");--> statement-breakpoint
CREATE INDEX "lab_orders_status_idx" ON "lab_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lab_orders_patient_id_idx" ON "lab_orders" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "lab_result_values_lab_result_id_idx" ON "lab_result_values" USING btree ("lab_result_id");--> statement-breakpoint
CREATE INDEX "lab_result_values_parameter_id_idx" ON "lab_result_values" USING btree ("lab_test_parameter_id");--> statement-breakpoint
CREATE INDEX "lab_results_lab_order_id_idx" ON "lab_results" USING btree ("lab_order_id");--> statement-breakpoint
CREATE INDEX "lab_results_verified_by_idx" ON "lab_results" USING btree ("verified_by");--> statement-breakpoint
CREATE INDEX "lab_test_parameters_lab_test_id_idx" ON "lab_test_parameters" USING btree ("lab_test_id");--> statement-breakpoint
CREATE INDEX "lab_test_parameters_is_active_idx" ON "lab_test_parameters" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "lab_tests_code_idx" ON "lab_tests" USING btree ("code");--> statement-breakpoint
CREATE INDEX "lab_tests_service_id_idx" ON "lab_tests" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "lab_tests_is_active_idx" ON "lab_tests" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "medical_decisions_visit_idx" ON "medical_decisions" USING btree ("visit_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_cash_session_id_cash_sessions_id_fk" FOREIGN KEY ("cash_session_id") REFERENCES "public"."cash_sessions"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_specialty_id_specialties_id_fk" FOREIGN KEY ("specialty_id") REFERENCES "public"."specialties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_cash_session_id_idx" ON "payments" USING btree ("cash_session_id");--> statement-breakpoint
CREATE INDEX "users_specialty_id_idx" ON "users" USING btree ("specialty_id");--> statement-breakpoint
CREATE INDEX "visits_status_idx" ON "visits" USING btree ("status");--> statement-breakpoint
CREATE INDEX "visits_consultation_number_idx" ON "visits" USING btree ("consultation_number");--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_consultation_number_unique" UNIQUE("consultation_number");