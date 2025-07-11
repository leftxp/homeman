# Homeman - Homepage 配置管理器

一个简洁的 Web 管理界面，用于管理 [Homepage](https://gethomepage.dev) 的配置文件。

## 📋 功能特性

- ✅ **全局设置管理** - 配置网站标题、主题、语言等
- ✅ **书签管理** - 添加、编辑、删除书签和分组
- ✅ **Docker 管理** - 配置 Docker 实例和容器服务发现
- ✅ **配置文件管理** - 备份、恢复、下载配置文件
- ✅ **YAML 直接编辑** - 在线代码编辑器，支持语法高亮和验证
- ✅ **YAML 验证** - 确保生成的配置文件符合 Homepage 规范
- ✅ **错误处理机制** - 完善的错误处理，防止空配置或语法错误导致页面崩溃
- 🚧 **服务管理** - 管理服务监控和集成（开发中）

## 🛠️ 技术栈

- **后端**: Python 3.8+ + Flask
- **前端**: HTML5 + CSS3 + JavaScript + Bootstrap 5
- **数据处理**: PyYAML
- **配置存储**: YAML 文件

## 📦 安装

### 1. 克隆项目

```bash
git clone <项目地址>
cd homeman
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

```bash
# 设置 Homepage 配置文件路径（可选，默认为 /app/config）
export HOMEPAGE_CONFIG_PATH=/path/to/homepage/config

# 设置 Flask 环境（可选，默认为 development）
export FLASK_ENV=development
```

### 4. 启动应用

```bash
python app.py
```

应用将在 `http://localhost:3100` 启动。

## 🐳 Docker 部署

### 1. 运行容器

```bash
docker run -d \
  --name homeman \
  -p 3100:3100 \
  -v /path/to/homepage/config:/app/config \
  -e HOMEPAGE_CONFIG_PATH=/app/config \
  leftxp/homeman
```

### 2. 使用 Docker Compose

```yaml
services:
  homeman:
    image: leftxp/homeman
    ports:
      - "3100:3100"
    volumes:
      - /path/to/homepage/config:/app/config
    environment:
      - HOMEPAGE_CONFIG_PATH=/app/config
```

## 📖 使用说明

### 1. 全局设置

访问 "全局设置" 页面配置：

#### 基础设置
- 网站标题和描述
- 起始 URL 和基础 URL
- 自定义图标和实例名称
- 语言和链接目标
- 日志路径和更新检查

#### 外观设置
- 主题（浅色/深色）
- 颜色方案（22 种颜色选择）
- 页眉样式（4 种样式）
- 图标样式（渐变/主题）
- 状态样式（默认/圆点/基本）

#### 背景设置
- 背景图片 URL 配置
- 卡片模糊效果（6 种级别）
- 高级背景滤镜（需使用 YAML 编辑器）

#### 布局设置
- 全宽布局
- 最大分组列数（1-8列）
- 最大书签分组列数（1-8列）
- 使用等高卡片
- 五列布局支持

#### 折叠设置
- 禁用折叠功能
- 初始折叠分组
- 书签样式（网格/仅图标）

#### 显示设置
- 隐藏版本信息
- 显示 Docker 统计
- 隐藏小工具错误信息

#### 快速启动设置
- 搜索提供商（Google/DuckDuckGo/Bing/百度/Brave/自定义）
- 搜索描述包含
- 网络搜索显示控制
- 搜索建议和 URL 访问设置

### 2. 书签管理

访问 "书签管理" 页面：
- 创建书签分组
- 添加书签项（支持图标和缩写）
- 编辑和删除书签
- 拖拽排序

### 3. Docker 管理

访问 "Docker 管理" 页面配置：
- Docker 实例连接（Socket 或 TCP）
- 容器服务发现和状态监控
- Swarm 集群支持
- TLS 安全连接配置
- 用户认证设置
- 连接测试和验证

### 4. 配置文件管理

访问 "配置管理" 页面：
- 查看配置文件状态
- 备份配置文件
- 下载配置信息
- 恢复备份

### 5. YAML 编辑器

访问 "YAML 编辑器" 页面：
- 选择要编辑的配置文件类型
- 使用专业代码编辑器直接编辑 YAML 内容
- 实时语法高亮和错误检测
- 语法验证和配置预览
- 支持键盘快捷键（Ctrl+S 保存，Ctrl+Enter 验证）
- 自动备份和恢复功能

## 📁 目录结构

```
homeman/
├── app.py                 # Flask 应用主文件
├── requirements.txt       # Python 依赖
├── docker-compose.yml     # Docker Compose 配置
├── utils/
│   ├── yaml_manager.py    # YAML 文件管理
│   └── config_validator.py # 配置验证
├── templates/
│   ├── base.html          # 基础模板
│   ├── index.html         # 主页
│   ├── settings.html      # 全局设置
│   ├── bookmarks.html     # 书签管理
│   ├── docker.html        # Docker 管理
│   ├── services.html      # 服务管理
│   ├── config.html        # 配置管理
│   └── yaml_editor.html   # YAML 编辑器
├── static/
│   └── js/
│       └── validation.js  # 前端验证脚本
└── README.md              # 项目说明
```

## 🔧 配置文件

Homeman 管理以下 Homepage 配置文件：

- `settings.yaml` - 全局设置
- `bookmarks.yaml` - 书签配置
- `docker.yaml` - Docker 实例配置
- `services.yaml` - 服务配置
- `widgets.yaml` - 小工具配置

## 🎨 支持的功能

### 全局设置 (settings.yaml)
- ✅ 基础设置：标题、语言、主题等
- ✅ 外观设置：颜色方案、页眉样式等
- ✅ 显示设置：版本隐藏、Docker 统计等
- ✅ 布局设置：等高卡片、五列布局等

### 书签管理 (bookmarks.yaml)
- ✅ 分组管理：创建、编辑、删除分组
- ✅ 书签管理：添加、编辑、删除书签
- ✅ 图标支持：文件名、MDI 图标、Simple Icons 等
- ✅ 数据验证：URL 格式、必填字段等

### Docker 管理 (docker.yaml)
- ✅ 实例管理：添加、编辑、删除 Docker 实例
- ✅ 连接配置：Unix Socket 和 TCP 连接支持
- ✅ 高级功能：Swarm 模式、TLS 安全、用户认证
- ✅ 状态监控：容器统计信息显示开关
- ✅ 连接测试：验证 Docker 连接有效性
- ✅ 配置验证：确保符合 Homepage Docker 规范

### 服务管理 (services.yaml)
- 🚧 基础功能：显示现有服务配置
- 🚧 完整管理：添加、编辑、删除服务
- 🚧 监控配置：站点监控、Ping 检测等
- 🚧 小工具集成：状态显示、API 配置等

### YAML 直接编辑
- ✅ 代码编辑器：基于 CodeMirror 的专业编辑器
- ✅ 语法高亮：YAML 语法高亮和自动完成
- ✅ 实时验证：输入时即时检测语法错误
- ✅ 配置预览：解析后的 JSON 结构预览
- ✅ 键盘快捷键：快速保存和验证操作
- ✅ 自动备份：保存时自动创建备份文件
- ✅ 多文件支持：支持所有 Homepage 配置文件类型

## 🛡️ 错误处理与稳定性

Homeman 内置了完善的错误处理机制，确保在各种异常情况下都能稳定运行：

### 配置文件错误处理
- ✅ **空配置文件保护** - 当配置文件为空时，自动使用默认值
- ✅ **YAML 语法错误保护** - 当配置文件包含语法错误时，记录错误并使用默认配置
- ✅ **数据类型验证** - 确保配置数据类型正确，防止意外错误
- ✅ **安全的统计计算** - 即使配置数据异常，也不会影响页面显示

### 页面错误处理
- ✅ **路由级错误处理** - 每个页面都有独立的错误处理机制
- ✅ **友好的错误提示** - 当发生错误时，显示清晰的错误信息
- ✅ **日志记录** - 所有错误都会被记录到日志中，方便排查问题
- ✅ **优雅降级** - 发生错误时仍能显示基本界面，不会完全崩溃

### 数据验证
- ✅ **输入验证** - 对所有用户输入进行验证，防止无效数据
- ✅ **格式检查** - 确保 URL、图标等格式正确
- ✅ **必填字段检查** - 确保必要的配置项不为空
- ✅ **类型转换保护** - 安全地处理数据类型转换

## 🚀 开发计划

- [x] 项目初始化和基础架构
- [x] YAML 解析和生成功能
- [x] 基础 Web 界面
- [x] 全局设置管理
- [x] 书签管理功能
- [x] Docker 管理功能
- [x] YAML 直接编辑功能
- [x] 完善的错误处理机制
- [ ] 完整的服务管理功能
- [ ] 配置文件导入导出
- [ ] 用户权限管理
- [ ] 更多主题和样式

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Homepage 官网](https://gethomepage.dev)
- [Homepage 配置文档](https://gethomepage.dev/configs/)
- [Homepage GitHub](https://github.com/gethomepage/homepage) 