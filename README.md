# 🗺️ 高性能 POI 地图应用

一个从 0 到 1 构建的、开源免费、零 API Key 依赖的高性能 POI 列表检索与地图联动 Web 应用。支持一键通过 GitHub Actions 自动化部署到免费的 GitHub Pages。

## ✨ 核心特性

### 🎯 功能亮点
- **双向无缝联动**：地图 ↔ 列表实时同步交互
- **高性能虚拟列表**：支持万级数据，恒定 60 FPS（仅渲染可见区域）
- **毫秒级空间过滤**：RBush R 树索引，支持视口 Bbox 实时过滤
- **多维分面筛选**：城市、费用、下单方式、关键词搜索组合过滤
- **开箱即用部署**：GitHub Pages 一键自动化 CI/CD
- **100% 开源免费**：零商业依赖，无许可费用

### 🚀 技术栈
| 层面 | 技术选型 |
|------|---------|
| **前端框架** | React 19 + TypeScript |
| **样式系统** | Tailwind CSS 3 |
| **地图引擎** | MapLibre GL JS（WebGL 硬件加速） |
| **虚拟滚动** | TanStack React Virtual |
| **空间索引** | RBush（2D R 树） |
| **状态管理** | Zustand（轻量级） |
| **数据格式** | FlatGeobuf（流式 + 空间索引）/ GeoJSON（备选） |
| **打包工具** | Vite（极速冷启动） |
| **部署** | GitHub Actions → GitHub Pages |

## 📦 快速开始

### 1️⃣ 克隆与安装依赖

```bash
git clone <your-repo-url>
cd CampMaster
npm install
```

### 2️⃣ 本地开发

```bash
npm run dev
```

在浏览器打开 `http://localhost:5173`，应用会自动加载 `public/data/pois.geojson` 数据。

### 3️⃣ 生产构建

```bash
npm run build
```

构建输出在 `dist/` 目录。完整应用大小约 **800 KB**（Gzip 后 ~220 KB）。

---

## 🗃️ 数据结构

### POI 数据格式（GeoJSON Feature）

```typescript
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [120.1551, 30.2741]  // [lng, lat] 严格 WGS84
  },
  "properties": {
    "id": "poi-001",
    "name": "春晓苕溪大草坪营地",
    "city": "杭州市",
    "cost": 128,                         // 人均费用，0 = 免费
    "bookingMethod": "现场扫码无需预约",
    "mediaLinks": [
      {
        "platform": "小红书",
        "title": "春晓营地露营体验",
        "url": "https://www.xiaohongshu.com"
      }
    ]
  }
}
```

---

## 🛠️ 数据管理

### 更新 POI 数据

编辑 `public/data/pois.geojson`，遵循 GeoJSON 格式。

本地测试：
```bash
npm run dev
```

转换为高性能格式：
```bash
npm run convert
```

---

## 🌐 GitHub Pages 部署

### 自动化 CI/CD

1. **推送到 main 分支**
   ```bash
   git push origin main
   ```

2. **自动部署**
   - GitHub Actions 自动构建和发布
   - 访问 `https://<username>.github.io/CampMaster/`

### 手动部署

```bash
npm run build
git push origin `git subtree split --prefix dist main`:gh-pages --force
```

---

## 📂 项目结构

```text
├── .github/workflows/deploy.yml    # CI/CD 流水线
├── public/data/
│   ├── pois.geojson               # POI 数据文件
│   └── .nojekyll                  # GitHub Pages 配置
├── src/
│   ├── components/
│   │   ├── MapView.tsx            # 地图组件
│   │   ├── PoiList.tsx            # 虚拟列表
│   │   ├── PoiCard.tsx            # 卡片组件
│   │   └── FilterBar.tsx          # 筛选栏
│   ├── store/usePoiStore.ts       # 状态管理
│   ├── types/poi.ts               # 类型定义
│   ├── utils/                     # 工具函数
│   ├── App.tsx                    # 主应用
│   └── main.tsx                   # 入口
└── package.json                   # 依赖
```

---

## ⚡ 性能

- 虚拟列表：恒定 20 个 DOM 节点，60 FPS
- 空间索引：<10ms 查询延迟
- 应用大小：~650 KB (未压缩) / ~180 KB (Gzip)