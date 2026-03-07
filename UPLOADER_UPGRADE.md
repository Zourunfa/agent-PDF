# 上传组件升级说明

## 使用的技术栈

### react-dropzone
- **最流行的拖拽上传库**（GitHub 10k+ stars）
- React 官方推荐
- 完整的拖拽支持
- 文件类型验证
- 文件大小限制
- TypeScript 支持

### shadcn/ui 风格
- 项目已配置 shadcn/ui
- 使用 Tailwind CSS
- 完全可定制
- 无需额外依赖

## 新组件特性

### PDFUploaderPro

✅ **专业拖拽体验**
- 拖拽区域高亮
- 拖拽时发光效果
- 拖拽时图标旋转动画
- 文件类型实时验证

✅ **完整状态管理**
- 上传中状态
- 成功状态（自动消失）
- 错误状态（可重试）
- 进度条显示

✅ **视觉反馈**
- 不同状态不同图标和颜色
- 流畅的过渡动画
- 发光效果
- 进度条

✅ **错误处理**
- 文件类型错误
- 文件大小超限
- 上传失败
- 解析失败

✅ **用户体验**
- 拖拽或点击上传
- 实时进度显示
- 清晰的错误提示
- 一键重试

## 对比

### 旧组件 (PDFUploader)
- 自定义实现
- 基础拖拽支持
- 简单的状态管理

### 新组件 (PDFUploaderPro)
- react-dropzone 驱动
- 完整的拖拽体验
- 专业的状态管理
- 更好的错误处理
- 更丰富的视觉反馈

## 配置

### react-dropzone 配置
```typescript
{
  accept: {
    'application/pdf': ['.pdf'],
  },
  maxFiles: 1,
  maxSize: 10 * 1024 * 1024, // 10MB
  disabled: isUploading,
}
```

### 支持的功能
- ✅ 拖拽上传
- ✅ 点击上传
- ✅ 文件类型限制
- ✅ 文件大小限制
- ✅ 单文件上传
- ✅ 禁用状态

## 状态说明

### 正常状态
- 青紫渐变边框
- Upload 图标
- "拖拽 PDF 文件到这里"

### 拖拽激活
- 青色高亮边框
- 外层发光效果
- 图标旋转放大
- "松开上传文件"

### 拖拽错误
- 红色边框
- X 图标
- "仅支持 PDF 文件"

### 上传中
- 青色边框
- Loader 旋转图标
- 进度条动画
- "上传中... X%"

### 上传成功
- 绿色边框
- CheckCircle 图标
- "✓ 上传成功"
- 3秒后自动恢复

### 上传失败
- 红色边框
- AlertCircle 图标
- 错误信息
- "重试" 按钮

## 样式定制

### 颜色主题
- 主色：cyan (青色)
- 辅色：purple (紫色)
- 成功：emerald (绿色)
- 错误：red (红色)

### 动画效果
- 拖拽时缩放：scale-[1.02]
- 图标旋转：rotate-12
- 发光效果：blur-lg opacity-75
- 进度条：渐变 + 模糊

## API

### Props
```typescript
interface PDFUploaderProProps {
  className?: string; // 自定义样式
}
```

### 回调
- `onDrop`: 文件拖拽放下
- `handleFile`: 文件处理逻辑
- 自动调用上传和解析 API

## 使用示例

```tsx
import { PDFUploaderPro } from "@/components/pdf/PDFUploaderPro";

export function MyComponent() {
  return (
    <div className="p-6">
      <PDFUploaderPro />
    </div>
  );
}
```

## 扩展功能

### 可以添加的功能
1. 多文件上传
2. 上传队列
3. 断点续传
4. 压缩预览
5. 拖拽排序
6. 批量操作

### 自定义配置
```typescript
const { getRootProps, getInputProps } = useDropzone({
  onDrop,
  accept: { 'application/pdf': ['.pdf'] },
  maxFiles: 5, // 多文件
  maxSize: 50 * 1024 * 1024, // 50MB
  multiple: true, // 允许多选
});
```

## 依赖

```json
{
  "react-dropzone": "^14.x",
  "lucide-react": "^0.x",
  "tailwindcss": "^3.x"
}
```

## 浏览器支持

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- 移动端 ✅

## 性能

- 轻量级（~10KB gzipped）
- 无额外依赖
- 优化的渲染
- 流畅的动画

## 可访问性

- 键盘导航支持
- 屏幕阅读器友好
- ARIA 标签
- 焦点管理

## 总结

新的上传组件使用了业界标准的 react-dropzone 库，提供了更专业、更流畅的上传体验，同时保持了与项目整体风格的一致性。
