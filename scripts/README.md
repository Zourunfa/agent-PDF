# Pinecone 索引创建脚本使用说明

## 步骤 1: 获取 Pinecone API Key

1. 访问 [Pinecone 控制台](https://app.pinecone.io/)
2. 登录你的账号
3. 点击左侧菜单 "API Keys"
4. 复制你的 API Key（格式类似：`pcsk_xxxxx` 或 `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`）

## 步骤 2: 配置环境变量

编辑 `.env.local` 文件，将 `PINECONE_API_KEY` 替换为你的真实 API Key：

```env
# 替换这一行
PINECONE_API_KEY=your-pinecone-api-key-here

# 改成（示例）
PINECONE_API_KEY=pcsk_1A2B3C_xxxxxxxxxxxxxxxxxxxxx
```

## 步骤 3: 运行创建脚本

```bash
node scripts/create-pinecone-index.js
```

## 预期输出

成功时：
```
🚀 开始创建 Pinecone 索引...

✓ API Key 已配置
✓ API Key 前缀: pcsk_1A2B3...
✓ Pinecone 客户端已初始化

📋 索引配置:
   名称: pdf-chat
   维度: 1536
   度量: cosine
   云服务: aws
   区域: us-east-1

🔍 检查索引是否已存在...
📦 正在创建索引 "pdf-chat"...

✅ 索引创建成功！

⏳ 等待索引初始化（通常需要 1-2 分钟）...
⏳ 索引初始化中... (1/30)
⏳ 索引初始化中... (2/30)
...

✅ 索引已就绪！

🎉 完成！现在可以使用 Pinecone 了

下一步:
1. 确保 .env.local 中有以下配置:
   PINECONE_API_KEY=your-api-key
   PINECONE_INDEX_NAME=pdf-chat
2. 启动应用: npm run dev
3. 上传 PDF 测试
```

## 常见错误

### 错误 1: "未找到 PINECONE_API_KEY"

**原因**: `.env.local` 中没有配置 API Key

**解决**: 
1. 检查 `.env.local` 文件
2. 确保有 `PINECONE_API_KEY=你的密钥`
3. 确保没有多余的空格或引号

### 错误 2: "API Key 无效"

**原因**: API Key 错误或已过期

**解决**:
1. 重新从 Pinecone 控制台复制 API Key
2. 确保复制完整（没有多余空格）
3. 检查 API Key 是否被撤销

### 错误 3: "索引已存在"

**原因**: 索引已经创建过了

**解决**:
- 如果维度正确（1536），可以直接使用
- 如果维度错误，需要在 Pinecone 控制台删除后重新创建

### 错误 4: "已达到免费版限制"

**原因**: 免费版只能创建 1 个索引

**解决**:
1. 在 Pinecone 控制台删除现有索引
2. 或升级到付费版

## 验证索引

创建成功后，可以在 Pinecone 控制台查看：

1. 访问 [Pinecone 控制台](https://app.pinecone.io/)
2. 点击 "Indexes"
3. 应该看到 `pdf-chat` 索引
4. 检查配置：
   - Dimension: 1536 ✓
   - Metric: cosine ✓
   - Status: Ready ✓

## 下一步

索引创建成功后：

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 上传一个 PDF 文件

3. 查看日志，应该看到：
   ```
   [Pinecone] Storing 15 vectors for PDF: abc-123
   [Pinecone] ✓ Successfully stored 15 vectors
   ```

4. 提问测试，应该看到：
   ```
   [Pinecone] Searching for "..." in PDF: abc-123
   [Pinecone] ✓ Found 4 results
   ```

## 故障排查

如果遇到问题，运行测试脚本：

```bash
node scripts/test-pinecone.js
```

（需要先创建这个测试脚本）
