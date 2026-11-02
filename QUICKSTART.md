# 📖 快速开始指南 (Quick Start)

## 🚀 5分钟快速启动

### 第一步：准备环境
```bash
# 确保已安装 Node.js 20+
node -v  # 应显示 v20.x 或更高

# 克隆项目
git clone <your-repo-url>
cd CampMaster

# 安装依赖（约 2-3 分钟）
npm install
```

### 第二步：启动本地开发服务器
```bash
npm run dev
```

你会看到类似这样的输出：
```
  VITE v5.4.21  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

在浏览器中打开 `http://localhost:5173`，应用自动加载并显示：
- ✅ 地图（中心显示杭州区域）
- ✅ 左侧筛选栏与 10 条 POI 数据
- ✅ 响应式交互

### 第三步：验证基础功能
| 功能 | 测试方法 | 预期结果 |
|------|---------|---------|
| 搜索 | 在搜索框输入"露营" | 列表过滤为相关结果 |
| 城市筛选 | 点击"杭州市"胶囊按钮 | 仅显示杭州的 POI |
| 地图交互 | 点击地图上的绿色点位 | 地图飞跃、弹窗展开、列表高亮 |
| 列表联动 | 点击左侧 POI 卡片 | 地图自动飞跃到该坐标 |
| 外链跳转 | 点击卡片上的"小红书" | 新标签页打开小红书链接 |

---

## 📦 项目初始化详解

### 依赖清单（package.json）

**核心依赖：**
```json
{
  "react": "^19.0.0",                    // React 19 最新版
  "maplibre-gl": "^4.0.0",               // WebGL 矢量地图引擎
  "rbush": "^4.0.0",                     // 2D 空间 R 树索引
  "flatgeobuf": "^4.1.1",                // 高效地理空间数据格式
  "zustand": "^5.0.0",                   // 轻量级状态管理
  "@tanstack/react-virtual": "^3.5.1",  // 虚拟滚动列表
  "@tanstack/react-table": "^8.20.0",   // 无头表格库（备用）
  "lucide-react": "^0.408.0"            // 现代图标库
}
```

**开发依赖：**
```json
{
  "vite": "^5.0.8",              // 极速构建工具
  "typescript": "^5.3.3",        // TypeScript 类型支持
  "tailwindcss": "^3.4.1",       // 原子化 CSS 框架
  "@vitejs/plugin-react": "^4.2.1"  // Vite React 插件
}
```

**安装时间：** ~2-3 分钟（首次），后续由于缓存会更快。

---

## 🎯 核心概念速览

### 1. **状态管理（Zustand）**
```typescript
// src/store/usePoiStore.ts
// 全局状态：所有 POI 数据、过滤条件、激活项等

usePoiStore((state) => ({
  allFeatures,           // 原始全部数据
  filteredFeatures,      // 经过筛选后的数据
  searchText,            // 搜索关键词
  selectedCity,          // 选中城市
  costRange,             // 费用范围 [min, max]
  bookingMethods,        // 预约方式列表
  enableViewportFilter,  // 是否启用视口过滤
  activePoi              // 当前激活的 POI ID
}))
```

当任何筛选条件变化时，自动调用 `applyFilters()` 重新计算 `filteredFeatures`。

### 2. **空间索引（RBush）**
```typescript
// src/utils/spatialIndex.ts
// 实现毫秒级 Bbox 查询

spatialIndex.searchBbox([
  west,  // 西边界（最小经度）
  south, // 南边界（最小纬度）
  east,  // 东边界（最大经度）
  north  // 北边界（最大纬度）
]) // 返回 [id1, id2, ...] 毫秒内完成
```

启用"仅显示当前视口"后，拖拽地图实时过滤 POI。

### 3. **组件层级**
```
App
├── FilterBar           // 筛选栏
├── PoiList
│   └── PoiCard[]      // 虚拟化列表卡片
└── MapView            // MapLibre 地图
```

### 4. **数据流向**
```
用户输入（筛选、搜索）
    ↓
Zustand 状态更新
    ↓
applyFilters() 计算新结果集
    ↓
React 自动重新渲染
    ↓
MapView + PoiList 同步更新
```

---

## 🛠️ 开发工作流

### 修改 POI 数据

**场景 1：快速测试新数据**
```bash
# 编辑 public/data/pois.geojson
vim public/data/pois.geojson

# 保存后，开发服务器会自动热重载（1秒内）
```

**场景 2：大批量数据导入**
```bash
# 准备 CSV/Excel → 转换为 GeoJSON
# (提供 scripts/convert.mjs 参考实现)

npm run convert
```

### 本地样式调整

**修改颜色主题**
```typescript
// src/components/MapView.tsx
paint: {
  'circle-color': '#1e40af',  // 改为你的颜色
  // ...
}
```

**修改地图中心与初始缩放**
```typescript
// src/components/MapView.tsx
center: [120.15, 30.27],  // [经度, 纬度]
zoom: 9,                  // 初始缩放级别
```

**修改虚拟列表卡片高度**
```typescript
// src/components/PoiList.tsx
estimateSize: () => 200,  // 卡片约 200px 高（酌情调整）
```

### 构建与测试

```bash
# 本地开发（热重载）
npm run dev

# 生产构建（压缩优化）
npm run build

# 预览构建结果
npm run preview
```

---

## 📂 关键文件速查

| 文件 | 用途 | 修改频率 |
|------|------|---------|
| `public/data/pois.geojson` | POI 数据 | 高 |
| `src/store/usePoiStore.ts` | 全局状态 | 低 |
| `src/components/*.tsx` | UI 组件 | 中 |
| `src/App.tsx` | 主应用布局 | 低 |
| `tailwind.config.js` | 样式配置 | 低 |
| `.github/workflows/deploy.yml` | CI/CD 流水线 | 极低 |

---

## ⚡ 常用命令速查

```bash
# 开发
npm run dev              # 启动开发服务器

# 构建
npm run build            # 生产构建
npm run preview          # 预览构建结果

# 数据
npm run convert          # 转换 GeoJSON → FlatGeobuf (可选)

# 部署
git add .
git commit -m "message"
git push origin main     # 自动触发 GitHub Actions
```

---

## 🔍 调试技巧

### 1. **浏览器开发者工具**
```
F12 → Console 标签
```
- 查看加载日志
- 检查 Fetch 错误
- 查看 React 组件状态

### 2. **Network 标签**
```
F12 → Network 标签
```
- 检查 `pois.geojson` 是否加载成功
- 检查 MapLibre 瓦片加载状态
- 查看资源大小

### 3. **React DevTools**
```
Chrome 扩展: React Developer Tools
```
- 检查 Zustand 状态树
- 追踪组件重新渲染

### 4. **MapLibre 调试**
```javascript
// 在控制台执行
map.showTileBoundaries = true;  // 显示瓦片边界
```

---

## ✅ 本地测试清单

部署前检查清单：

- [ ] `npm install` 成功完成
- [ ] `npm run dev` 能启动开发服务器
- [ ] 浏览器能打开 http://localhost:5173
- [ ] 地图正常显示（中心在杭州）
- [ ] 10 条 POI 显示在列表和地图上
- [ ] 搜索框能过滤结果
- [ ] 城市选择器能筛选
- [ ] 费用范围选择器工作正常
- [ ] 点击地图点位能展开弹窗
- [ ] 点击卡片能飞跃到地图对应位置
- [ ] 媒体链接能打开（新标签页）
- [ ] 浏览器控制台无红色错误
- [ ] 手机浏览器能正常显示（响应式）
- [ ] `npm run build` 能成功构建
- [ ] `dist/` 目录包含 `index.html` 和 `data/pois.geojson`

---

## 🚀 部署前最后检查

```bash
# 1. 确保所有代码已提交
git status  # 应显示 "working tree clean"

# 2. 本地构建测试
npm run build

# 3. 验证构建输出
ls -lh dist/
# 应包含：index.html, .nojekyll, data/pois.geojson, assets/

# 4. 推送到 GitHub
git push origin main

# 5. 等待 GitHub Actions 完成
# → 访问 GitHub 仓库 Actions 标签页查看进度
```

---

## 📞 常见问题快速解答

**Q: 开发服务器卡顿？**
A: 清缓存并重启
```bash
rm -rf node_modules/.vite
npm run dev
```

**Q: 地图不显示？**
A: 检查网络连接和浏览器控制台错误

**Q: 数据不更新？**
A: 强制刷新 (Cmd/Ctrl + Shift + R)

**Q: 构建失败？**
A: 确保 `npm install` 完成，运行 `npm run build` 查看详细错误

**Q: GitHub Pages 404？**
A: 检查 `vite.config.ts` 中 `base: './'` 是否正确

---

**祝开发顺利！🎉**

下一步：[详细部署指南](./DEPLOYMENT.md)
