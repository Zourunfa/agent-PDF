-- 添加密码重置和邮箱验证功能
-- Migration: 0004_add_password_reset_and_email_verification.sql

-- ============================================
-- 1. 为 user_profiles 表添加密码重置和邮箱验证字段
-- ============================================
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS password_reset_token UUID,
ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_verification_token UUID,
ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 2. 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_password_reset_token
  ON public.user_profiles(password_reset_token)
  WHERE password_reset_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verification_token
  ON public.user_profiles(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

-- ============================================
-- 3. 创建函数：记录安全日志
-- ============================================
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_success BOOLEAN DEFAULT true,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_ip_address INET;
  v_user_agent TEXT;
BEGIN
  -- 从当前请求中获取 IP 和 User-Agent
  -- 注意：这需要在应用层传递，这里使用默认值
  v_ip_address := COALESCE(NULL::INET, '0.0.0.0'::INET);
  v_user_agent := COALESCE(NULL::TEXT, 'unknown');

  INSERT INTO public.user_security_log (
    user_id,
    event_type,
    ip_address,
    user_agent,
    success,
    details
  ) VALUES (
    p_user_id,
    p_event_type,
    v_ip_address,
    v_user_agent,
    p_success,
    p_details
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. 创建函数：生成密码重置令牌
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_password_reset_token(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_token UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 生成随机 UUID
  v_token := gen_random_uuid();
  v_expires_at := NOW() + INTERVAL '1 hour';

  -- 更新用户记录
  UPDATE public.user_profiles
  SET
    password_reset_token = v_token,
    reset_expires_at = v_expires_at
  WHERE id = p_user_id;

  -- 记录安全事件
  PERFORM public.log_security_event(
    p_user_id,
    'password_reset_requested',
    true,
    '{"token_type": "password_reset"}'::jsonb
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 创建函数：验证并清除密码重置令牌
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_is_valid BOOLEAN := false;
  v_error TEXT := null;
BEGIN
  -- 查找有效的令牌
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE password_reset_token = p_token
    AND reset_expires_at > NOW()
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    v_is_valid := true;
  ELSE
    -- 检查是否令牌存在但已过期
    SELECT id INTO v_user_id
    FROM public.user_profiles
    WHERE password_reset_token = p_token
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      v_error := 'TOKEN_EXPIRED';
    ELSE
      v_error := 'TOKEN_INVALID';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', v_is_valid,
    'user_id', v_user_id,
    'error', v_error
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 创建函数：生成邮箱验证令牌
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_email_verification_token(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_token UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- 生成随机 UUID
  v_token := gen_random_uuid();
  v_expires_at := NOW() + INTERVAL '24 hours';

  -- 更新用户记录
  UPDATE public.user_profiles
  SET
    email_verification_token = v_token,
    verification_expires_at = v_expires_at
  WHERE id = p_user_id;

  -- 记录安全事件
  PERFORM public.log_security_event(
    p_user_id,
    'email_verification_requested',
    true,
    '{"token_type": "email_verification"}'::jsonb
  );

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 创建函数：验证邮箱令牌
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_email_verification_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_is_valid BOOLEAN := false;
  v_error TEXT := null;
BEGIN
  -- 查找有效的令牌
  SELECT id INTO v_user_id
  FROM public.user_profiles
  WHERE email_verification_token = p_token
    AND verification_expires_at > NOW()
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    v_is_valid := true;

    -- 更新邮箱验证状态
    UPDATE public.user_profiles
    SET
      email_verified = true,
      email_verification_token = null,
      verification_expires_at = null
    WHERE id = v_user_id;

    -- 记录安全事件
    PERFORM public.log_security_event(
      v_user_id,
      'email_verified',
      true,
      '{"method": "token"}'::jsonb
    );
  ELSE
    -- 检查是否令牌存在但已过期
    SELECT id INTO v_user_id
    FROM public.user_profiles
    WHERE email_verification_token = p_token
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      v_error := 'TOKEN_EXPIRED';
    ELSE
      v_error := 'TOKEN_INVALID';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', v_is_valid,
    'user_id', v_user_id,
    'error', v_error
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. 注释
-- ============================================
COMMENT ON COLUMN public.user_profiles.password_reset_token IS '密码重置令牌（UUID）';
COMMENT ON COLUMN public.user_profiles.reset_expires_at IS '密码重置令牌过期时间';
COMMENT ON COLUMN public.user_profiles.email_verification_token IS '邮箱验证令牌（UUID）';
COMMENT ON COLUMN public.user_profiles.verification_expires_at IS '邮箱验证令牌过期时间';
