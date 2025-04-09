CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wands" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"core" text NOT NULL,
	"owner_id" text
);
--> statement-breakpoint
ALTER TABLE "wands" ADD CONSTRAINT "wands_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;