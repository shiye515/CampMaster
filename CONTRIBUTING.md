# 🤝 CampMaster 贡献指南

感谢您对 CampMaster 的关注！我们欢迎各种形式的贡献。

---

## 🗺️ 提交 POI 数据

这是最常见的贡献方式！帮助我们扩展营地和兴趣点数据库。

### 方法 1：使用 Issue 模板（推荐）

1. 打开 [Issues](../../issues) 页面
2. 点击 **New Issue**
3. 选择 **🗺️ 添加新的 POI 兴趣点** 模板
4. 填写表单中的所有必需字段：
   - 📍 名称（必填）
   - 🏙️ 城市（必填）
   - 💰 人均费用（必填）
   - 📅 预约方式（必填）
   - 🔗 媒体链接（可选）
   - 📍 经纬度坐标（必填）
5. 提交 Issue

我们会审核您的提交并在 1-3 个工作日内合并。

### 方法 2：直接编辑 GeoJSON

高级用户可以直接编辑数据文件：

1. Fork 本仓库
2. 编辑 `public/data/pois.geojson`
3. 添加新的 POI Feature（参考下方格式）
4. 提交 Pull Request

#### POI 数据格式

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [120.1551, 30.2741]
  },
  "properties": {
    "id": "poi-001",
    "name": "兴趣点名称",
    "city": "城市名称",
    "cost": 128,
    "bookingMethod": "预约方式描述",
    "mediaLinks": [
      {
        "platform": "小红书",
        "title": "链接标题",
        "url": "https://example.com"
      },
      {
        "platform": "抖音",
        "title": "链接标题",
        "url": "https://example.com"
      }
    ]
  }
}
```

**字段说明**：
- `id`: 唯一标识符（格式：poi-XXX）
- `name`: 兴趣点名称
- `city`: 所在城市
- `cost`: 人均费用（元，0 表示免费）
- `bookingMethod`: 预约或访问方式
- `mediaLinks`: 媒体链接数组
  - `platform`: 平台名称（小红书、抖音、大众点评、其他）
  - `title`: 链接标题
  - `url`: 完整 URL

---

## 🐛 报告 Bug

发现问题？帮助我们改进！

1. 打开 [Issues](../../issues) 页面
2. 点击 **New Issue**
3. 选择 **🐛 报告应用问题** 模板
4. 填写：
   - 问题描述
   - 复现步骤
   - 期望行为 vs 实际行为
   - 环境信息（OS、浏览器等）
   - 截图或错误日志
5. 提交

---

## ✨ 功能请求

有改进建议？我们很想听听！

1. 打开 [Issues](../../issues) 页面
2. 点击 **New Issue**
3. 选择 **✨ 功能请求** 模板
4. 描述：
   - 新功能或改进
   - 使用场景
   - 为什么需要这个功能
   - 参考其他应用的实现
5. 提交

---

## 💻 代码贡献

想要提交代码改进？欢迎！

### 开发流程

1. **Fork** 本仓库
2. **Clone** 到本地
   ```bash
   git clone https://github.com/YOUR_USERNAME/CampMaster.git
   cd CampMaster
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **本地开发和测试**
   ```bash
   npm run dev
   ```
   访问 http://localhost:5173 查看实时效果

6. **提交代码**
   ```bash
   git add .
   git commit -m "feat: Add your feature description"
   git push origin feature/your-feature-name
   ```

7. **提交 Pull Request**
   - 在 GitHub 上创建 PR
   - 清晰描述您的改动
   - 参考相关的 Issue（如 #123）

### 代码规范

- **语言**：TypeScript（严格模式）
- **框架**：React 19 + Functional Components
- **状态管理**：Zustand
- **样式**：Tailwind CSS
- **代码格式**：Prettier（已配置）
- **提交信息**：使用 Conventional Commits
  ```
  feat: Add new feature
  fix: Fix a bug
  docs: Update documentation
  style: Format code
  refactor: Refactor code
  perf: Improve performance
  test: Add tests
  chore: Maintenance
  ```

### Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码遵循项目的代码规范
- [ ] 添加了必要的注释
- [ ] 本地测试通过（`npm run build` 成功）
- [ ] 提交信息清晰有意义
- [ ] 没有引入新的警告或错误
- [ ] 更新了相关文档（如需）
- [ ] 添加了 Issue 参考

---

## 📝 文档贡献

发现文档有误或可以改进？帮助我们完善文档！

- 编辑相关的 `.md` 文件
- 提交 Pull Request
- 确保格式和内容准确

---

## 🎓 资源链接

- **项目文档**：[README.md](../README.md)
- **快速启动**：[QUICKSTART.md](../QUICKSTART.md)
- **部署指南**：[DEPLOYMENT.md](../DEPLOYMENT.md)
- **技术规格**：[TECHNICAL_SPECS.md](../TECHNICAL_SPECS.md)

---

## 💬 讨论和反馈

- **一般讨论**：在 [Discussions](../../discussions) 中提出
- **问题反馈**：使用 [Issues](../../issues)
- **即时交流**：暂无聊天服务器（可联系维护者）

---

## 📜 行为准则

我们致力于为所有人提供一个欢迎和包容的环境。

- 尊重他人的观点和经验
- 接受建设性的批评
- 专注于对社区最好的事情
- 表现出同情和善意

---

## 🙏 致谢

感谢所有为 CampMaster 做出贡献的人！

您的贡献，无论大小，都帮助我们构建更好的应用。

---

## ❓ 常见问题

### 我可以提交商业营地吗？

可以！我们欢迎所有合法的营地和景点，无论是免费还是收费的。

### 数据多久会被审核？

通常 1-3 个工作日。我们会检查数据准确性和格式。

### 我提交的数据可以被修改吗？

是的，为了保持数据质量和一致性，维护者可能会对数据进行轻微调整。

### 如何联系维护者？

可以通过 Issue 或 PR 评论区与维护者沟通。

---

**感谢您的贡献！让我们一起让 CampMaster 更好！** 🚀
