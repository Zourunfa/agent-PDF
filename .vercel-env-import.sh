#!/bin/bash
# Vercel 环境变量导入脚本
# 使用方法: vercel link <your-project> && bash .vercel-env-import.sh

echo "正在导入 Vercel 环境变量..."

# Supabase 配置
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://jgsxmiojijjjpvbfndvn.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3htaW9qaWpqanB2YmZuZHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODI5NzIsImV4cCI6MjA4ODY1ODk3Mn0.n8ZaSzQDH-LVPB2Y7j6mv4AT0iwuCUE_riP4jowsnts"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnc3htaW9qaWpqanB2YmZuZHZuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA4Mjk3MiwiZXhwIjoyMDg4NjU4OTcyfQ.czbJkR1r-QnvaBR1WV3SkeP88379ANf9fA9RUE3dNEs"

# Vercel Blob
vercel env add BLOB_READ_WRITE_TOKEN production <<< "vercel_blob_rw_x69RiVTgzwT9VJJb_hJxkkutDq1B65ZRpG3LexoV7BoE05k"

# Qwen API
vercel env add QWEN_API_KEY production <<< "sk-d2705e3b0ddb48e2a0fd26fbcd1e1535"
vercel env add QWEN_MODEL production <<< "qwen-turbo"
vercel env add QWEN_EMBEDDING_MODEL production <<< "text-embedding-v2"

# Pinecone
vercel env add PINECONE_API_KEY production <<< "pcsk_3p49Ja_Pek2Y9hbEMAMadkneGZXGUDJpTwPpzbcyXJhfkAccECZfH3p4B6x3JrEQAkQTe4"
vercel env add PINECONE_INDEX_NAME production <<< "pdf-chat"

# Email 配置
vercel env add EMAIL_SERVICE production <<< "gmail"
vercel env add EMAIL_USER production <<< "wangfengaf@gmail.com"
vercel env add EMAIL_PASSWORD production <<< "anfx tsad txpe nogn"

# Admin 配置
vercel env add ADMIN_USERNAME production <<< "admin"
vercel env add ADMIN_PASSWORD production <<< "aa123321"

echo "✅ 环境变量导入完成！"
echo "⚠️  请记得手动设置 NEXT_PUBLIC_APP_URL 为你的实际域名"
