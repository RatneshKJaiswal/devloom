-- DevLoom Row-Level Security (RLS) Policies
-- Secondary safety-net for tenant isolation on Azure Database for PostgreSQL Flexible Server

-- Enable RLS on all user-owned tables
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_phase_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_milestones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "task_dependencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bugs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learnings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "github_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_usage" ENABLE ROW LEVEL SECURITY;

-- 1. Projects Isolation Policy
CREATE POLICY "projects_user_isolation" ON "projects"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 2. Project Phase History Isolation Policy
CREATE POLICY "project_phase_history_user_isolation" ON "project_phase_history"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 3. Project Milestones Isolation Policy
CREATE POLICY "project_milestones_user_isolation" ON "project_milestones"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 4. Tags Isolation Policy
CREATE POLICY "tags_user_isolation" ON "tags"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 5. Tasks Isolation Policy
CREATE POLICY "tasks_user_isolation" ON "tasks"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 6. Task Dependencies Isolation Policy
CREATE POLICY "task_dependencies_user_isolation" ON "task_dependencies"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 7. Bugs Isolation Policy
CREATE POLICY "bugs_user_isolation" ON "bugs"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 8. Learnings Isolation Policy
CREATE POLICY "learnings_user_isolation" ON "learnings"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 9. GitHub Links Isolation Policy
CREATE POLICY "github_links_user_isolation" ON "github_links"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 10. Agent Usage Isolation Policy
CREATE POLICY "agent_usage_user_isolation" ON "agent_usage"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
