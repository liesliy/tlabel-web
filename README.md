# TLabel Web

TLabel Web 是一个触觉数据标准化 Web 平台，提供触觉数据的上传、转换、标准化和导出功能。

## 功能特性

- **高密度触觉数据适配器**: 支持 CSV 格式上传，自动识别 NxM 阵列，转换为 TLabel 22维语义特征 JSON
- **灵巧手 URDF 映射**: 支持 URDF 文件上传分析，3种灵巧手构型映射（Unitree G1/因时机器人/Allegro Hand）
- **LeRobot 格式导出**: 导出为 HuggingFace LeRobot 标准格式
- **纯前端静态应用**: 所有数据处理在客户端完成，无需后端服务器

## 在线演示

访问 [GitHub Pages](https://liesliy.github.io/tlabel-web) 体验完整功能。

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产构建
pnpm run start
```

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19 + TypeScript 5
- **UI**: Ant Design 5
- **Styling**: Tailwind CSS 4
- **包管理**: pnpm
- **部署**: GitHub Pages (静态导出)

## 数据处理流程

1. 用户上传触觉数据文件 (CSV)
2. 系统识别文件格式和元数据（通道数、采样率、时间戳等）
3. 高密度触觉适配器处理：原始 NxM 通道 → 22维语义特征
4. 可选：灵巧手 URDF 映射（选择目标灵巧手类型）
5. 可选：导出为 LeRobot 格式
6. 下载结果文件

## TLabel 标准格式

TLabel 定义了触觉数据的通用语义特征 Schema，包含 22 维特征：

| 维度 | 名称 | 描述 |
|------|------|------|
| 0 | contact | 接触状态 (0/1) |
| 1 | pressure | 压力值 |
| 2 | shear_x | X方向剪切力 |
| 3 | shear_y | Y方向剪切力 |
| 4 | slip | 滑动状态 |
| 5 | slip_direction | 滑动方向 |
| 6-7 | force_x, force_y | 力向量 |
| 8 | texture_freq | 纹理频率 |
| 9 | texture_amp | 纹理幅度 |
| 10 | temperature | 温度 |
| 11 | vibration | 振动 |
| 12-13 | curvature_x, curvature_y | 曲率 |
| 14 | contact_area | 接触面积 |
| 15 | contact_depth | 接触深度 |
| 16-17 | normal_x, normal_y | 法向量 |
| 18 | stickiness | 粘性 |
| 19 | hardness | 硬度 |
| 20 | moisture | 湿度 |
| 21 | confidence | 置信度 |

## 相关链接

- [TLabel SDK](https://github.com/liesliy/tlabel) - TLabel 标准 SDK
- [LeRobot](https://github.com/huggingface/lerobot) - HuggingFace LeRobot

## License

MIT
