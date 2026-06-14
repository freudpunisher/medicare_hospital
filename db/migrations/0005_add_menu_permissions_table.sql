CREATE TABLE IF NOT EXISTS "menu_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group" varchar(255) NOT NULL,
	"roles" text DEFAULT '*' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menu_permissions_group_unique" UNIQUE("group")
);
--> statement-breakpoint
CREATE INDEX "menu_permissions_group_idx" ON "menu_permissions" USING btree ("group");
