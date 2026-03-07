# PDF AI Chat - Design System

> 基于 UI/UX Pro Max Skill 生成的专业设计系统

## 项目信息

- **项目名称**: PDF AI Chat
- **类型**: Micro SaaS / Document Analysis
- **生成日期**: 2026-03-07
- **设计风格**: Glassmorphism + Vibrant Block-based

## 设计原则

### 核心风格
- **Glassmorphism**: 毛玻璃效果，现代感强
- **Vibrant & Block-based**: 活力色彩，块状布局
- **Professional**: 专业、清晰、易用

### 关键特性
- 大间距设计 (48px+ gaps)
- 平滑过渡动画 (200-300ms)
- 高对比度文本 (4.5:1 minimum)
- 响应式设计 (375px, 768px, 1024px, 1440px)
- 可访问性优先 (WCAG AA+)

## 颜色系统

### 主色调

| 用途 | 颜色 | Hex | Tailwind |
|------|------|-----|----------|
| Primary | Indigo | `#6366F1` | `indigo-500` |
| Secondary | Light Indigo | `#818CF8` | `indigo-400` |
| CTA/Accent | Emerald | `#10B981` | `emerald-500` |
| Background | Light Purple | `#F5F3FF` | Custom |
| Text | Deep Indigo | `#1E1B4B` | Custom |

### 语义色彩

- **Success**: Emerald (`#10B981`)
- **Error**: Red (`#EF4444`)
- **Warning**: Amber (`#F59E0B`)
- **Info**: Blue (`#3B82F6`)

## 字体系统

### 字体家族
- **Primary**: Plus Jakarta Sans
- **Weights**: 300, 400, 500, 600, 700, 800
- **Google Fonts**: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

### 字体大小

| 用途 | Size | Line Height |
|------|------|-------------|
| H1 | 1.875rem (30px) | 2.25rem |
| H2 | 1.5rem (24px) | 2rem |
| H3 | 1.25rem (20px) | 1.75rem |
| Body | 0.875rem (14px) | 1.5rem |
| Small | 0.75rem (12px) | 1.25rem |
| Tiny | 0.625rem (10px) | 1rem |

## 间距系统

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps |
| sm | 8px | Icon gaps |
| md | 16px | Standard padding |
| lg | 24px | Section padding |
| xl | 32px | Large gaps |
| 2xl | 48px | Section margins |
| 3xl | 64px | Hero padding |

## 组件规范

### Glassmorphism Cards

```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
}

.glass-card-strong {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.15);
}
```

### Buttons

#### Primary Button
- Background: Emerald gradient
- Text: White
- Padding: 12px 24px
- Border Radius: 12px
- Hover: Shadow + Lift (-2px)
- Transition: 200ms ease-out

#### Secondary Button
- Background: Transparent
- Border: 2px Indigo
- Text: Indigo
- Hover: Light background

### Inputs

- Padding: 12px 16px
- Border: 2px Indigo-200
- Border Radius: 16px
- Focus: Border Indigo-400 + Shadow
- Transition: 200ms

### Shadows

| Level | Value | Usage |
|-------|-------|-------|
| sm | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| md | `0 4px 6px rgba(0,0,0,0.1)` | Cards |
| lg | `0 10px 15px rgba(0,0,0,0.1)` | Modals |
| xl | `0 20px 25px rgba(0,0,0,0.15)` | Hero |

## 动画规范

### 过渡时间
- **Fast**: 150ms (hover states)
- **Normal**: 200-300ms (standard transitions)
- **Slow**: 500ms (complex animations)

### 缓动函数
- **Enter**: ease-out
- **Exit**: ease-in
- **Both**: ease-in-out

### 可访问性
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 图标系统

### 图标库
- **Primary**: Lucide React
- **Size**: 16px (h-4 w-4), 20px (h-5 w-5), 24px (h-6 w-6)

### 使用规则
- ✅ 使用 SVG 图标 (Lucide, Heroicons)
- ❌ 不使用 Emoji 作为图标
- ✅ 保持图标大小一致
- ✅ 使用语义化的图标

## 交互规范

### Hover States
- 所有可点击元素必须有 `cursor-pointer`
- 提供视觉反馈 (颜色、阴影、位移)
- 过渡时间: 150-300ms
- 避免布局偏移

### Focus States
- 可见的焦点指示器
- 使用 `ring` 样式
- 颜色: Indigo-500
- 宽度: 2-4px

### Loading States
- 使用 Spinner 或 Skeleton
- 提供进度反馈
- 禁用交互元素

## 响应式设计

### 断点

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Mobile | 375px | Small phones |
| Tablet | 768px | Tablets |
| Desktop | 1024px | Small desktops |
| Large | 1440px | Large screens |

### 布局规则
- 移动优先设计
- 流式布局
- 灵活的网格系统
- 避免水平滚动

## 可访问性清单

### 必须遵守

- [ ] 文本对比度 ≥ 4.5:1
- [ ] 所有图片有 alt 文本
- [ ] 表单输入有 label
- [ ] 键盘导航可用
- [ ] Focus 状态可见
- [ ] 颜色不是唯一指示器
- [ ] 支持 prefers-reduced-motion
- [ ] 语义化 HTML

## 反模式 (禁止使用)

### 视觉
- ❌ Emoji 作为 UI 图标
- ❌ 低对比度文本 (<4.5:1)
- ❌ 布局偏移的 hover 效果
- ❌ 混乱的布局

### 交互
- ❌ 缺少 cursor-pointer
- ❌ 无视觉反馈的交互
- ❌ 即时状态变化 (无过渡)
- ❌ 不可见的 focus 状态

### 流程
- ❌ 复杂的引导流程
- ❌ 过多的步骤

## 实现检查清单

### 交付前验证

- [ ] 无 Emoji 图标 (使用 SVG)
- [ ] 所有图标来自统一图标集
- [ ] 所有可点击元素有 cursor-pointer
- [ ] Hover 状态有平滑过渡 (150-300ms)
- [ ] 文本对比度 ≥ 4.5:1
- [ ] Focus 状态可见
- [ ] 支持 prefers-reduced-motion
- [ ] 响应式: 375px, 768px, 1024px, 1440px
- [ ] 无内容被固定导航遮挡
- [ ] 移动端无横向滚动

## 技术栈

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Plus Jakarta Sans)
- **Components**: Custom + shadcn/ui patterns

## 参考资源

- [UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
