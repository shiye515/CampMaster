# Douyin POI Crawler 使用指南

本项目集成了自动化的抖音 POI 爬虫，可以定时从抖音自动采集露营地等兴趣点数据。

## 快速开始

### 本地测试爬虫

进入 `crawler` 目录，执行爬虫命令：

```bash
cd crawler

# 默认爬取"杭州 露营"，30条 POI
node crawl.mjs

# 指定关键词和数量
node crawl.mjs -k "安吉露营" -n 20

# 指定城市并输出到特定文件
node crawl.mjs -k "莫干山露营" -c "湖州市" -n 15 -o ./moganshan.geojson

# 查看帮助信息
node crawl.mjs --help
```

### 处理和合并数据

爬虫输出后，自动按城市分文件存储并与现有数据合并：

```bash
cd crawler
node process_and_merge.mjs /tmp/douyin_poi_results.geojson
```

处理后的数据会保存在 `public/data/cities/` 目录下，每个城市一个 `.geojson` 文件。

## 命令行参数

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--keyword` | `-k` | "露营地" | 搜索关键词 |
| `--limit` | `-n` | 30 | 采集条数 |
| `--city` | `-c` | (自动识别) | 限定城市 |
| `--output` | `-o` | "douyin_poi_results.geojson" | 输出文件路径 |
| `--all` | - | (仅 POI) | 采集所有视频，不过滤是否含 POI |
| `--help` | `-h` | - | 显示帮助 |

## 自动化部署

### 每日定时执行

项目已配置 GitHub Actions 工作流程 (`.github/workflows/crawler.yml`)，每天 UTC 00:00 (北京时间 08:00) 自动执行：

1. **爬取数据**：使用 ego-browser 从抖音爬取"杭州 露营"相关 POI
2. **数据处理**：按城市分文件，与现有数据去重合并
3. **构建应用**：npm run build
4. **部署上线**：自动发布到 GitHub Pages
5. **提交更新**：新数据自动 commit 并 push 到 main 分支

### 手动触发爬虫

在 GitHub 仓库中：
1. 进入 **Actions** 标签
2. 选择 **Daily Douyin POI Crawler** 工作流
3. 点击 **Run workflow** 按钮
4. 输入自定义参数（关键词、采集数量等）
5. 点击 **Run workflow** 执行

## 数据格式

爬虫输出的 GeoJSON 数据格式：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [120.066174, 30.89786]
      },
      "properties": {
        "id": "poi-001",
        "name": "安吉和村免费露营地",
        "city": "湖州市",
        "cost": 0,
        "bookingMethod": "免费免预约自由露营",
        "mediaLinks": [
          {
            "platform": "抖音",
            "title": "安吉和村免费露营地...",
            "url": "https://www.douyin.com/video/7692741667442419638"
          }
        ]
      }
    }
  ]
}
```

## 爬虫工作原理

1. **会话初始化**：先访问抖音首页建立合法会话，规避 WAF 反爬
2. **关键词搜索**：自动填充搜索框并执行搜索
3. **瀑布流爬取**：平滑滚动加载并采集搜索结果
4. **智能解析**：从视频描述中提取地点、城市、费用、预约方式等元数据
5. **坐标转换**：将抖音返回的 GCJ-02 坐标自动转换为 WGS-84 标准坐标
6. **去重合并**：与现有数据按地点名称去重，避免重复

## 注意事项

- 爬虫需要 ego-browser 运行时环境，GitHub Actions 会自动安装
- 每次爬取的数据会与现有数据合并，自动去重
- 坐标已按 WGS-84 标准转换，可直接在 MapLibre、Leaflet 等地图引擎中使用
- 爬虫采集的是公开数据，请遵守抖音平台使用条款

## 故障排查

**爬虫无法连接抖音**
- 确保网络连接正常
- ego-browser 可能需要更新：`npm install -g ego-browser@latest`
- 尝试手动运行爬虫，查看具体错误信息

**数据没有更新**
- 检查 GitHub Actions 工作流是否正常运行
- 在 Actions 标签查看最近的运行日志
- 确保爬虫输出了有效的 GeoJSON 数据

**坐标显示偏移**
- 应用已配置自动处理 WGS-84，坐标应该准确
- 如有偏移，检查地图底图源是否也使用了 WGS-84

## 相关文档

- [爬虫架构完整指南](../doc/douyin-poi-crawler-guide.md)
- [应用数据模型](../src/types/poi.ts)
- [部署文档](../README.md)
