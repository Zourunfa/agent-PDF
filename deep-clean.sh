#!/bin/bash

echo "========================================"
echo "   深度清理 Next.js 所有缓存"
echo "========================================"
echo ""

# 1. 停止所有 Node/Next.js 进程
echo "🛑 [1/7] 停止所有相关进程..."
pkill -9 -f "node" 2>/dev/null && echo "   ✓ 已停止 Node 进程" || echo "   - 没有 Node 进程"
pkill -9 -f "next" 2>/dev/null && echo "   ✓ 已停止 Next 进程" || echo "   - 没有 Next 进程"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ 已释放 3000 端口" || echo "   - 端口未占用"

sleep 2

# 2. 删除所有缓存目录
echo ""
echo "🗑️  [2/7] 删除构建缓存..."
rm -rf .next && echo "   ✓ 已删除 .next" || echo "   - .next 不存在"

echo ""
echo "🗑️  [3/7] 删除 Turbopack 缓存..."
rm -rf .turbo && echo "   ✓ 已删除 .turbo" || echo "   - .turbo 不存在"

echo ""
echo "🗑️  [4/7] 删除 node_modules 缓存..."
rm -rf node_modules/.cache && echo "   ✓ 已删除 node_modules/.cache" || echo "   - node_modules/.cache 不存在"

# 5. 删除 Next.js 全局缓存（可选）
echo ""
echo "🗑️  [5/7] 删除 Next.js 全局缓存..."
rm -rf ~/.next-cache 2>/dev/null && echo "   ✓ 已删除全局缓存" || echo "   - 全局缓存不存在"

# 6. 清理 npm 缓存（可选，速度慢）
echo ""
echo "🗑️  [6/7] 验证环境变量..."
if [ -f ".env.local" ]; then
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        echo "   ✓ .env.local 存在且包含 SUPABASE_SERVICE_ROLE_KEY"
    else
        echo "   ❌ .env.local 缺少 SUPABASE_SERVICE_ROLE_KEY"
    fi
else
    echo "   ❌ .env.local 不存在"
fi

# 7. 验证清理结果
echo ""
echo "✅ [7/7] 验证清理结果..."
lsof -ti:3000 >/dev/null 2>&1 && echo "   ❌ 端口 3000 仍被占用" || echo "   ✅ 端口 3000 已释放"
ls .next >/dev/null 2>&1 && echo "   ❌ .next 仍存在" || echo "   ✅ .next 已清理"

echo ""
echo "========================================"
echo "   ✅ 深度清理完成！"
echo "========================================"
echo ""
echo "现在请运行："
echo "  npm run dev"
echo ""
