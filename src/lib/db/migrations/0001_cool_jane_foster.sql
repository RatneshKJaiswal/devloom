CREATE TYPE "public"."sdlc_phase" AS ENUM('planning', 'design', 'development', 'testing', 'release', 'maintenance');--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_phase_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"phase" "sdlc_phase" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "current_phase" "sdlc_phase" DEFAULT 'planning' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "start_date" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_date" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "phase" "sdlc_phase";--> statement-breakpoint
ALTER TABLE "bugs" ADD COLUMN "phase" "sdlc_phase";--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phase_history" ADD CONSTRAINT "project_phase_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phase_history" ADD CONSTRAINT "project_phase_history_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_milestones_user_project" ON "project_milestones" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_phase_history_user_project" ON "project_phase_history" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_user_proj_due_status" ON "tasks" USING btree ("user_id","project_id","status","due_date");