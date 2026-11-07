ALTER TABLE "tasks" ADD COLUMN "start_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;