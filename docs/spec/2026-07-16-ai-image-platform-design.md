# AI 生图系统设计规格文档

> 文档版本: V1.0
> 编写日期: 2026-07-16
> 对应需求: PRODUCT_FEATURE_DOCUMENT.md

## 一、系统架构

### 1.1 架构总览

前后端分离 B/S 架构，后端 Spring Boot 4.0.1 + JDK 17 + Maven，前端 React 18 + Ant Design，底层 PostgreSQL 15 + Redis 7.x + MinIO，AI 能力通过火山引擎 Ark SDK 调用豆包 API。

### 1.2 技术栈

| 层次 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18 |
| UI 组件库 | Ant Design | 5.x |
| 后端框架 | Spring Boot | 4.0.1 |
| JDK | Eclipse Temurin | 17+ |
| 构建工具 | Maven | 3.8.8+ |
| AI SDK | volcengine-java-sdk-ark-runtime | LATEST |
| 数据库 | PostgreSQL | 15 |
| 缓存 | Redis | 7.x |
| 对象存储 | MinIO | LATEST |
| 部署 | Docker Compose | — |

## 二、前端页面

### 2.1 页面清单

| 页面 | 路由 | 权限 | 说明 |
|------|------|------|------|
| 登录页 | `/login` | 公开 | 账号密码登录 + Token 持久化 |
| AI 对话 | `/chat` | 需登录 | 文生文 + 图生文，SSE 流式输出 |
| 文生图 | `/t2i` | 需登录 | 文本生成图片 |
| 图生图 | `/i2i` | 需登录 | 图片 + 文本生成新图 |
| 我的作品 | `/works` | 需登录 | 所有类型历史记录 |
| 账号管理 | `/admin/users` | ADMIN | 用户增改启禁用 |

### 2.2 导航栏

所有登录后页面共享顶部导航栏：`[AI 生图平台] [AI对话] [文生图] [图生图] [我的作品] [账号管理](仅ADMIN) [用户昵称 ▼ 退出]`

### 2.3 关键交互

- **AI 对话**：类似 ChatGPT 界面，流式 SSE + 打字机效果，支持上传图片后图生文
- **文生图**：左侧参数面板（提示词、尺寸、画风、数量、水印），右侧预览
- **图生图**：上传底图 → 参数配置（提示词、重绘强度） → 左右对比展示原图与新图
- **我的作品**：统一展示 + 按类型（文生图/图生图/对话）筛选 + 分页 + 预览弹窗 + 删除
- **登录**：记住登录状态勾选，未登录自动跳转

## 三、后端服务

### 3.1 包结构

```
com.example.aiimage
├── config/          # WebMvcConfig, RedisConfig, RetryConfig
├── interceptor/     # AuthInterceptor (Token 鉴权 + 白名单)
├── controller/
│   ├── AuthController       # /api/auth/login, /api/auth/logout
│   ├── ChatController       # /api/chat/completion (SSE)
│   ├── T2IController        # /api/t2i/generate
│   ├── I2IController        # /api/i2i/upload, /api/i2i/generate
│   ├── HistoryController    # /api/works
│   └── AdminUserController  # /api/admin/users
├── service/         # 接口层
│   └── impl/        # 实现类
├── repository/      # JPA Repository
├── model/
│   ├── entity/      # User, ImageRecord, ChatRecord
│   ├── dto/         # 请求/响应 DTO
│   └── enums/       # GenerateType, ImageStatus, ChatType
├── util/
│   ├── ArkServiceUtil       # 豆包 SDK 单例
│   └── SensitiveFilter      # 敏感词过滤
└── exception/
    ├── GlobalExceptionHandler
    ├── BusinessException
    └── UnauthorizedException
```

### 3.2 豆包 API 调用映射

| AI 能力 | 豆包端点 | 模型 | 调用方式 |
|---------|---------|------|---------|
| 文生文 | /api/v3/responses | doubao-seed-2-0-pro-260215 | SDK 流式 + SseEmitter |
| 图生文 | /api/v3/responses (多模态) | 同上 | SDK 流式 + base64 图片 |
| 文生图 | /api/v3/images/generations | doubao-seedream-4-5-251128 | SDK generateImages() |
| 图生图 | /api/v3/images/generations (带 image) | 同上 | SDK generateImages() |

### 3.3 流式对话实现

ChatController 使用 `SseEmitter` 返回流式响应：
1. 前端 POST 请求携带 prompt + 可选图片
2. 后端创建 SseEmitter（超时 120s）
3. 调用 Ark SDK 流式接口（返回 RxJava Observable）
4. Observable 每收到一个块 → SseEmitter.send() → 前端逐字渲染
5. 流结束后保存完整对话到 chat_records，complete SseEmitter

### 3.4 鉴权

AuthInterceptor 全局拦截，白名单 `/api/auth/login`。Token 从 Header 提取，Redis 校验。

### 3.5 容错

Spring Retry 3 次重试（指数退避），DoubaoApiException → 502 友好提示。项目维度的@Retryable + @Recover。

## 四、数据存储

### 4.1 PostgreSQL 三张表

**users** (用户账号)
| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGSERIAL | PK |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | BCrypt, NOT NULL |
| nickname | VARCHAR(50) | |
| role | VARCHAR(20) | DEFAULT 'USER' |
| status | VARCHAR(10) | DEFAULT 'ENABLED' |
| created_at | TIMESTAMP | DEFAULT NOW() |

**image_records** (文生图/图生图记录)
| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | FK → users |
| generate_type | VARCHAR(20) | TEXT_TO_IMAGE / IMAGE_TO_IMAGE |
| prompt | TEXT | NOT NULL |
| negative_prompt | TEXT | |
| size | VARCHAR(20) | |
| style | VARCHAR(50) | |
| similar_strength | DECIMAL(3,2) | |
| source_minio_path | VARCHAR(500) | |
| result_minio_path | VARCHAR(500) | NOT NULL |
| image_status | VARCHAR(20) | DEFAULT 'SUCCESS' |
| created_at | TIMESTAMP | DEFAULT NOW() |

**chat_records** (AI 对话记录)
| 字段 | 类型 | 约束 |
|------|------|------|
| id | BIGSERIAL | PK |
| user_id | BIGINT | FK → users |
| chat_type | VARCHAR(20) | TEXT_TO_TEXT / IMAGE_TO_TEXT |
| prompt | TEXT | NOT NULL |
| image_minio_path | VARCHAR(500) | |
| answer | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

### 4.2 Redis Key

| Key | 结构 | TTL | 用途 |
|-----|------|-----|------|
| session:{token} | String | 7天 | 会话 |
| t2i:lock:{userId}:{hash} | String | 5秒 | 防重复 |
| rate:limit:{userId} | String | 1分钟 | 限流 |

### 4.3 MinIO 桶

| 桶 | 路径规则 |
|----|---------|
| ai-text-image | t2i/{userId}/{uuid}.png |
| ai-img2img-out | i2i/{userId}/{uuid}.png |
| ai-source-img | source/{userId}/{timestamp}_{filename} |

## 五、接口契约

### 5.1 统一格式

```json
{ "code": 200, "message": "成功", "data": {} }
```

code: 200成功, 400参数, 401未登录, 403无权限, 429限流, 500系统, 502外部服务

### 5.2 API 清单

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | /api/auth/login | 否 | 登录 |
| POST | /api/auth/logout | 是 | 退出 |
| POST | /api/chat/completion | 是 | AI 对话 (SSE) |
| POST | /api/t2i/generate | 是 | 文生图 |
| POST | /api/i2i/upload | 是 | 上传底图 |
| POST | /api/i2i/generate | 是 | 图生图 |
| GET | /api/works | 是 | 作品列表 |
| GET | /api/works/{id} | 是 | 作品详情 |
| DELETE | /api/works/{id} | 是 | 删除作品 |
| GET | /api/admin/users | ADMIN | 用户列表 |
| POST | /api/admin/users | ADMIN | 新增用户 |
| PUT | /api/admin/users/{id}/status | ADMIN | 启禁用 |

## 六、部署

Docker Compose 六容器：
1. PostgreSQL 15 (healthcheck)
2. Redis 7 (healthcheck)
3. MinIO + init-buckets (healthcheck)
4. Spring Boot 后端 (依赖前三就绪)
5. Nginx (反向代理 + SSL + 静态资源)

数据卷持久化: postgres_data, redis_data, minio_data
备份: pg_dump 每日 + 数据卷快照
