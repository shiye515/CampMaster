# 🚀 快速开始指南

## 在线访问

**无需任何配置，直接打开：**
👉 [POI 地图应用](https://shiye515.github.io/CampMaster/)

## 本地开发

### 1. 克隆仓库
```bash
git clone https://github.com/shiye515/CampMaster.git
cd CampMaster
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
# 访问 http://localhost:5173
```

### 4. 生产构建
```bash
npm run build
# 构建输出到 dist/ 目录
```

## 基本使用

### 界面说明

**顶部筛选栏：**
- 城市选择（下拉）：默认"杭州市"
- 价格范围（下拉）：全部价格 / 免费 / 100元以内 / 100-300元 / 300元以上
- 结果计数：显示当前过滤的 POI 总数

**左侧 POI 列表（桌面端）/ 底部抽屉（移动端）：**
- 虚拟滚动列表
- 每张卡片显示：名称、城市、价格、预订方式、推荐资源
- 点击卡片时：地图自动飞到该位置，圆点变大高亮

**右侧地图（桌面端）/ 顶部（移动端）：**
- 按经纬度展示 POI
- 点击圆点：显示详情弹窗，列表自动滚动
- 放大缩小：使用地图右上角控制

### 常见操作

| 操作 | 说明 |
|------|------|
| 切换城市 | 点击顶部城市下拉，选择另一个城市 |
| 按价格筛选 | 点击"全部价格"，选择价格范围 |
| 查看详情 | 点击列表卡片或地图圆点 |
| 访问链接 | 点击卡片中的小红书/抖音等链接 |
| 移动地图 | 鼠标拖拽地图，或使用控制按钮 |

## 数据来源

POI 数据来自：
- 用户提交（欢迎 Issue 或 PR）
- 每日自动爬虫采集（抖音/小红书等）

**数据格式**：GeoJSON（开放标准）  
**存储位置**：`public/data/cities/{城市}.geojson`

## 技术栈概览

| 类型 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 地图 | MapLibre GL JS |
| 状态 | Zustand |
| 样式 | Tailwind CSS |
| 列表 | TanStack React Virtual |
| 构建 | Vite |
| 部署 | GitHub Pages |

## 特色功能

✨ **实时列表-地图联动**
- 点击列表：地图自动飞到
- 圆点变大高亮显示
- 平滑动画效果

✨ **高性能渲染**
- 虚拟滚动：262 个 POI 仅 20 个 DOM 节点
- 60 FPS 无缝滚动
- WebGL 硬件加速地图

✨ **响应式设计**
- 桌面端双栏布局
- 移动端自适应
- 完美支持平板设备

## 常见问题

### Q: 可以添加新的 POI 吗？
**A:** 可以！欢迎通过以下方式：
1. Issue：描述 POI 信息
2. PR：直接修改 `public/data/cities/{城市}.geojson`
3. 爬虫自动采集：每天自动从抖音/小红书采集

### Q: 地图加载很慢怎么办？
**A:** 
- 检查网络连接
- 清除浏览器缓存
- 刷新页面重试
- 尝试切换网络（4G/WiFi）

### Q: 如何在本地修改数据？
**A:** 
编辑 `public/data/cities/{城市}.geojson`，按 GeoJSON 格式添加：
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [120.1234, 30.5678]
  },
  "properties": {
    "id": "poi-xxx",
    "name": "新营地名称",
    "city": "杭州市",
    "cost": 100,
    "bookingMethod": "微信预订",
    "mediaLinks": [
      {
        "platform": "小红书",
        "title": "链接标题",
        "url": "https://..."
      }
    ]
  }
}
```

### Q: 支持哪些城市？
**A:** 目前支持浙江省 9 个城市：
- 杭州市（262 POI）✓
- 宁波市 ✓
- 温州市 ✓
- 嘉兴市 ✓
- 湖州市 ✓
- 绍兴市 ✓
- 金华市 ✓
- 衢州市 ✓
- 舟山市 ✓
- 台州市 ✓
- 丽水市 ✓

## 后续计划

🚀 **近期**
- [ ] 高德地图真实地名集成
- [ ] 搜索功能（跨城市）
- [ ] 收藏夹功能
- [ ] 分享链接功能

📈 **中期**
- [ ] 数据质量评分系统
- [ ] 用户评论功能
- [ ] 热力图展示
- [ ] 导出为 Excel/CSV

🌐 **远期**
- [ ] 更多数据源集成
- [ ] AI 推荐系统
- [ ] 社区论坛
- [ ] 移动端 App（PWA）

## 联系与反馈

- **GitHub Issues**: [提交 bug 或功能请求](https://github.com/shiye515/CampMaster/issues)
- **GitHub Discussions**: [讨论和建议](https://github.com/shiye515/CampMaster/discussions)

## 许可证

MIT License - 自由使用和修改

---

**最后更新**: 2026年11月4日  
**维护者**: [@shiye515](https://github.com/shiye515)
