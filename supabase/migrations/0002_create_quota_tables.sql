-- 创建配额管理表
-- Migration: 0002_create_quota_tables.sql

-- ============================================
-- 1. quota_definitions 表：配额定义
-- ============================================
CREATE TABLE IF NOT EXISTS public.quota_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  unit TEXT, -- 'count', 'bytes', 'vectors'
  default_limit INTEGER, -- 免费用户默认值
  premium_limit INTEGER, -- 高级用户默认值
  admin_limit INTEGER, -- 管理员默认值（NULL 表示无限）
  reset_period TEXT, -- 'daily', 'monthly', 'never'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配额定义
INSERT INTO public.quota_definitions (name, display_name, description, unit, default_limit, premium_limit, admin_limit, reset_period) VALUES
('pdf_uploads_daily', 'PDF上传（每日）', '每天可以上传的PDF数量', 'count', 10, 100, NULL, 'daily'),
('ai_calls_daily', 'AI调用（每日）', '每天可以发起的AI对话次数', 'count', 100, 1000, NULL, 'daily'),
('storage_total', '存储空间（总计）', '所有PDF文件的总大小限制', 'bytes', 1073741824, 10737418240, NULL, 'never'),
('vector_storage', '向量存储', 'Pinecone向量数量限制', 'vectors', 10000, 1000000, NULL, 'never'),
('pdf_retention_days', 'PDF保留时长', 'PDF文件保留天数（-1表示永久）', 'days', 30, -1, -1, 'never')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. user_quotas 表：用户配额（自定义）
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quota_id UUID REFERENCES quota_definitions(id) NOT NULL,
  limit_value INTEGER, -- 覆盖默认值，NULL则使用角色默认值
  expires_at TIMESTAMP WITH TIME ZONE, -- 临时配额过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_id)
);

-- 启用 Row Level Security
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_quota_id ON public.user_quotas(quota_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_expires_at ON public.user_quotas(expires_at);

-- RLS 策略：用户可以查看自己的配额
CREATE POLICY "Users can view own quotas"
  ON public.user_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：管理员可以查看所有配额
CREATE POLICY "Admins can view all quotas"
  ON public.user_quotas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS 策略：管理员可以插入/更新配额
CREATE POLICY "Admins can manage quotas"
  ON public.user_quotas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 3. quota_usage 表：配额使用记录
-- ============================================
CREATE TABLE IF NOT EXISTS public.quota_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quota_id UUID REFERENCES quota_definitions(id) NOT NULL,
  usage_date DATE NOT NULL, -- 用于每日重置的配额
  usage_count INTEGER DEFAULT 0, -- 使用次数/数量
  usage_value BIGINT, -- 使用值（如字节数）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quota_id, usage_date)
);

-- 启用 Row Level Security
ALTER TABLE public.quota_usage ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_quota_date ON public.quota_usage(user_id, quota_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_quota_usage_date ON public.quota_usage(usage_date);

-- RLS 策略：用户可以查看自己的使用记录
CREATE POLICY "Users can view own usage"
  ON public.quota_usage FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：管理员可以查看所有使用记录
CREATE POLICY "Admins can view all usage"
  ON public.quota_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS 策略：服务端可以插入/更新使用记录（通过 service role）
CREATE POLICY "Service can manage usage"
  ON public.quota_usage FOR ALL
  USING (true); -- 注意：这需要通过 service role key 调用

-- ============================================
-- 4. quota_operations 表：配额操作日志
-- ============================================
CREATE TABLE IF NOT EXISTS public.quota_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  operation_type TEXT NOT NULL, -- 'upload_pdf', 'ai_chat', 'delete_pdf'
  quota_id UUID REFERENCES quota_definitions(id),
  amount INTEGER, -- 影响的配额数量
  status TEXT, -- 'allowed', 'denied', 'ignored'
  metadata JSONB, -- 额外信息（如pdf_id, file_size）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quota_operations_user_id ON public.quota_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_operations_created_at ON public.quota_operations(created_at);
CREATE INDEX IF NOT EXISTS idx_quota_operations_operation_type ON public.quota_operations(operation_type);

-- 启用 Row Level Security
ALTER TABLE public.quota_operations ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的操作日志
CREATE POLICY "Users can view own operations"
  ON public.quota_operations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：管理员可以查看所有操作日志
CREATE POLICY "Admins can view all operations"
  ON public.quota_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 5. 自动更新 updated_at 的触发器
-- ============================================
-- 为 user_quotas 表创建触发器
CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON public.user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 为 quota_usage 表创建触发器
CREATE TRIGGER update_quota_usage_updated_at
  BEFORE UPDATE ON public.quota_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 6. 注释
-- ============================================
COMMENT ON TABLE public.quota_definitions IS '配额定义表，定义各种配额类型和默认值';
COMMENT ON TABLE public.user_quotas IS '用户配额表，存储用户自定义配额';
COMMENT ON TABLE public.quota_usage IS '配额使用记录表，追踪用户配额使用情况';
COMMENT ON TABLE public.quota_operations IS '配额操作日志表，记录所有配额相关操作';
