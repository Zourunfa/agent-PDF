#!/bin/bash

echo "=========================================="
echo "   清理 Next.js 所有缓存和临时文件"
echo "=========================================="
echo ""

# 1. 停止所有 Next.js 相关进程
echo "🛑 [1/6] 停止运行中的进程..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ 已停止 3000 端口进程" || echo "   - 没有运行中的进程"
pkill -f "next dev" 2>/dev/null && echo "   ✓ 已停止 Next.js 进程" || echo "   - 没有 Next.js 进程"

# 2. 删除 .next 目录
echo ""
echo "🗑️  [2/6] 删除 .next 构建缓存..."
if [ -d ".next" ]; then
  rm -rf .next
  echo "   ✓ 已删除 .next 目录"
else
  echo "   - .next 目录不存在"
fi

# 3. 删除 node_modules/.cache
echo ""
echo "🗑️  [3/6] 删除 node_modules 缓存..."
if [ -d "node_modules/.cache" ]; then
  rm -rf node_modules/.cache
  echo "   ✓ 已删除 node_modules/.cache"
else
  echo "   - node_modules/.cache 不存在"
fi

# 4. 清理 Next.js 内部缓存
echo ""
echo "🧹 [4/6] 清理 Next.js 内部缓存..."
npx next clean 2>/dev/null && echo "   ✓ Next.js clean 完成" || echo "   - 跳过"

# 5. 删除 .turbo 目录（如果使用 Turbopack）
echo ""
echo "🗑️  [5/6] 删除 Turbopack 缓存..."
if [ -d ".turbo" ]; then
  rm -rf .turbo
  echo "   ✓ 已删除 .turbo 目录"
else
  echo "   - .turbo 目录不存在"
fi

# 6. 删除临时日志文件
echo ""
echo "🗑️  [6/6] 删除临时日志..."
rm -f /tmp/nextjs-dev.log 2>/dev/null && echo "   ✓ 已删除临时日志" || echo "   - 没有临时日志"

echo ""
echo "=========================================="
echo "   ✅ 缓存清理完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "  npm run dev"
echo ""
