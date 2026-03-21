-- 临时方案：手动删除指定用户的所有关联数据
-- 将 'b969a004-032c-4486-b695-dd68d725b593' 替换为要删除的用户 ID

-- 1. 删除对话消息
DELETE FROM public.conversation_messages
WHERE user_id = 'b969a004-032c-4486-b695-dd68d725b593';

-- 2. 删除对话记录
DELETE FROM public.pdf_conversations
WHERE user_id = 'b969a004-032c-4486-b695-dd68d725b593';

-- 3. 删除 PDF 文件
DELETE FROM public.user_pdfs
WHERE user_id = 'b969a004-032c-4486-b695-dd68d725b593';

-- 4. 删除用户资料（如果存在）
DELETE FROM public.user_profiles
WHERE id = 'b969a004-032c-4486-b695-dd68d725b593';

-- 5. 现在可以删除用户了
-- (在 Supabase Dashboard 的 Authentication 页面中操作)
