-- Fix RLS Infinite Recursion
-- Migration: 0005_fix_rls_infinite_recursion.sql

-- 删除有问题的管理员策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Admins can view all security logs" ON public.user_security_log;

-- 创建一个 SECURITY DEFINER 函数来检查管理员角色
-- 这个函数绕过 RLS，避免循环依赖
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 重新创建管理员策略，使用函数而不是直接查询
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can view all sessions"
  ON public.user_sessions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all security logs"
  ON public.user_security_log FOR SELECT
  USING (public.is_admin());

-- 重新创建普通用户策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own security logs" ON public.user_security_log;
CREATE POLICY "Users can view own security logs"
  ON public.user_security_log FOR SELECT
  USING (auth.uid() = user_id);

-- 添加注释
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user is admin (bypasses RLS)';
