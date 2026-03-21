#!/bin/bash

echo "=== 修复 ChunkLoadError ==="

# 1. 停止开发服务器
echo "1. 停止服务器..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
pkill -9 -f "next" 2>/dev/null

# 2. 清理所有缓存
echo "2. 清理缓存..."
rm -rf .next .turbo node_modules/.cache

# 3. 清理浏览器缓存提示
echo ""
echo "✅ 缓存已清理！"
echo ""
echo "接下来："
echo "1. 在浏览器中按 Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows) 硬刷新"
echo "2. 或者清除浏览器缓存"
echo "3. 然后运行: npm run dev"
