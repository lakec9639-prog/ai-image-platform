# AI Image Platform

基于火山引擎豆包 Doubao（Seedream）大模型的 AI 图片生成平台，支持文生图、图生图、AI 对话等功能。

## 功能特性

- **文生图（Text-to-Image）**：输入文字描述生成图片
- **图生图（Image-to-Image）**：上传参考图，按提示词生成新图
- **AI 对话**：多模态对话，支持文本和图片输入
- **历史记录**：查看和管理图片生成历史
- **用户管理**：注册、登录、管理后台

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18, Ant Design 5.x, Vite, React Router |
| 后端 | Spring Boot 4.0.1, JDK 17, Maven |
| 数据库 | PostgreSQL 15 |
| 缓存 | Redis 7 |
| 对象存储 | MinIO |
| AI API | 豆包 Doubao（volcengine-java-sdk-ark-runtime） |
| 部署 | Docker Compose, Nginx |

## 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 18+（构建前端）
- 火山引擎 ARK API Key（[获取地址](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)）

### 一键部署（推荐）

```bash
git clone https://github.com/your-username/ai-image-platform.git
cd ai-image-platform

# 配置环境变量
cp deploy/.env.example .env
# 编辑 .env，填入你的 ARK_API_KEY

# 使用 Docker Compose 启动全部服务
cd deploy
docker compose up -d
```

启动后访问 http://localhost 即可。

### 手动启动（开发）

**1. 启动基础设施**

```bash
cd deploy
docker compose up -d postgres redis minio
```

**2. 启动后端**

```bash
cd backend
mvn spring-boot:run
```

或使用 IDE 打开 `backend/` 目录直接运行。

**3. 启动前端**

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认运行在 http://localhost:5173。

### 配置说明

所有配置通过环境变量管理，参考 `deploy/.env.example`：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `ARK_API_KEY` | 火山引擎 API 密钥（必填） | - |
| `DB_USERNAME` | PostgreSQL 用户名 | postgres |
| `DB_PASSWORD` | PostgreSQL 密码 | postgres |
| `REDIS_PASSWORD` | Redis 密码 | (空) |
| `MINIO_ACCESS_KEY` | MinIO 访问密钥 | minioadmin |
| `MINIO_SECRET_KEY` | MinIO 密钥 | minioadmin |

## 项目结构

```
ai-image-platform/
├── backend/             # Spring Boot 后端
│   └── src/main/java/com/example/aiimage/
│       ├── controller/  # REST API 控制器
│       ├── service/     # 业务逻辑
│       ├── model/       # 实体与 DTO
│       ├── repository/  # 数据访问
│       ├── config/      # 配置
│       └── interceptor/ # 拦截器（鉴权）
├── frontend/            # React 前端
│   └── src/
│       ├── api/         # API 接口封装
│       └── components/  # UI 组件
├── deploy/              # Docker Compose 部署
│   ├── docker-compose.yml
│   ├── nginx/nginx.conf
│   └── .env.example
├── test/                # API 测试脚本
├── docs/                # 设计文档与会议记录
└── report/              # 架构与部署方案
```

## 许可证

MIT
