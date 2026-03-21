-- 删除指定用户的 SQL 脚本
-- 使用方法：将下面的邮箱替换成你要删除的邮箱地址

DO $$
DECLARE
    target_user_id UUID;
    target_email TEXT := 'wangfengaf@gmail.com';  -- 修改这里
BEGIN
    -- 1. 查找用户 ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '未找到邮箱为 % 的用户', target_email;
    END IF;

    -- 2. 删除用户资料及所有相关数据（使用管理员函数）
    PERFORM admin_delete_user_profile(target_user_id);

    -- 3. 删除认证用户记录
    DELETE FROM auth.users WHERE id = target_user_id;

    RAISE NOTICE '成功删除用户：% (ID: %)', target_email, target_user_id;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '删除用户失败：%', SQLERRM;
END $$;
