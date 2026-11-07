-- DevLoom Row-Level Security (RLS) Policies
-- Secondary safety-net for tenant isolation on Azure Database for PostgreSQL Flexible Server

-- Enable RLS on all user-owned tables
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bugs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "learnings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "github_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agent_usage" ENABLE ROW LEVEL SECURITY;

-- 1. Projects Isolation Policy
CREATE POLICY "projects_user_isolation" ON "projects"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 2. Tags Isolation Policy
CREATE POLICY "tags_user_isolation" ON "tags"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 3. Tasks Isolation Policy
CREATE POLICY "tasks_user_isolation" ON "tasks"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 4. Bugs Isolation Policy
CREATE POLICY "bugs_user_isolation" ON "bugs"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 5. Learnings Isolation Policy
CREATE POLICY "learnings_user_isolation" ON "learnings"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 6. GitHub Links Isolation Policy
CREATE POLICY "github_links_user_isolation" ON "github_links"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

-- 7. Agent Usage Isolation Policy
CREATE POLICY "agent_usage_user_isolation" ON "agent_usage"
  FOR ALL
  USING (user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);
