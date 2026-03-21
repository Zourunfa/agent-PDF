-- 禁用用户同步触发器
-- Migration: 0010_disable_user_sync_triggers.sql

-- 临时禁用触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 验证触发器已删除
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'auth.users';
