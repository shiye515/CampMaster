# 抖音 POI 爬虫集成设置指南

## 项目结构

```
CampMaster/
├── crawler/                          # 爬虫程序目录
│   ├── douyin_poi_crawler.mjs        # 爬虫核心引擎
│   ├── crawl.mjs                     # CLI启动入口
│   ├── crawl.sh                      # Bash包装脚本
│   ├── process_and_merge.mjs         # 数据处理与合并脚本
│   └── README.md                     # 爬虫使用文档
├── .github/workflows/
│   ├── deploy.yml                    # 应用构建与部署
│   └── crawler.yml                   # 🆕 爬虫自动化工作流 (每日00:00 UTC执行)
├── public/data/cities/               # 按城市分文件存储的POI数据
│   ├── cities.json                   # 城市列表配置
│   ├── 杭州市.geojson
│   ├── 湖州市.geojson
│   └── ...
└── src/
    ├── App.tsx                       # 主应用 (已支持按城市加载)
    └── utils/fgbLoader.ts            # 数据加载器 (已支持多城市)
```

## 集成特性

### 1. 本地爬虫脚本
- ✅ 支持自定义关键词、数量、城市限定
- ✅ 自动坐标转换 (GCJ-02 → WGS-84)
- ✅ 视频去重与元数据智能解析
- ✅ 支持 ego-browser 运行时

### 2. 自动化部署
- ✅ GitHub Actions 工作流 (每日 UTC 00:00 执行)
- ✅ 自动数据处理与合并
- ✅ 自动应用构建与 GitHub Pages 部署
- ✅ 自动 commit 数据变化

### 3. 应用集成
- ✅ 按城市加载数据文件
- ✅ 支持实时筛选与地图联动
- ✅ 响应式界面 (PC + 移动端)

## 本地使用指南

### 第一步：安装依赖

```bash
# 安装项目依赖
npm install

# 确保 ego-browser 已安装
ego-browser --version
```

如果 ego-browser 未安装，参考[官方安装指南](https://github.com/github-copilot-workspace/ego-browser)。

### 第二步：本地爬虫测试

```bash
cd crawler

# 基础爬取 (杭州露营地，30条)
node crawl.mjs

# 自定义参数
node crawl.mjs -k "莫干山露营" -n 20 -o ./moganshan.geojson

# 或使用npm脚本 (项目根目录)
npm run crawl -- -k "安吉露营" -n 15
```

### 第三步：处理爬虫数据

```bash
cd crawler

# 自动按城市分文件并与现有数据合并
node process_and_merge.mjs /tmp/douyin_poi_results.geojson

# 或使用npm脚本 (项目根目录)
npm run crawl:process -- /tmp/douyin_poi_results.geojson
```

### 第四步：本地验证

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 选择城市后应看到爬虫新增的 POI 数据
```

### 第五步：构建与部署

```bash
# 本地构建
npm run build

# 预览打包结果
npm run preview

# 验证无误后提交代码
git add .
git commit -m "feat: add Douyin crawler and new POI data"
git push origin main
```

## GitHub Actions 自动化工作流

### 工作流文件

位置：`.github/workflows/crawler.yml`

**触发条件：**
1. **定时执行**：每天 UTC 00:00 (北京时间 08:00)
2. **手动触发**：GitHub Actions 中手动运行

**执行步骤：**
1. Checkout 代码
2. 安装 Node.js 20 & ego-browser
3. 运行爬虫：`node crawl.mjs -k "杭州 露营" -n 30`
4. 处理数据：按城市分文件，与现有数据合并
5. 构建应用：`npm run build`
6. 部署：自动发布到 GitHub Pages
7. 提交变化：新数据 auto-commit 并 push 到 main

### 手动触发爬虫

在 GitHub 仓库中：
1. 进入 **Actions** 标签
2. 左侧选择 **Daily Douyin POI Crawler**
3. 点击 **Run workflow** 按钮
4. 输入参数：
   - Keyword: `杭州 露营` (支持自定义)
   - Limit: `30` (支持自定义)
5. 点击 **Run workflow** 开始执行

**查看执行日志：**
- 点击最新的 workflow run
- 查看 `crawl-and-deploy` job 的详细日志
- 工作流完成后自动部署上线

## 数据文件管理

### 目录结构

```
public/data/cities/
├── cities.json           # 城市列表配置
├── 杭州市.geojson       # 杭州 POI 数据
├── 湖州市.geojson       # 湖州 POI 数据
├── 宁波市.geojson       # 宁波 POI 数据
└── ...
```

### 手动更新数据

如果需要手动修改或新增 POI 数据：

1. **编辑 GeoJSON 文件**：
   ```bash
   # 直接编辑某城市的数据文件
   # public/data/cities/杭州市.geojson
   ```

2. **重新生成城市列表**：
   ```bash
   cd crawler
   node process_and_merge.mjs dummy.geojson
   # 这会重新扫描 public/data/cities/ 并生成 cities.json
   ```

3. **提交更新**：
   ```bash
   git add public/data/cities/
   git commit -m "chore: update POI data for <city>"
   git push origin main
   ```

### 数据校验

爬虫输出的数据格式检查：

```bash
# 验证 GeoJSON 有效性
cat public/data/cities/杭州市.geojson | jq '.' > /dev/null && echo "✅ Valid JSON"

# 统计 POI 数量
cat public/data/cities/杭州市.geojson | jq '.features | length'

# 检查坐标范围 (应接近浙江区域)
cat public/data/cities/杭州市.geojson | jq '.features[0].geometry.coordinates'
```

## 故障排查

### 爬虫无法运行

**问题**：`Command not found: ego-browser`

**解决**：
```bash
npm install -g ego-browser@latest
# 或
npx ego-browser --version
```

### 数据未更新

**问题**：爬虫运行成功但 GitHub Pages 上数据没变化

**解决**：
1. 检查 Actions 工作流是否成功完成
2. 查看最新的 workflow run 日志
3. 确保数据文件被 commit 并 push 到 main 分支
4. 可能需要刷新浏览器缓存 (Ctrl+Shift+R)

### 坐标显示偏移

**问题**：地图上的 POI 位置不准确

**解决**：
- 爬虫已自动处理坐标转换 (GCJ-02 → WGS-84)
- 确保地图使用了支持 WGS-84 的底图 (已配置 OpenFreeMap)
- 验证 GeoJSON 数据坐标格式：`[经度, 纬度]`

### 爬虫超时

**问题**：爬虫在 GitHub Actions 中超时

**解决**：
- 减少爬取条数：修改 `crawler.yml` 中的 `LIMIT` 参数
- 检查网络连接状态
- 查看 Actions 日志中的具体错误信息

## 性能考虑

### 数据加载优化

- ✅ 按城市分文件存储，每次只加载一个城市的数据
- ✅ 使用 FlatGeobuf 格式可进一步优化 (二进制格式，更小体积)
- ✅ 虚拟滚动列表确保 DOM 节点数恒定 (~20个)
- ✅ 空间索引 (RBush) 实现毫秒级过滤

### GitHub Actions 配额

- Free 用户每月 2000 分钟免费额度
- 每次爬虫 + 构建 + 部署约消耗 5-10 分钟
- 每日运行一次，约消耗 150-300 分钟/月，在免费额度内

## 进阶配置

### 修改定时任务

编辑 `.github/workflows/crawler.yml`，修改 `cron` 表达式：

```yaml
on:
  schedule:
    # 修改为每周一早上8点
    - cron: '0 0 * * 1'
```

[Cron 表达式帮助](https://crontab.guru/)

### 修改爬虫参数

编辑 `.github/workflows/crawler.yml`，修改爬虫命令：

```yaml
# 修改搜索关键词和采集数量
- name: Run Douyin POI Crawler
  run: |
    cd crawler
    node crawl.mjs -k "您的关键词" -n 50 -o /tmp/douyin_results.geojson
```

### 支持多个爬虫任务

创建新的 workflow 文件 (如 `.github/workflows/crawler-anji.yml`)：

```yaml
# 每天爬取安吉露营地
on:
  schedule:
    - cron: '30 0 * * *'  # 比主爬虫晚半小时执行
jobs:
  crawl-anji:
    # ... 配置爬虫参数为安吉相关
```

## 相关文档

- [爬虫使用指南](../crawler/README.md)
- [应用使用指南](../README.md)
- [数据模型定义](../src/types/poi.ts)
- [ego-browser 官方文档](https://github.com/github-copilot-workspace/ego-browser)

## 支持与反馈

如有问题或建议，欢迎提交 Issue 或 Pull Request！

---

**最后更新**：2026-11-03
**状态**：✅ 已集成并验证
