-- 创建管理员删除用户函数
-- Migration: 0009_admin_delete_user_function.sql

-- 创建管理员删除用户的函数（绕过 RLS）
CREATE OR REPLACE FUNCTION admin_delete_user_profile(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
    result JSONB;
BEGIN
    -- 删除配额操作日志
    DELETE FROM public.quota_operations WHERE user_id = target_user_id;

    -- 删除配额使用记录
    DELETE FROM public.quota_usage WHERE user_id = target_user_id;

    -- 删除用户配额
    DELETE FROM public.user_quotas WHERE user_id = target_user_id;

    -- 删除用户会话
    DELETE FROM public.user_sessions WHERE user_id = target_user_id;

    -- 删除安全日志
    DELETE FROM public.user_security_log WHERE user_id = target_user_id;

    -- 删除对话消息
    DELETE FROM public.conversation_messages WHERE user_id = target_user_id;

    -- 删除PDF对话
    DELETE FROM public.pdf_conversations WHERE user_id = target_user_id;

    -- 删除PDF记录
    DELETE FROM public.user_pdfs WHERE user_id = target_user_id;

    -- 删除用户资料
    DELETE FROM public.user_profiles WHERE id = target_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    result := jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'user_id', target_user_id
    );

    RETURN result;
END;
$$;

-- 授权给 authenticated 用户（只有管理员会调用这个函数）
GRANT EXECUTE ON FUNCTION admin_delete_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_profile(UUID) TO service_role;

-- 添加注释
COMMENT ON FUNCTION admin_delete_user_profile IS '管理员删除用户及其所有相关数据（绕过 RLS）';
