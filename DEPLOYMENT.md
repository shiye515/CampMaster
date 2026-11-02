# 📖 本地测试与一键部署指南

## 🧪 本地测试

### 第一步：安装依赖

```bash
npm install
```

> 首次安装会下载约 500-600 MB 依赖，取决于网络速度。

### 第二步：启动开发服务器

```bash
npm run dev
```

**预期输出：**
```
Local:   http://localhost:5173/
```

在浏览器自动打开 `http://localhost:5173`。

### 第三步：验证功能

#### ✅ 检查清单

- [ ] 地图正常加载（中心显示杭州区域）
- [ ] 左侧筛选栏显示 10 条 POI 数据
- [ ] 搜索框能过滤结果（输入"露营"或"杭州"）
- [ ] 城市选择器显示"全部城市"、"杭州市"、"绍兴市"
- [ ] 费用范围选择器工作正常
- [ ] 点击地图上的点位弹出弹窗
- [ ] 点击左侧卡片，地图自动飞跃到该位置
- [ ] 卡片上的小红书/抖音链接能点击打开

---

## 🛠️ 数据更新工作流

### 添加新 POI 数据

1. **编辑数据文件**
   ```bash
   vim public/data/pois.geojson
   ```

2. **遵循格式规范**
   ```json
   {
     "type": "Feature",
     "geometry": {
       "type": "Point",
       "coordinates": [120.1551, 30.2741]  // [经度, 纬度]
     },
     "properties": {
       "id": "poi-011",
       "name": "新营地名称",
       "city": "城市名",
       "cost": 100,
       "bookingMethod": "预约方式",
       "mediaLinks": [...]
     }
   }
   ```

3. **验证 GeoJSON 格式**
   - 坐标必须是 `[lng, lat]` 格式（经度在前）
   - `cost` 为 0 时代表免费
   - `id` 必须全局唯一

4. **本地测试**
   ```bash
   npm run dev
   ```
   刷新浏览器，新数据应立即显示。

### 转换为高性能格式（可选）

如果数据量大于 1000 条，建议转换为 FlatGeobuf 格式以加快加载速度：

```bash
npm run convert
```

> 此脚本会在 `public/data/` 目录生成 `pois.fgb` 文件。应用会自动优先使用 `.fgb`，不存在时降级到 `.geojson`。

---

## 🚀 一键部署到 GitHub Pages

### 前置条件

1. 项目已推送到 GitHub
2. 仓库已启用 GitHub Pages（Settings → Pages 设置为 Deploy from a branch，选择 `gh-pages` 分支）

### 自动部署方式（推荐）

#### 方式 1：Push 代码自动触发 CI/CD

```bash
# 更新数据或代码
git add .
git commit -m "Update POI data: add 5 new camping sites"
git push origin main
```

**发生了什么：**
1. GitHub Actions 自动检测到 main 分支的 Push
2. 运行 `.github/workflows/deploy.yml` 工作流
3. 自动执行：`npm install` → `npm run build` → 部署到 `gh-pages`
4. 约 2-3 分钟后，应用上线

**查看部署状态：**
- 进入 GitHub 仓库 → **Actions** 标签页
- 点击最新的工作流运行查看日志
- 看到 ✅ 绿色勾号表示部署成功

#### 方式 2：手动触发工作流

如果不想提交新代码，可手动触发：

1. 进入 GitHub 仓库 → **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 按钮

### 手动部署方式（无 CI/CD 时）

如果 GitHub Actions 不可用，使用 `git subtree` 手动部署：

```bash
# 1. 本地构建
npm run build

# 2. 推送 dist 目录到 gh-pages 分支
git push origin `git subtree split --prefix dist main`:gh-pages --force
```

**或使用 gh-pages 工具：**
```bash
npm install -g gh-pages
gh-pages -d dist
```

---

## 🌐 访问上线应用

部署完成后，应用将在以下地址可访问：

```
https://<your-username>.github.io/CampMaster/
```

例如：
- 用户名为 `shiye515` 的仓库：`https://shiye515.github.io/CampMaster/`

### 首次访问可能需要等待

- GitHub Pages CDN 同步需要 1-5 分钟
- 可强制刷新浏览器缓存（Cmd/Ctrl + Shift + R）

---

## 🔍 常见部署问题排查

### ❌ 问题 1：部署后页面 404

**原因**：`vite.config.ts` 中的 `base` 路径不正确

**解决**：
```typescript
// vite.config.ts
export default defineConfig({
  // ...
  base: './',  // 必须是 './' 而不是 '/'
  // ...
});
```

重新构建后重新部署。

### ❌ 问题 2：地图不显示

**原因**：
1. 网络无法访问 OpenFreeMap CDN
2. 坐标数据有误

**解决**：
1. 检查浏览器控制台（F12）是否有 CORS 错误
2. 验证 `public/data/pois.geojson` 中的坐标格式
3. 尝试使用 VPN 访问（如在中国，OpenFreeMap 可能需要加速）

### ❌ 问题 3：数据不更新

**原因**：浏览器缓存

**解决**：
1. 强制刷新：Cmd/Ctrl + Shift + R
2. 清除浏览器缓存
3. 在浏览器开发者工具（F12）中禁用缓存

### ❌ 问题 4：GitHub Actions 部署失败

**解决步骤**：
1. 进入 GitHub → **Actions** → 查看失败的工作流
2. 点击失败的 Job 查看错误日志
3. 常见错误：
   - `npm ERR! Cannot find module` → 运行 `npm install` 后重新提交
   - `fatal: not a git repository` → 检查 `.git` 目录是否存在
   - `Permission denied` → 检查 GitHub Token 权限（Settings → Developer settings）

---

## 📊 监控与日志

### 查看部署日志

1. **GitHub Actions 日志**
   - 进入仓库 → **Actions** → 选择工作流 → 点击 Run 查看详细日志

2. **浏览器控制台**
   - 打开上线应用 → 按 F12 打开开发者工具
   - 查看 **Console** 标签是否有错误

3. **网络调试**
   - 打开 **Network** 标签
   - 检查 `pois.geojson` 是否成功加载
   - 检查 MapLibre CDN 资源加载状态

---

## 🔄 更新与热重载

### 本地开发热重载

修改代码后，开发服务器会自动：
1. 重新编译（TypeScript / React / Tailwind）
2. 热更新浏览器（HMR）
3. 通常在 1 秒内完成

**如果热重载失败**：
```bash
# 清除缓存后重启
rm -rf dist node_modules/.vite
npm run dev
```

### 生产环境更新

任何对 `main` 分支的 Push 都会触发新的构建和部署：

```bash
# 修改代码或数据
git add .
git commit -m "Feature: add new POI data"
git push origin main

# 等待 2-3 分钟后刷新访问 GitHub Pages URL
```

---

## ✅ 部署检验清单

部署完成后，按照以下清单验证：

- [ ] GitHub Pages URL 能正常访问
- [ ] 地图加载正常，显示 POI 点位
- [ ] 列表显示所有 POI 数据
- [ ] 搜索、筛选功能正常
- [ ] 地图与列表交互正常（点击、悬停）
- [ ] 外链能正确打开（新标签页）
- [ ] 浏览器控制台无红色错误
- [ ] 移动端响应式布局正常

---

## 🎯 性能监控

### 本地性能测试

在开发服务器中打开浏览器开发者工具：

```
F12 → Performance 标签 → 点击记录 → 操作列表 → 停止记录
```

**关键指标**：
- **FCP** (First Contentful Paint)：应 < 2s
- **LCP** (Largest Contentful Paint)：应 < 3s
- **FID** (First Input Delay)：应 < 100ms
- **列表滚动帧率**：应保持 60 FPS

### 构建大小分析

检查构建后的产物大小：

```bash
npm run build
ls -lh dist/assets/
```

预期输出：
- `vendor-maplibre.xxxxx.js`：~350 KB
- `vendor-spatial.xxxxx.js`：~50 KB
- `vendor-ui.xxxxx.js`：~150 KB
- `index.xxxxx.js`：~50 KB

---

## 📞 获取帮助

如部署过程中遇到问题：

1. **查看 GitHub Actions 日志**（最直接有效）
2. **检查浏览器控制台** F12 → Console
3. **提交 Issue** 到 GitHub 仓库（附上错误截图和浏览器版本）

---

**祝你部署顺利！🎉**
