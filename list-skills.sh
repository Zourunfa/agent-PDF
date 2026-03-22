#!/bin/bash

echo "🔍 Claude Code Skills 查看器"
echo "================================"
echo ""

# 本地 skills
echo "📁 本地 Skills (.claude/skills/):"
echo "--------------------------------"
if [ -d ".claude/skills" ]; then
  for skill in .claude/skills/*.md; do
    if [ -f "$skill" ]; then
      name=$(basename "$skill" .md)
      echo "  • $name"
    fi
  done
else
  echo "  (无本地 skills)"
fi
echo ""

# Marketplace skills
echo "🛒 Marketplace Skills:"
echo "----------------------"
MARKETPLACE_DIR="$HOME/.claude/plugins/marketplaces/claude-code-skills/plugins"
if [ -d "$MARKETPLACE_DIR" ]; then
  for plugin in "$MARKETPLACE_DIR"/*/; do
    if [ -d "$plugin" ]; then
      name=$(basename "$plugin")
      echo "  • $name"
    fi
  done
else
  echo "  (无 marketplace skills)"
fi
echo ""

# 缓存的 skills
echo "💾 缓存的 Skills:"
echo "----------------"
CACHE_DIR="$HOME/.claude/plugins/cache/claude-code-skills"
if [ -d "$CACHE_DIR" ]; then
  for cached in "$CACHE_DIR"/*/; do
    if [ -d "$cached" ]; then
      version=$(basename "$cached")
      plugin=$(echo "$cached" | sed 's|.*/\([^/]*\)/.*|\1|')
      echo "  • $plugin ($version)"
    fi
  done
else
  echo "  (无缓存 skills)"
fi
echo ""

echo "💡 提示: 运行 /reload-plugins 激活新安装的 skills"
