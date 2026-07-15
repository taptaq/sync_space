-- SyncSpace 数据库 Schema
-- 在 Supabase Dashboard → SQL Editor 中执行此文件
--
-- 启用匿名登录：Dashboard → Authentication → Providers → Anonymous → 开启

-- ============ 用户设置（单行/用户） ============
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY DEFAULT auth.uid(),
  onboarded BOOLEAN DEFAULT false,
  neuro_type TEXT DEFAULT 'asd',
  adhd_subtype TEXT DEFAULT 'unknown',
  app_mode TEXT DEFAULT 'self',
  collaborator TEXT DEFAULT 'self',
  qwen_enabled BOOLEAN DEFAULT false,
  low_sensory_mode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'zh',
  sound_scape_type TEXT,
  sound_scape_volume REAL DEFAULT 0.3,
  sound_scape_enabled BOOLEAN DEFAULT false,
  observation JSONB,
  connection_preferences TEXT[] DEFAULT '{}',
  trait_profile JSONB,
  current_weather JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 签到记录 ============
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  axis_sensory REAL NOT NULL,
  axis_social REAL NOT NULL,
  axis_predictability REAL NOT NULL,
  hesitation_ms INTEGER NOT NULL,
  checkin_at TIMESTAMPTZ NOT NULL,
  response_delay_minutes INTEGER NOT NULL,
  weather_snapshot JSONB NOT NULL,
  note TEXT,
  early_signals TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 协议 ============
CREATE TABLE IF NOT EXISTS protocols (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  trigger JSONB NOT NULL,
  action JSONB NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  phases TEXT[] DEFAULT '{}',
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 协议执行记录 ============
CREATE TABLE IF NOT EXISTS protocol_executions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  protocol_id TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL,
  action_taken TEXT NOT NULL,
  duration_actual_minutes INTEGER NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 崩溃标记 ============
CREATE TABLE IF NOT EXISTS crash_marks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  marked_at TIMESTAMPTZ NOT NULL,
  voice_text TEXT,
  raw_text TEXT,
  ai_interpretation JSONB,
  weather_snapshot JSONB,
  reviewed BOOLEAN DEFAULT false,
  crash_type TEXT,
  trigger_cues JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 个人规则 ============
CREATE TABLE IF NOT EXISTS personal_rules (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  signal TEXT NOT NULL,
  understanding TEXT NOT NULL,
  support TEXT NOT NULL,
  evidence_count INTEGER DEFAULT 0,
  last_feedback TEXT,
  last_feedback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 连接时刻 ============
CREATE TABLE IF NOT EXISTS connection_moments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  rule_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ 捕获项（ADHD 外部记忆） ============
CREATE TABLE IF NOT EXISTS capture_items (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  text TEXT NOT NULL,
  status TEXT DEFAULT 'inbox',
  created_at TIMESTAMPTZ DEFAULT now(),
  focus_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============ RLS 行级安全 ============
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crash_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capture_items ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能 CRUD 自己的数据
CREATE POLICY "own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_checkins" ON checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_protocols" ON protocols FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_executions" ON protocol_executions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_crash_marks" ON crash_marks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_personal_rules" ON personal_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_connection_moments" ON connection_moments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_capture_items" ON capture_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_personal_rules_updated_at BEFORE UPDATE ON personal_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
