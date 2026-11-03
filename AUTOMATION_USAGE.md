# Copilot 自动化任务使用指南

## 概述

已在 CampMaster 项目中配置了 **每日抖音 POI 爬虫自动化任务**，可在 Copilot 应用中自动运行，每天 UTC 00:00（北京时间 08:00）自动爬取、处理并部署最新的露营地数据。

## 📍 查看和管理自动化任务

### 1. 打开 Copilot 自动化中心

在 Copilot 应用中：
1. 左侧导航栏 → **Automations**
2. 切换到 **Personal** 标签
3. 找到 **"每日抖音 POI 爬虫自动化"** 任务

### 2. 任务信息面板

点击任务卡片查看详细信息：

```
📋 任务名称: 每日抖音 POI 爬虫自动化
🆔 ID: dde97780-5df4-418a-986b-b4bcf39e1f79
⏰ 计划: 每天 UTC 00:00 (北京时间 08:00)
📊 下次运行: [自动显示下一次执行时间]
🔄 执行状态: [活跃/已禁用]
```

## 🚀 手动运行任务

如果你需要立即测试或手动更新数据：

### 方法1：通过 Copilot 应用（推荐）

1. **Automations** 标签 → 找到自动化任务
2. 点击任务卡片右上方的 **"▶️ Run Now"** 或 **"运行"** 按钮
3. 等待任务完成，实时查看执行日志

### 方法2：通过终端命令（快速手动测试）

```bash
# 爬取数据
npm run crawl -- -k "露营" -n 30 -c 杭州

# 处理数据（替换为实际输出文件路径）
npm run crawl:process -- ./crawler/douyin_poi_results.geojson

# 构建
npm run build
touch dist/.nojekyll

# 提交部署
git add public/data/
git commit -m "chore: update poi data from douyin crawler"
git push origin main
```

## 📊 查看执行日志

### 实时日志查看

1. 点击自动化任务卡片
2. 查看 **"Execution History"** 或 **"执行历史"** 面板
3. 点击任意一次执行记录查看详细日志

### 日志内容包括

- ✅ 爬虫执行状态（成功/失败）
- 📝 爬取的 POI 数量
- 🔄 数据处理结果（去重数、合并数）
- 🏗️ 构建结果
- 📤 Git 提交和推送状态
- ⚠️ 错误或警告信息

## 🛠️ 自动化任务流程详解

### 第1步：爬取数据

```bash
npm run crawl -- -k "露营" -n 30 -c 杭州
```

- **时间**: 通常 3-5 分钟
- **输出**: `crawler/douyin_poi_results.geojson`
- **说明**: 
  - 使用 ego-browser 绕过反爬机制
  - 在抖音搜索 "露营" 关键词
  - 自动解析视频描述中的位置信息
  - 将坐标从 GCJ-02 转换为 WGS-84 标准

### 第2步：数据处理与合并

```bash
npm run crawl:process -- [输出文件路径]
```

**自动执行的操作**：
1. 读取爬虫产生的 GeoJSON 文件
2. 按城市拆分数据
3. **去重处理**：
   - 与现有 `public/data/<city>.geojson` 比较
   - 基于 POI `name` 字段去除重复
4. **文件更新**：
   - 生成/更新 `public/data/hangzhou.geojson`（杭州数据）
   - 更新 `public/data/cities.json`（城市列表配置）
5. 输出处理统计信息

### 第3步：构建项目

```bash
npm run build
touch dist/.nojekyll
```

- 编译 React/Vue 应用
- 打包资源文件
- 创建 `.nojekyll` 文件防止 GitHub Jekyll 处理

### 第4步：提交到 GitHub

```bash
git add public/data/
git commit -m "chore: update poi data from douyin crawler"
git push origin main
```

- 提交新数据到 main 分支
- 自动触发 GitHub Pages 构建
- 应用在 5-10 分钟内更新

### 第5步：验证部署

访问 https://shiye515.github.io/CampMaster/ 查看：
- 左侧列表是否包含新增的露营地
- 地图上是否显示新的 POI 点位
- 筛选功能是否正常

## ⚙️ 自定义自动化任务

### 修改执行时间

如需更改执行时间（例如改为每天 18:00）：

1. 在 Copilot 应用中右键点击自动化任务
2. 选择 **"Edit"** 或 **"编辑"**
3. 修改 **Schedule** 的 **Hour** 为 18
4. 保存更改

### 修改爬虫参数

如需修改爬虫关键词或数量（例如爬取 50 条）：

1. 编辑自动化任务提示词
2. 将 `npm run crawl -- -k "露营" -n 30` 改为 `npm run crawl -- -k "露营" -n 50`
3. 或改为其他关键词如 `"安吉露营"` 或 `"莫干山"`
4. 保存更改

### 禁用/启用任务

1. 找到自动化任务
2. 点击卡片右上的**开关按钮**
3. 或点击 **更多选项** → **Disable/Enable**

## 🚨 故障排查

### 问题1：爬虫执行失败

**可能原因**：
- 网络问题
- 抖音反爬机制
- ego-browser 启动失败

**解决方案**：
- 查看详细日志了解失败原因
- 重新手动运行或等待下次自动运行
- 爬虫失败不会中断整个流程，数据仍会提交

### 问题2：数据没有更新

**检查清单**：
1. ✅ 登录 GitHub，查看 main 分支最新提交时间
2. ✅ 查看 `public/data/` 文件的修改时间
3. ✅ 清除浏览器缓存，重新访问应用
4. ✅ 检查 GitHub Pages 构建状态（Settings → Pages）

### 问题3：出现重复 POI

**原因**：数据处理中去重失败

**解决**：
1. 查看 `public/data/hangzhou.geojson` 文件
2. 手动删除重复条目
3. 提交更改：`git add public/data/ && git push`

## 📈 性能与成本

| 指标 | 数值 |
|------|------|
| 平均执行时间 | 8-12 分钟 |
| 爬取数据量 | ~30 条 POI/天 |
| 存储空间 | <1 MB/天 |
| 成本 | 完全免费 ✅ |
| API 依赖 | 0（无 API Key）|
| 月度运行次数 | 30 次（每天 1 次）|

## 📞 常见问题

**Q: 自动化任务能否改为每小时运行？**  
A: 可以。在自动化任务编辑器中将 interval 改为 `minutes` 并设置 `every_minutes: 60`。

**Q: 能否添加多个城市的爬虫任务？**  
A: 可以。创建多个自动化任务，分别设置不同的城市参数（例如 `-c 西湖` 等）。

**Q: 爬虫输出的数据格式是什么？**  
A: RFC 7946 GeoJSON 格式，包含 Feature 集合，每个 Feature 包含坐标（WGS-84）和 POI 属性。

**Q: 自动化任务能否通过 API 触发？**  
A: 暂不支持。当前仅支持定时触发或手动运行。

**Q: 数据多久会在应用中生效？**  
A: 通常 5-10 分钟。因为 GitHub Pages 需要构建和部署。

## 📚 相关文档

- [爬虫完整指南](./crawler/README.md)
- [爬虫快速参考](./CRAWLER_QUICKSTART.md)
- [项目集成指南](./doc/CRAWLER_SETUP.md)
- [实现技术总结](./IMPLEMENTATION_SUMMARY.md)

## 🎯 下一步

1. ✅ 在 Copilot 应用中找到自动化任务并确认已激活
2. ✅ 手动运行一次测试（点击 "Run Now"）
3. ✅ 查看执行日志确保一切正常
4. ✅ 等待明天 UTC 00:00 首次自动运行
5. ✅ 访问应用查看新数据是否已加载
