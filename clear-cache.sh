#!/bin/bash
echo "=== 清理 Next.js 缓存 ==="

# 停止所有 Next.js 进程
echo "1. 停止运行中的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 删除 .next 缓存目录
echo "2. 删除 .next 缓存..."
rm -rf .next

# 删除 node_modules/.cache
echo "3. 删除 node_modules/.cache..."
rm -rf node_modules/.cache

# 清理 Next.js 缓存
echo "4. 运行 Next.js 清理..."
npx next clean 2>/dev/null || true

echo ""
echo "✅ 缓存清理完成！"
echo ""
echo "请运行: npm run dev"
