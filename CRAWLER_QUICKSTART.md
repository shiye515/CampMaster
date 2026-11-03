# 🕷️ 爬虫快速参考卡片

## 本地快速命令

```bash
# 默认爬取 (杭州露营地 30条)
npm run crawl

# 自定义关键词和数量
npm run crawl -- -k "莫干山露营" -n 20

# 预设：杭州露营
npm run crawl:hangzhou

# 处理爬虫数据 (按城市分文件+去重合并)
npm run crawl:process -- /tmp/douyin_poi_results.geojson
```

## GitHub Actions 自动化

**每日执行时间**：UTC 00:00 (北京时间 08:00)

**手动触发**：GitHub Actions → Daily Douyin POI Crawler → Run workflow

**工作流文件**：`.github/workflows/crawler.yml`

## 数据流向

```
抖音网页
    ↓
[爬虫收集] douyin_poi_crawler.mjs
    ↓
[去重清洗] process_and_merge.mjs
    ↓
[按城市分文件] public/data/cities/
    ↓
[自动构建部署] GitHub Actions
    ↓
[上线] GitHub Pages + 自动commit
```

## 核心特性

| 特性 | 说明 |
|------|------|
| 🎯 精准采集 | 从抖音搜索结果智能解析 POI 地点、价格、预约方式 |
| 🗺️ 坐标转换 | GCJ-02 (火星) → WGS-84 (标准) 自动转换 |
| 🔄 去重合并 | 与现有数据去重，避免重复 |
| 📍 按城市分文件 | 优化加载性能，只加载当前城市数据 |
| 🤖 自动化部署 | 每日自动爬取、处理、构建、部署 |
| ✅ 零配置 | 无需 API Key，完全免费 |

## 文件位置

```
📂 CampMaster
├── 📁 crawler/                  # 爬虫程序
│  ├── douyin_poi_crawler.mjs   # 核心引擎
│  ├── crawl.mjs                # CLI入口
│  ├── process_and_merge.mjs    # 数据处理
│  └── README.md                # 详细文档
├── 📁 .github/workflows/
│  └── crawler.yml              # 自动化配置
├── 📁 public/data/cities/       # 数据存储
│  ├── cities.json
│  ├── 杭州市.geojson
│  └── ...
└── 📁 doc/
   └── CRAWLER_SETUP.md         # 集成指南
```

## 常见问题

**Q: 爬虫多久执行一次？**
A: 每天 UTC 00:00 (北京时间 08:00) 自动执行一次

**Q: 如何修改爬虫参数？**
A: 编辑 `.github/workflows/crawler.yml` 中的爬虫命令行参数

**Q: 可以手动触发爬虫吗？**
A: 可以，GitHub Actions → Daily Douyin POI Crawler → Run workflow

**Q: 爬虫采集多少条数据？**
A: 默认 30 条，可在工作流中修改 `LIMIT` 参数

**Q: 数据保存在哪里？**
A: `public/data/cities/` 目录，每个城市一个 `.geojson` 文件

**Q: 如何手动运行爬虫？**
A: `cd crawler && node crawl.mjs -k "您的关键词" -n 30`

**Q: 爬虫会重复爬取相同数据吗？**
A: 不会，自动按 POI 名称去重

**Q: 坐标是否准确？**
A: 是的，已自动从 GCJ-02 转换为 WGS-84 标准坐标

## 相关文档

- 📖 [完整设置指南](./doc/CRAWLER_SETUP.md)
- 📖 [爬虫使用指南](./crawler/README.md)
- 🔧 [爬虫架构设计](./crawler/README.md#爬虫工作原理)

---

**状态**：✅ 已集成并可用
**最后更新**：2026-11-03
