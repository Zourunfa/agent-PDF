-- 添加 PDF 解析相关列
-- Migration: 0007_add_pdf_parse_columns.sql

-- 添加解析状态列
ALTER TABLE public.user_pdfs
ADD COLUMN IF NOT EXISTS parse_status TEXT DEFAULT 'pending'
CHECK (parse_status IN ('pending', 'parsing', 'completed', 'failed'));

-- 添加文本内容列
ALTER TABLE public.user_pdfs
ADD COLUMN IF NOT EXISTS text_content TEXT;

-- 添加错误消息列
ALTER TABLE public.user_pdfs
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 添加解析时间列
ALTER TABLE public.user_pdfs
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMP WITH TIME ZONE;

-- 创建索引以加快查询
CREATE INDEX IF NOT EXISTS idx_user_pdfs_parse_status
ON public.user_pdfs(parse_status);

-- 添加注释
COMMENT ON COLUMN public.user_pdfs.parse_status IS 'PDF 解析状态: pending(待解析), parsing(解析中), completed(已完成), failed(失败)';
COMMENT ON COLUMN public.user_pdfs.text_content IS 'PDF 提取的文本内容';
COMMENT ON COLUMN public.user_pdfs.error_message IS '解析失败时的错误信息';
COMMENT ON COLUMN public.user_pdfs.parsed_at IS 'PDF 解析完成时间';
