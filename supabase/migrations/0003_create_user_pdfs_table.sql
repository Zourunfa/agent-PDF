-- 创建用户PDF表
-- Migration: 0003_create_user_pdfs_table.sql

-- ============================================
-- user_pdfs 表：用户上传的PDF文件
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_pdfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INTEGER,
  storage_path TEXT NOT NULL, -- Vercel Blob path (e.g., users/{userId}/pdfs/{pdfId}.pdf)
  pinecone_index TEXT,
  pinecone_namespace TEXT, -- 使用 user_id 作为 namespace
  upload_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 Row Level Security
ALTER TABLE public.user_pdfs ENABLE ROW LEVEL SECURITY;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_pdfs_user_id ON public.user_pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pdfs_created_at ON public.user_pdfs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_pdfs_pinecone_namespace ON public.user_pdfs(pinecone_namespace);

-- RLS 策略：用户可以查看自己的PDF
CREATE POLICY "Users can view own PDFs"
  ON public.user_pdfs FOR SELECT
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以插入自己的PDF
CREATE POLICY "Users can insert own PDFs"
  ON public.user_pdfs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS 策略：用户可以删除自己的PDF
CREATE POLICY "Users can delete own PDFs"
  ON public.user_pdfs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS 策略：用户可以更新自己的PDF
CREATE POLICY "Users can update own PDFs"
  ON public.user_pdfs FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS 策略：管理员可以查看所有PDF
CREATE POLICY "Admins can view all PDFs"
  ON public.user_pdfs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS 策略：管理员可以删除所有PDF
CREATE POLICY "Admins can delete all PDFs"
  ON public.user_pdfs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 自动更新 last_accessed 的触发器
-- ============================================
CREATE OR REPLACE FUNCTION public.update_pdf_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（当查询PDF时更新 last_accessed）
-- 注意：这个触发器不会自动触发，需要在查询时手动更新
-- 或者通过 API 调用显式更新

-- ============================================
-- 注释
-- ============================================
COMMENT ON TABLE public.user_pdfs IS '用户上传的PDF文件表';
COMMENT ON COLUMN public.user_pdfs.storage_path IS '文件在 Vercel Blob 中的存储路径';
COMMENT ON COLUMN public.user_pdfs.pinecone_namespace IS 'Pinecone 向量命名空间，使用 user_id';
COMMENT ON COLUMN public.user_pdfs.file_size IS '文件大小（字节）';
