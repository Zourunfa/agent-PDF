-- 添加级联删除：删除用户时自动删除其 PDF 文件
-- Migration: 0008_add_cascade_delete_user.sql

-- 1. 先删除现有的外键约束
ALTER TABLE public.user_pdfs
DROP CONSTRAINT IF EXISTS user_pdfs_user_id_fkey;

-- 2. 重新创建外键约束，添加 ON DELETE CASCADE
ALTER TABLE public.user_pdfs
ADD CONSTRAINT user_pdfs_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. 对其他可能引用 users 的表做同样处理
-- 检查并更新 pdf_conversations 表（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'pdf_conversations'
        AND constraint_name = 'pdf_conversations_user_id_fkey'
    ) THEN
        ALTER TABLE public.pdf_conversations
        DROP CONSTRAINT IF EXISTS pdf_conversations_user_id_fkey;

        ALTER TABLE public.pdf_conversations
        ADD CONSTRAINT pdf_conversations_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. 对 conversation_messages 表做同样处理
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'conversation_messages'
        AND constraint_name = 'conversation_messages_user_id_fkey'
    ) THEN
        ALTER TABLE public.conversation_messages
        DROP CONSTRAINT IF EXISTS conversation_messages_user_id_fkey;

        ALTER TABLE public.conversation_messages
        ADD CONSTRAINT conversation_messages_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. 对 user_profiles 表做同样处理
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'user_profiles'
        AND constraint_name = 'user_profiles_id_fkey'
    ) THEN
        ALTER TABLE public.user_profiles
        DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

        ALTER TABLE public.user_profiles
        ADD CONSTRAINT user_profiles_id_fkey
        FOREIGN KEY (id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 添加注释
COMMENT ON CONSTRAINT user_pdfs_user_id_fkey ON public.user_pdfs IS '删除用户时自动删除其 PDF 文件';
