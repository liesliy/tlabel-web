# AGENTS.md - TLabel Web Platform

## 项目概览
TLabel Web MVP - 触觉数据标准化Web平台，提供触觉数据的上传、转换、标准化和导出功能。

## 技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19 + TypeScript 5
- **UI**: Ant Design 5 + shadcn/ui
- **Styling**: Tailwind CSS 4
- **包管理**: pnpm

## 构建与运行
```bash
pnpm install          # 安装依赖
pnpm run dev          # 开发环境
pnpm run build        # 生产构建
pnpm run start        # 生产启动
pnpm ts-check         # TypeScript 类型检查
pnpm lint             # ESLint 检查
```

## 目录结构
```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页 - 数据上传与处理
│   ├── globals.css             # 全局样式
│   ├── process/page.tsx        # 灵巧手 URDF 映射页面
│   ├── history/page.tsx        # 处理历史页面
│   ├── settings/page.tsx       # 系统设置页面
│   └── api/
│       ├── process/route.ts    # 数据处理 API
│       ├── history/route.ts    # 历史记录 API
│       ├── urdf/route.ts       # URDF 分析 API
│       └── sample/route.ts     # 示例数据下载 API
├── components/
│   ├── layout/AppLayout.tsx    # 侧边栏布局组件
│   └── ui/                     # shadcn/ui 组件
├── lib/
│   ├── utils.ts                # 工具函数
│   └── tlabel/                 # TLabel 核心处理库
│       ├── types.ts            # 类型定义 (22维语义特征 Schema)
│       ├── csv-parser.ts       # CSV 数据解析器
│       ├── converter.ts        # 原始数据 → TLabel 转换器
│       ├── urdf-mapper.ts      # 灵巧手 URDF 映射
│       └── lerobot-exporter.ts # LeRobot 格式导出
```

## 核心功能
1. **高密度触觉数据适配器**: CSV → TLabel 22维语义特征转换
2. **灵巧手URDF映射**: 支持 Unitree G1、因时机器人、Allegro Hand
3. **LeRobot格式导出**: 导出为 HuggingFace LeRobot 标准格式
4. **处理历史**: 内存存储的处理记录

## 数据处理流程
上传CSV → 解析NxM阵列 → 转换22维特征 → (可选)灵巧手映射 → (可选)LeRobot导出

## 代码风格
- TypeScript strict 模式
- 函数参数必须标注类型
- 使用 Ant Design 组件库
- 工业风格 UI (深空灰 + 信号青)
