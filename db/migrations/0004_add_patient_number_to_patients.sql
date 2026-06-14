ALTER TABLE "insurances" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "insurances" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "patient_number" serial NOT NULL;