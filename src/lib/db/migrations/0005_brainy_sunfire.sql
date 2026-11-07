CREATE TABLE "task_bugs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"bug_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organization" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "task_number" integer;--> statement-breakpoint
ALTER TABLE "bugs" ADD COLUMN "bug_number" integer;--> statement-breakpoint
ALTER TABLE "task_bugs" ADD CONSTRAINT "task_bugs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_bugs" ADD CONSTRAINT "task_bugs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_bugs" ADD CONSTRAINT "task_bugs_bug_id_bugs_id_fk" FOREIGN KEY ("bug_id") REFERENCES "public"."bugs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_access_tokens" ADD CONSTRAINT "personal_access_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_task_bugs_unique" ON "task_bugs" USING btree ("task_id","bug_id");--> statement-breakpoint
CREATE INDEX "idx_task_bugs_user" ON "task_bugs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_task_bugs_task" ON "task_bugs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_bugs_bug" ON "task_bugs" USING btree ("bug_id");