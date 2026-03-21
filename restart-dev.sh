#!/bin/bash
echo "=== 检查是否有运行中的 Next.js 进程 ==="
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "已停止旧的进程" || echo "没有运行中的进程"

echo ""
echo "=== 启动新的开发服务器 ==="
echo "请在新的终端窗口运行: npm run dev"
echo ""
echo "启动后，刷新 /admin/users 页面，应该就能看到用户数据了！"
