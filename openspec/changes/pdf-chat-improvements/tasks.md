# PDF 聊天功能优化实施任务

## 1. PDF 删除功能

- [x] 1.1 在 PDFList 组件中添加删除按钮（垃圾桶图标）
- [x] 1.2 添加删除确认对话框（Modal.confirm）
- [x] 1.3 更新 PDFContext.removePDF 方法调用 DELETE API
- [x] 1.4 实现删除成功后刷新列表
- [x] 1.5 添加删除失败错误处理
- [x] 1.6 添加删除中加载状态显示

## 2. 历史对话自动加载

- [x] 2.1 在 ChatContext 中添加 loadMessages 方法
- [x] 2.2 在 ChatInterface 中添加 loadingHistory 状态
- [x] 2.3 实现 activePdfId 变化时自动加载历史对话的 useEffect
- [x] 2.4 添加历史对话加载中的加载状态显示
- [x] 2.5 实现历史消息格式转换（API → ChatMessage）
- [x] 2.6 添加加载失败错误处理

## 3. 对话界面布局优化

- [x] 3.1 移除 AppLayout 中的右侧 Tabs 组件
- [x] 3.2 移除 activeTab 状态管理
- [x] 3.3 移除自动切换到"历史"标签的 useEffect
- [x] 3.4 直接在右侧面板显示 ChatInterface
- [x] 3.5 移除 ConversationHistory 组件的使用

## 4. 测试

- [ ] 4.1 测试 PDF 删除功能（确认、取消、成功、失败）
- [ ] 4.2 测试删除后列表刷新
- [ ] 4.3 测试删除当前选中 PDF 后的状态
- [ ] 4.4 测试选择 PDF 后历史对话自动加载
- [ ] 4.5 测试切换 PDF 时历史对话重新加载
- [ ] 4.6 测试加载失败的处理
- [ ] 4.7 测试历史对话加载后继续发送新消息

## 5. 文档

- [ ] 5.1 更新组件注释
- [ ] 5.2 记录 API 使用说明
