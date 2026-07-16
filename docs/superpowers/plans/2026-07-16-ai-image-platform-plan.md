# AI 生图系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建完整的 AI 生图系统，支持文生文、图生文、文生图、图生图四种能力，配套登录鉴权、作品管理、账号管理。

**Architecture:** 前后端分离，后端 Spring Boot 4.0.1 + JDK 17 + Maven，前端 React 18 + Ant Design + Vite，数据层 PostgreSQL 15 + Redis 7.x + MinIO，AI 能力通过火山引擎 Ark SDK。

**Tech Stack:** Spring Boot 4.0.1, JDK 17, Maven 3.8.8+, React 18, Ant Design 5.x, Vite, PostgreSQL 15, Redis 7.x, MinIO, volcengine-java-sdk-ark-runtime

## Global Constraints

- JDK 17+ 强制要求，Spring Boot 4.0.1 强制要求
- 前端使用 React 18 + Ant Design 5.x + Vite
- 后端使用 Maven 构建，不做 Gradle
- 所有 API 统一返回 `{ code, message, data }` 格式
- Token 鉴权使用 Bearer Token，Redis 存储会话
- 密码使用 BCrypt 加密
- MinIO 图片使用 Presigned URL（1 小时过期）
- Docker Compose 部署六容器：PostgreSQL、Redis、MinIO、init-buckets、Backend、Nginx
- 代码目录：`backend/`（后端 Maven 项目）、`frontend/`（前端 Vite 项目）

---

## 文件结构总览

```
picture/
├── backend/                          # 后端 Spring Boot Maven 项目
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/example/aiimage/
│       ├── AiImageApplication.java
│       ├── config/
│       │   ├── WebMvcConfig.java
│       │   ├── RedisConfig.java
│       │   └── RetryConfig.java
│       ├── interceptor/
│       │   └── AuthInterceptor.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── ChatController.java
│       │   ├── T2IController.java
│       │   ├── I2IController.java
│       │   ├── HistoryController.java
│       │   └── AdminUserController.java
│       ├── service/
│       │   ├── AuthService.java
│       │   ├── ChatService.java
│       │   ├── T2IService.java
│       │   ├── I2IService.java
│       │   ├── HistoryService.java
│       │   ├── MinioService.java
│       │   ├── DoubaoImageService.java
│       │   └── AdminUserService.java
│       │   └── impl/                # 各 Service 实现
│       ├── repository/
│       │   ├── UserRepository.java
│       │   ├── ImageRecordRepository.java
│       │   └── ChatRecordRepository.java
│       ├── model/
│       │   ├── entity/
│       │   │   ├── User.java
│       │   │   ├── ImageRecord.java
│       │   │   └── ChatRecord.java
│       │   ├── dto/
│       │   │   ├── LoginRequest.java
│       │   │   ├── LoginResponse.java
│       │   │   ├── ChatRequest.java
│       │   │   ├── T2IRequest.java
│       │   │   ├── I2IRequest.java
│       │   │   ├── ImageResultVO.java
│       │   │   ├── UserVO.java
│       │   │   └── PageResult.java
│       │   └── enums/
│       │       ├── GenerateType.java
│       │       ├── ImageStatus.java
│       │       └── ChatType.java
│       ├── util/
│       │   ├── ArkServiceUtil.java
│       │   ├── SensitiveFilter.java
│       │   └── AuthContext.java
│       ├── exception/
│       │   ├── GlobalExceptionHandler.java
│       │   ├── BusinessException.java
│       │   ├── UnauthorizedException.java
│       │   └── DoubaoApiException.java
│       └── R/
│           └── AjaxJsonResult.java
├── frontend/                         # 前端 React + Vite 项目
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/
│       │   ├── request.js            # Axios 封装
│       │   ├── auth.js
│       │   ├── chat.js
│       │   ├── t2i.js
│       │   ├── i2i.js
│       │   ├── works.js
│       │   └── admin.js
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Chat.jsx
│       │   ├── T2I.jsx
│       │   ├── I2I.jsx
│       │   ├── Works.jsx
│       │   └── AdminUsers.jsx
│       └── components/
│           ├── Navbar.jsx
│           ├── AuthGuard.jsx
│           └── ImagePreview.jsx
├── deploy/                           # 部署文件
│   ├── docker-compose.yml
│   └── nginx/
│       └── nginx.conf
```

---

### Task 1: 后端项目脚手架搭建

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/example/aiimage/AiImageApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/Dockerfile`

**Interfaces:**
- Consumes: (none — first task)
- Produces: 可编译的 Spring Boot 空项目，含完整依赖声明

- [ ] **Step 1: 创建 pom.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.1</version>
        <relativePath/>
    </parent>
    <groupId>com.example</groupId>
    <artifactId>ai-image</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>ai-image</name>
    <description>AI Image Generation Platform</description>
    <properties>
        <java.version>17</java.version>
    </properties>
    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <!-- JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        <!-- Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <!-- PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <!-- MinIO -->
        <dependency>
            <groupId>io.minio</groupId>
            <artifactId>minio</artifactId>
            <version>8.5.17</version>
        </dependency>
        <!-- Ark SDK -->
        <dependency>
            <groupId>com.volcengine</groupId>
            <artifactId>volcengine-java-sdk-ark-runtime</artifactId>
            <version>0.1.26</version>
        </dependency>
        <!-- Spring Retry -->
        <dependency>
            <groupId>org.springframework.retry</groupId>
            <artifactId>spring-retry</artifactId>
        </dependency>
        <!-- AOP (Retry 需要) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: 创建 AiImageApplication.java**

```java
package com.example.aiimage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;

@SpringBootApplication
@EnableRetry
public class AiImageApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiImageApplication.class, args);
    }
}
```

- [ ] **Step 3: 创建 application.yml**

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:5432/ai_image_db
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        format_sql: true
  redis:
    host: ${REDIS_HOST:localhost}
    port: 6379
    password: ${REDIS_PASSWORD:}

minio:
  endpoint: http://${MINIO_HOST:localhost}:9000
  access-key: ${MINIO_ACCESS_KEY:minioadmin}
  secret-key: ${MINIO_SECRET_KEY:minioadmin}

doubao:
  api-key: ${ARK_API_KEY}
  base-url: https://ark.cn-beijing.volces.com/api/v3
  t2i-model: doubao-seedream-4-5-251128
  chat-model: doubao-seed-2-0-pro-260215

logging:
  level:
    com.example.aiimage: DEBUG
    com.volcengine: WARN
```

- [ ] **Step 4: 创建 Dockerfile**

```dockerfile
FROM maven:3.8.8-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- [ ] **Step 5: 编译验证**

```bash
cd backend
mvn clean compile -q
# Expected: BUILD SUCCESS
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat: init Spring Boot 4.0.1 project with all dependencies"
```

---

### Task 2: 实体模型与数据访问层

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/model/entity/User.java`
- Create: `backend/src/main/java/com/example/aiimage/model/entity/ImageRecord.java`
- Create: `backend/src/main/java/com/example/aiimage/model/entity/ChatRecord.java`
- Create: `backend/src/main/java/com/example/aiimage/model/enums/GenerateType.java`
- Create: `backend/src/main/java/com/example/aiimage/model/enums/ImageStatus.java`
- Create: `backend/src/main/java/com/example/aiimage/model/enums/ChatType.java`
- Create: `backend/src/main/java/com/example/aiimage/repository/UserRepository.java`
- Create: `backend/src/main/java/com/example/aiimage/repository/ImageRecordRepository.java`
- Create: `backend/src/main/java/com/example/aiimage/repository/ChatRecordRepository.java`

**Interfaces:**
- Consumes: Task 1 (project scaffolding)
- Produces: `User`, `ImageRecord`, `ChatRecord` entities + JPA repositories

- [ ] **Step 1: 创建 GenerateType 枚举**

```java
package com.example.aiimage.model.enums;

public enum GenerateType {
    TEXT_TO_IMAGE,
    IMAGE_TO_IMAGE
}
```

- [ ] **Step 2: 创建 ImageStatus 枚举**

```java
package com.example.aiimage.model.enums;

public enum ImageStatus {
    SUCCESS,
    FAILED,
    PENDING
}
```

- [ ] **Step 3: 创建 ChatType 枚举**

```java
package com.example.aiimage.model.enums;

public enum ChatType {
    TEXT_TO_TEXT,
    IMAGE_TO_TEXT
}
```

- [ ] **Step 4: 创建 User 实体**

```java
package com.example.aiimage.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 50)
    private String nickname;

    @Column(nullable = false, length = 20)
    private String role = "USER";

    @Column(nullable = false, length = 10)
    private String status = "ENABLED";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 5: 创建 ImageRecord 实体**

```java
package com.example.aiimage.model.entity;

import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.model.enums.ImageStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "image_records")
public class ImageRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GenerateType generateType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String negativePrompt;

    @Column(length = 20)
    private String size;

    @Column(length = 50)
    private String style;

    @Column(precision = 3, scale = 2)
    private BigDecimal similarStrength;

    @Column(length = 500)
    private String sourceMinioPath;

    @Column(nullable = false, length = 500)
    private String resultMinioPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImageStatus imageStatus = ImageStatus.SUCCESS;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 6: 创建 ChatRecord 实体**

```java
package com.example.aiimage.model.entity;

import com.example.aiimage.model.enums.ChatType;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "chat_records")
public class ChatRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatType chatType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(length = 500)
    private String imageMinioPath;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

- [ ] **Step 7: 创建三个 Repository**

```java
// UserRepository.java
package com.example.aiimage.repository;

import com.example.aiimage.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}

// ImageRecordRepository.java
package com.example.aiimage.repository;

import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ImageRecordRepository extends JpaRepository<ImageRecord, Long> {
    Page<ImageRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<ImageRecord> findByUserIdAndGenerateTypeOrderByCreatedAtDesc(
            Long userId, GenerateType type, Pageable pageable);
    Optional<ImageRecord> findByIdAndUserId(Long id, Long userId);
}

// ChatRecordRepository.java
package com.example.aiimage.repository;

import com.example.aiimage.model.entity.ChatRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRecordRepository extends JpaRepository<ChatRecord, Long> {
    Page<ChatRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
```

- [ ] **Step 8: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 9: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/model/
git add backend/src/main/java/com/example/aiimage/repository/
git commit -m "feat: add entity models and JPA repositories"
```

---

### Task 3: 统一响应体、DTO 与异常处理

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/R/AjaxJsonResult.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/LoginResponse.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/ChatRequest.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/T2IRequest.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/I2IRequest.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/ImageResultVO.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/PageResult.java`
- Create: `backend/src/main/java/com/example/aiimage/model/dto/UserVO.java`
- Create: `backend/src/main/java/com/example/aiimage/exception/BusinessException.java`
- Create: `backend/src/main/java/com/example/aiimage/exception/UnauthorizedException.java`
- Create: `backend/src/main/java/com/example/aiimage/exception/DoubaoApiException.java`
- Create: `backend/src/main/java/com/example/aiimage/exception/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: Task 2 (enums)
- Produces: `AjaxJsonResult<T>` — 所有 Controller 的统一返回类型

- [ ] **Step 1: 创建 AjaxJsonResult**

```java
package com.example.aiimage.R;

import lombok.Data;

@Data
public class AjaxJsonResult<T> {
    private int code;
    private String message;
    private T data;

    public AjaxJsonResult() {}

    public AjaxJsonResult(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> AjaxJsonResult<T> success(T data) {
        return new AjaxJsonResult<>(200, "操作成功", data);
    }

    public static <T> AjaxJsonResult<T> success(String message, T data) {
        return new AjaxJsonResult<>(200, message, data);
    }

    public static <T> AjaxJsonResult<T> error(String code, String message) {
        return new AjaxJsonResult<>(Integer.parseInt(code), message, null);
    }

    public static <T> AjaxJsonResult<T> error(int code, String message) {
        return new AjaxJsonResult<>(code, message, null);
    }
}
```

- [ ] **Step 2: 创建异常类**

```java
// BusinessException.java
package com.example.aiimage.exception;
public class BusinessException extends RuntimeException {
    private final int code;
    public BusinessException(String message) { super(message); this.code = 400; }
    public BusinessException(int code, String message) { super(message); this.code = code; }
    public int getCode() { return code; }
}

// UnauthorizedException.java
package com.example.aiimage.exception;
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) { super(message); }
}

// DoubaoApiException.java
package com.example.aiimage.exception;
public class DoubaoApiException extends RuntimeException {
    public DoubaoApiException(String message) { super(message); }
    public DoubaoApiException(String message, Throwable cause) { super(message, cause); }
}
```

- [ ] **Step 3: 创建 GlobalExceptionHandler**

```java
package com.example.aiimage.exception;

import com.example.aiimage.R.AjaxJsonResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public AjaxJsonResult<Void> handleUnauthorized(UnauthorizedException e) {
        return AjaxJsonResult.error(401, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public AjaxJsonResult<Void> handleBusiness(BusinessException e) {
        return AjaxJsonResult.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public AjaxJsonResult<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        return AjaxJsonResult.error(400, msg);
    }

    @ExceptionHandler(DoubaoApiException.class)
    public AjaxJsonResult<Void> handleDoubaoApi(DoubaoApiException e) {
        log.error("豆包 API 异常", e);
        return AjaxJsonResult.error(502, "AI 服务暂时不可用，请稍后重试");
    }

    @ExceptionHandler(Exception.class)
    public AjaxJsonResult<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return AjaxJsonResult.error(500, "系统内部错误");
    }
}
```

- [ ] **Step 4: 创建所有 DTO**

```java
// LoginRequest.java
package com.example.aiimage.model.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    @NotBlank(message = "密码不能为空")
    private String password;
}

// LoginResponse.java
package com.example.aiimage.model.dto;
import lombok.Data;
@Data
public class LoginResponse {
    private String token;
    private String nickname;
    private String role;
    private long expireIn;
}

// ChatRequest.java
package com.example.aiimage.model.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class ChatRequest {
    @NotBlank(message = "提示词不能为空")
    private String prompt;
    private String image; // base64 data URL, 可为 null
}

// T2IRequest.java
package com.example.aiimage.model.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data
public class T2IRequest {
    @NotBlank(message = "提示词不能为空")
    private String prompt;
    private String negativePrompt;
    private String size = "2K";
    private String style;
    private Boolean watermark = false;
}

// I2IRequest.java
package com.example.aiimage.model.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;
@Data
public class I2IRequest {
    @NotBlank(message = "底图路径不能为空")
    private String sourceImagePath;
    @NotBlank(message = "提示词不能为空")
    private String prompt;
    private BigDecimal strength = new BigDecimal("0.7");
    private String size = "2K";
    private String style;
}

// ImageResultVO.java
package com.example.aiimage.model.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class ImageResultVO {
    private Long recordId;
    private String imageUrl;
    private String sourceImageUrl;
    private String prompt;
    private String size;
    private String style;
    private String generateType;
    private LocalDateTime createdAt;
}

// PageResult.java
package com.example.aiimage.model.dto;
import lombok.Data;
import java.util.List;
@Data
public class PageResult<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
}

// UserVO.java
package com.example.aiimage.model.dto;
import lombok.Data;
import java.time.LocalDateTime;
@Data
public class UserVO {
    private Long id;
    private String username;
    private String nickname;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}
```

- [ ] **Step 5: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/R/
git add backend/src/main/java/com/example/aiimage/model/dto/
git add backend/src/main/java/com/example/aiimage/exception/
git commit -m "feat: add unified response, DTOs and global exception handler"
```

---

### Task 4: 基础设施层 (Redis / MinIO / ArkSDK / 鉴权上下文)

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/config/RedisConfig.java`
- Create: `backend/src/main/java/com/example/aiimage/config/RetryConfig.java`
- Create: `backend/src/main/java/com/example/aiimage/config/WebMvcConfig.java`
- Create: `backend/src/main/java/com/example/aiimage/util/ArkServiceUtil.java`
- Create: `backend/src/main/java/com/example/aiimage/util/AuthContext.java`
- Create: `backend/src/main/java/com/example/aiimage/util/SensitiveFilter.java`

**Interfaces:**
- Consumes: Task 1 (application.yml 中的 redis/minio/doubao 配置)
- Produces: `ArkServiceUtil.getArkService()` — 所有 AI 调用的客户端
- Produces: `AuthContext.getCurrentUserId()` / `setCurrentUserId()` — Controller 层获取当前用户

- [ ] **Step 1: 创建 RedisConfig**

```java
package com.example.aiimage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new StringRedisSerializer());
        return template;
    }
}
```

- [ ] **Step 2: 创建 RetryConfig**

```java
package com.example.aiimage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.retry.annotation.EnableRetry;

@Configuration
@EnableRetry
public class RetryConfig {
}
```

- [ ] **Step 3: 创建 WebMvcConfig**

```java
package com.example.aiimage.config;

import com.example.aiimage.interceptor.AuthInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;

    public WebMvcConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/login");
    }
}
```

- [ ] **Step 4: 创建 AuthContext**

```java
package com.example.aiimage.util;

public class AuthContext {
    private static final ThreadLocal<Long> currentUserId = new ThreadLocal<>();

    public static void setCurrentUserId(Long userId) {
        currentUserId.set(userId);
    }

    public static Long getCurrentUserId() {
        Long id = currentUserId.get();
        if (id == null) throw new RuntimeException("未获取到用户上下文");
        return id;
    }

    public static void clear() {
        currentUserId.remove();
    }
}
```

- [ ] **Step 5: 创建 ArkServiceUtil**

```java
package com.example.aiimage.util;

import com.volcengine.ark.runtime.service.ArkService;
import jakarta.annotation.PostConstruct;
import okhttp3.ConnectionPool;
import okhttp3.Dispatcher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.concurrent.TimeUnit;

@Component
public class ArkServiceUtil {

    private static ArkService arkService;

    @Value("${doubao.api-key}")
    private String apiKey;

    @Value("${doubao.base-url}")
    private String baseUrl;

    @PostConstruct
    public void init() {
        ConnectionPool connectionPool = new ConnectionPool(5, 30, TimeUnit.SECONDS);
        Dispatcher dispatcher = new Dispatcher();
        dispatcher.setMaxRequests(10);
        dispatcher.setMaxRequestsPerHost(5);

        arkService = ArkService.builder()
                .dispatcher(dispatcher)
                .connectionPool(connectionPool)
                .baseUrl(baseUrl)
                .apiKey(apiKey)
                .build();
    }

    public static ArkService getArkService() {
        if (arkService == null) {
            throw new RuntimeException("ArkService 未初始化");
        }
        return arkService;
    }

    public static void shutdown() {
        if (arkService != null) {
            arkService.shutdownExecutor();
        }
    }
}
```

- [ ] **Step 6: 创建 SensitiveFilter**

```java
package com.example.aiimage.util;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SensitiveFilter {
    private static final Set<String> SENSITIVE_WORDS = Set.of(
            "暴力", "色情", "赌博", "毒品");

    public List<String> check(String text) {
        if (text == null || text.isBlank()) return List.of();
        return SENSITIVE_WORDS.stream()
                .filter(word -> text.contains(word))
                .collect(Collectors.toList());
    }
}
```

- [ ] **Step 7: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/config/
git add backend/src/main/java/com/example/aiimage/util/
git commit -m "feat: add infra layer - Redis, MinIO, ArkSDK, AuthContext, SensitiveFilter"
```

---

### Task 5: 鉴权模块 (AuthController + AuthInterceptor)

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/service/AuthService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/AuthServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/AuthController.java`
- Create: `backend/src/main/java/com/example/aiimage/interceptor/AuthInterceptor.java`

**Interfaces:**
- Consumes: Task 3 (DTOs), Task 4 (AuthContext, RedisConfig, WebMvcConfig)
- Produces: `POST /api/auth/login`, `POST /api/auth/logout`
- Produces: AuthInterceptor 全局鉴权

- [ ] **Step 1: 创建 AuthService 接口**

```java
package com.example.aiimage.service;

import com.example.aiimage.model.dto.LoginRequest;
import com.example.aiimage.model.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout(String token);
    Long validateToken(String token);
}
```

- [ ] **Step 2: 创建 AuthServiceImpl**

```java
package com.example.aiimage.service.impl;

import com.example.aiimage.exception.BusinessException;
import com.example.aiimage.exception.UnauthorizedException;
import com.example.aiimage.model.dto.LoginRequest;
import com.example.aiimage.model.dto.LoginResponse;
import com.example.aiimage.model.entity.User;
import com.example.aiimage.repository.UserRepository;
import com.example.aiimage.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        if ("DISABLED".equals(user.getStatus())) {
            throw new BusinessException("账号已被禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                "session:" + token,
                String.valueOf(user.getId()),
                7, TimeUnit.DAYS);

        LoginResponse resp = new LoginResponse();
        resp.setToken(token);
        resp.setNickname(user.getNickname());
        resp.setRole(user.getRole());
        resp.setExpireIn(604800);
        return resp;
    }

    @Override
    public void logout(String token) {
        redisTemplate.delete("session:" + token);
    }

    @Override
    public Long validateToken(String token) {
        String userId = redisTemplate.opsForValue().get("session:" + token);
        if (userId == null) {
            throw new UnauthorizedException("登录已过期，请重新登录");
        }
        return Long.parseLong(userId);
    }
}
```

- [ ] **Step 3: 创建 AuthController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.LoginRequest;
import com.example.aiimage.model.dto.LoginResponse;
import com.example.aiimage.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AjaxJsonResult<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return AjaxJsonResult.success("登录成功", response);
    }

    @PostMapping("/logout")
    public AjaxJsonResult<Void> logout(@RequestHeader("Authorization") String token) {
        if (token != null && token.startsWith("Bearer ")) {
            authService.logout(token.substring(7));
        }
        return AjaxJsonResult.success("退出成功", null);
    }
}
```

- [ ] **Step 4: 创建 AuthInterceptor**

```java
package com.example.aiimage.interceptor;

import com.example.aiimage.service.AuthService;
import com.example.aiimage.util.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(401);
            return false;
        }

        String token = authHeader.substring(7);
        Long userId = authService.validateToken(token);
        AuthContext.setCurrentUserId(userId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        AuthContext.clear();
    }
}
```

- [ ] **Step 5: 在 pom.xml 添加 BCrypt 依赖**

```xml
<!-- 在 pom.xml 的 dependencies 中添加 -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-crypto</artifactId>
</dependency>
```

- [ ] **Step 6: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 7: Commit**

```bash
git add backend/pom.xml
git add backend/src/main/java/com/example/aiimage/service/
git add backend/src/main/java/com/example/aiimage/controller/AuthController.java
git add backend/src/main/java/com/example/aiimage/interceptor/
git commit -m "feat: add auth module - login, logout, token validation, interceptor"
```

---

### Task 6: AI 对话模块 (SSE 流式)

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/service/ChatService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/ChatServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/ChatController.java`

**Interfaces:**
- Consumes: Task 5 (AuthContext), Task 4 (ArkServiceUtil), Task 3 (ChatRequest, AjaxJsonResult)
- Produces: `POST /api/chat/completion` (SSE text/event-stream)

- [ ] **Step 1: 创建 ChatService 接口**

```java
package com.example.aiimage.service;

import com.example.aiimage.model.dto.ChatRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface ChatService {
    void streamCompletion(Long userId, ChatRequest request, SseEmitter emitter);
}
```

- [ ] **Step 2: 创建 ChatServiceImpl**

```java
package com.example.aiimage.service.impl;

import com.example.aiimage.model.dto.ChatRequest;
import com.example.aiimage.model.entity.ChatRecord;
import com.example.aiimage.model.enums.ChatType;
import com.example.aiimage.repository.ChatRecordRepository;
import com.example.aiimage.service.ChatService;
import com.example.aiimage.util.ArkServiceUtil;
import com.volcengine.ark.runtime.model.completion.CompletionRequest;
import com.volcengine.ark.runtime.model.completion.CompletionResponse;
import com.volcengine.ark.runtime.service.ArkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRecordRepository chatRecordRepository;
    private static final String MODEL = "doubao-seed-2-0-pro-260215";

    @Override
    public void streamCompletion(Long userId, ChatRequest request, SseEmitter emitter) {
        ArkService arkService = ArkServiceUtil.getArkService();

        List<Map<String, Object>> messages = new ArrayList<>();
        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", request.getPrompt()));

        if (request.getImage() != null && !request.getImage().isBlank()) {
            content.add(Map.of("type", "image_url",
                    "image_url", Map.of("url", request.getImage())));
        }
        messages.add(Map.of("role", "user", "content", content));

        CompletionRequest completionReq = CompletionRequest.builder()
                .model(MODEL)
                .messages(messages)
                .stream(true)
                .maxTokens(4096)
                .build();

        StringBuilder fullAnswer = new StringBuilder();

        arkService.streamCompletions(completionReq).subscribe(
                response -> {
                    String delta = extractDelta(response);
                    if (delta != null && !delta.isBlank()) {
                        fullAnswer.append(delta);
                        emitter.send(SseEmitter.event()
                                .data("{\"token\":\"" + escapeJson(delta) + "\"}"));
                    }
                },
                error -> {
                    log.error("SSE 流异常", error);
                    emitter.completeWithError(error);
                },
                () -> {
                    try {
                        // 保存对话记录
                        ChatRecord record = new ChatRecord();
                        record.setUserId(userId);
                        record.setChatType(request.getImage() != null ?
                                ChatType.IMAGE_TO_TEXT : ChatType.TEXT_TO_TEXT);
                        record.setPrompt(request.getPrompt());
                        record.setAnswer(fullAnswer.toString());
                        chatRecordRepository.save(record);

                        emitter.send(SseEmitter.event().data("{\"done\":true}"));
                        emitter.complete();
                    } catch (Exception e) {
                        log.error("保存对话记录失败", e);
                        emitter.completeWithError(e);
                    }
                }
        );
    }

    private String extractDelta(CompletionResponse response) {
        if (response.getChoices() != null && !response.getChoices().isEmpty()) {
            var choice = response.getChoices().get(0);
            if (choice.getDelta() != null && choice.getDelta().getContent() != null) {
                return choice.getDelta().getContent();
            }
        }
        return null;
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
```

- [ ] **Step 3: 创建 ChatController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.model.dto.ChatRequest;
import com.example.aiimage.service.ChatService;
import com.example.aiimage.util.AuthContext;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(value = "/completion", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamCompletion(@RequestBody @Valid ChatRequest request) {
        Long userId = AuthContext.getCurrentUserId();
        SseEmitter emitter = new SseEmitter(120_000L);
        chatService.streamCompletion(userId, request, emitter);
        return emitter;
    }
}
```

- [ ] **Step 4: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/service/ChatService.java
git add backend/src/main/java/com/example/aiimage/service/impl/ChatServiceImpl.java
git add backend/src/main/java/com/example/aiimage/controller/ChatController.java
git commit -m "feat: add AI chat module with SSE streaming"
```

---

### Task 7: 文生图模块 (T2I)

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/service/T2IService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/T2IServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/service/DoubaoImageService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/DoubaoImageServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/service/MinioService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/MinioServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/T2IController.java`

**Interfaces:**
- Consumes: Task 4 (ArkServiceUtil), Task 5 (AuthContext), Task 3 (T2IRequest, ImageResultVO)
- Produces: `POST /api/t2i/generate`

- [ ] **Step 1: 创建 MinioService 接口与实现**

```java
// MinioService.java
package com.example.aiimage.service;
public interface MinioService {
    String uploadFromUrl(String imageUrl, String bucket, String objectName);
    String getPresignedUrl(String bucket, String objectName);
    void deleteFile(String bucket, String objectName);
}

// MinioServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.service.MinioService;
import io.minio.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class MinioServiceImpl implements MinioService {

    private final MinioClient minioClient;

    public MinioServiceImpl(
            @Value("${minio.endpoint}") String endpoint,
            @Value("${minio.access-key}") String accessKey,
            @Value("${minio.secret-key}") String secretKey) {
        this.minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

    @Override
    public String uploadFromUrl(String imageUrl, String bucket, String objectName) {
        try {
            boolean found = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            URL url = new URL(imageUrl);
            try (InputStream is = url.openStream()) {
                minioClient.putObject(PutObjectArgs.builder()
                        .bucket(bucket)
                        .object(objectName)
                        .stream(is, -1, 10_485_760)
                        .contentType("image/png")
                        .build());
            }
            return objectName;
        } catch (Exception e) {
            log.error("MinIO 上传失败: bucket={}, object={}", bucket, objectName, e);
            throw new RuntimeException("图片上传存储失败");
        }
    }

    @Override
    public String getPresignedUrl(String bucket, String objectName) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .method(io.minio.http.Method.GET)
                            .expiry(1, TimeUnit.HOURS)
                            .build());
        } catch (Exception e) {
            log.error("获取签名 URL 失败", e);
            return null;
        }
    }

    @Override
    public void deleteFile(String bucket, String objectName) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .build());
        } catch (Exception e) {
            log.error("MinIO 删除失败", e);
        }
    }
}
```

- [ ] **Step 2: 创建 DoubaoImageService 接口与实现**

```java
// DoubaoImageService.java
package com.example.aiimage.service;
public interface DoubaoImageService {
    String textToImage(String prompt, String size, String style, Boolean watermark);
    String imageToImage(String sourceImageUrl, String prompt, Double strength,
                         String size, String style);
}

// DoubaoImageServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.exception.DoubaoApiException;
import com.example.aiimage.service.DoubaoImageService;
import com.example.aiimage.util.ArkServiceUtil;
import com.volcengine.ark.runtime.model.images.generation.GenerateImagesRequest;
import com.volcengine.ark.runtime.model.images.generation.ImagesResponse;
import com.volcengine.ark.runtime.model.images.generation.ResponseFormat;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DoubaoImageServiceImpl implements DoubaoImageService {

    @Value("${doubao.t2i-model}")
    private String model;

    @Override
    public String textToImage(String prompt, String size, String style, Boolean watermark) {
        String enrichedPrompt = enrichStylePrompt(prompt, style);

        GenerateImagesRequest request = GenerateImagesRequest.builder()
                .model(model)
                .prompt(enrichedPrompt)
                .size(size)
                .sequentialImageGeneration("disabled")
                .responseFormat("url")
                .stream(false)
                .watermark(watermark != null && watermark)
                .build();

        return callAndExtractUrl(request);
    }

    @Override
    public String imageToImage(String sourceImageUrl, String prompt, Double strength,
                                String size, String style) {
        String enrichedPrompt = enrichStylePrompt(prompt, style);

        GenerateImagesRequest request = GenerateImagesRequest.builder()
                .model(model)
                .prompt(enrichedPrompt)
                .image(sourceImageUrl)
                .size(size)
                .sequentialImageGeneration("disabled")
                .responseFormat("url")
                .stream(false)
                .watermark(true)
                .build();

        return callAndExtractUrl(request);
    }

    private String callAndExtractUrl(GenerateImagesRequest request) {
        try {
            ImagesResponse response = ArkServiceUtil.getArkService()
                    .generateImages(request);

            if (response.getData() == null || response.getData().isEmpty()) {
                throw new DoubaoApiException("豆包 API 返回数据为空");
            }
            String url = response.getData().get(0).getUrl();
            if (url == null || url.isBlank()) {
                throw new DoubaoApiException("豆包 API 返回图片 URL 为空");
            }
            return url;

        } catch (DoubaoApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("调用豆包 API 异常", e);
            throw new DoubaoApiException("图片生成调用失败", e);
        }
    }

    private String enrichStylePrompt(String prompt, String style) {
        if (style == null || style.isBlank()) return prompt;
        return switch (style) {
            case "写实" -> prompt + "，摄影写实风格，8K超高清，真实光影，专业摄影";
            case "二次元" -> prompt + "，二次元动画风格，赛璐珞上色，日系动漫";
            case "插画" -> prompt + "，插画风格，水彩质感，手绘感，艺术感";
            case "3D" -> prompt + "，3D渲染风格，C4D，Octane渲染，体积光，材质细腻";
            case "赛博朋克" -> prompt + "，赛博朋克风格，霓虹灯，赛博格，未来城市";
            default -> prompt;
        };
    }
}
```

- [ ] **Step 3: 创建 T2IService 接口与实现**

```java
// T2IService.java
package com.example.aiimage.service;
import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.T2IRequest;

public interface T2IService {
    AjaxJsonResult<ImageResultVO> generateImage(Long userId, T2IRequest request);
}

// T2IServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.exception.DoubaoApiException;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.T2IRequest;
import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.model.enums.ImageStatus;
import com.example.aiimage.repository.ImageRecordRepository;
import com.example.aiimage.service.DoubaoImageService;
import com.example.aiimage.service.MinioService;
import com.example.aiimage.service.T2IService;
import com.example.aiimage.util.SensitiveFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class T2IServiceImpl implements T2IService {

    private final DoubaoImageService doubaoImageService;
    private final MinioService minioService;
    private final ImageRecordRepository recordRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final SensitiveFilter sensitiveFilter;

    @Override
    @Retryable(retryFor = DoubaoApiException.class, maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2))
    public AjaxJsonResult<ImageResultVO> generateImage(Long userId, T2IRequest request) {
        // 敏感词校验
        List<String> sensitiveWords = sensitiveFilter.check(request.getPrompt());
        if (!sensitiveWords.isEmpty()) {
            return AjaxJsonResult.error(400, "提示词包含敏感词: " + String.join(",", sensitiveWords));
        }

        // 防重复提交
        String lockKey = "t2i:lock:" + userId + ":" + request.getPrompt().hashCode();
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", Duration.ofSeconds(5));
        if (Boolean.FALSE.equals(locked)) {
            return AjaxJsonResult.error(429, "请勿频繁提交相同绘图请求");
        }

        try {
            // 调用豆包
            String doubaoUrl = doubaoImageService.textToImage(
                    request.getPrompt(), request.getSize(),
                    request.getStyle(), request.getWatermark());

            // 下载并上传到 MinIO
            String objectName = String.format("t2i/%d/%s.png", userId, UUID.randomUUID());
            minioService.uploadFromUrl(doubaoUrl, "ai-text-image", objectName);

            // 写数据库
            ImageRecord record = new ImageRecord();
            record.setUserId(userId);
            record.setGenerateType(GenerateType.TEXT_TO_IMAGE);
            record.setPrompt(request.getPrompt());
            record.setNegativePrompt(request.getNegativePrompt());
            record.setSize(request.getSize());
            record.setStyle(request.getStyle());
            record.setResultMinioPath(objectName);
            record.setImageStatus(ImageStatus.SUCCESS);
            recordRepository.save(record);

            // 返回
            ImageResultVO vo = new ImageResultVO();
            vo.setRecordId(record.getId());
            vo.setImageUrl(minioService.getPresignedUrl("ai-text-image", objectName));
            vo.setSize(request.getSize());
            vo.setStyle(request.getStyle());
            vo.setGenerateType("TEXT_TO_IMAGE");
            vo.setCreatedAt(record.getCreatedAt());
            vo.setPrompt(request.getPrompt());

            return AjaxJsonResult.success("图片生成成功", vo);

        } catch (DoubaoApiException e) {
            log.error("豆包调用失败 userId={}", userId, e);
            return AjaxJsonResult.error(502, "AI 绘图服务暂时不可用，请稍后重试");
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}
```

Note: Add `java.util.List` import to T2IServiceImpl.

- [ ] **Step 4: 创建 T2IController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.T2IRequest;
import com.example.aiimage.service.T2IService;
import com.example.aiimage.util.AuthContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/t2i")
public class T2IController {

    private final T2IService t2iService;

    public T2IController(T2IService t2iService) {
        this.t2iService = t2iService;
    }

    @PostMapping("/generate")
    public AjaxJsonResult<ImageResultVO> generate(@RequestBody @Valid T2IRequest request) {
        Long userId = AuthContext.getCurrentUserId();
        return t2iService.generateImage(userId, request);
    }
}
```

- [ ] **Step 5: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/service/MinioService.java
git add backend/src/main/java/com/example/aiimage/service/impl/MinioServiceImpl.java
git add backend/src/main/java/com/example/aiimage/service/DoubaoImageService.java
git add backend/src/main/java/com/example/aiimage/service/impl/DoubaoImageServiceImpl.java
git add backend/src/main/java/com/example/aiimage/service/T2IService.java
git add backend/src/main/java/com/example/aiimage/service/impl/T2IServiceImpl.java
git add backend/src/main/java/com/example/aiimage/controller/T2IController.java
git commit -m "feat: add T2I module with MinIO and DoubaoImage services"
```

---

### Task 8: 图生图 + 历史作品 + 管理员模块

**Files:**
- Create: `backend/src/main/java/com/example/aiimage/service/I2IService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/I2IServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/I2IController.java`
- Create: `backend/src/main/java/com/example/aiimage/service/HistoryService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/HistoryServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/HistoryController.java`
- Create: `backend/src/main/java/com/example/aiimage/service/AdminUserService.java`
- Create: `backend/src/main/java/com/example/aiimage/service/impl/AdminUserServiceImpl.java`
- Create: `backend/src/main/java/com/example/aiimage/controller/AdminUserController.java`

**Interfaces:**
- Consumes: Task 7 (MinioService, DoubaoImageService, repositories)
- Produces: `POST /api/i2i/upload`, `POST /api/i2i/generate`, `GET/DELETE /api/works`, `GET/POST /api/admin/users`, `PUT /api/admin/users/{id}/status`

- [ ] **Step 1: 创建 I2IService 接口与实现**

```java
// I2IService.java
package com.example.aiimage.service;
import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.I2IRequest;
import com.example.aiimage.model.dto.ImageResultVO;
import org.springframework.web.multipart.MultipartFile;

public interface I2IService {
    AjaxJsonResult<ImageResultVO> uploadSourceImage(Long userId, MultipartFile file);
    AjaxJsonResult<ImageResultVO> generateImage(Long userId, I2IRequest request);
}

// I2IServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.exception.DoubaoApiException;
import com.example.aiimage.model.dto.I2IRequest;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.model.enums.ImageStatus;
import com.example.aiimage.repository.ImageRecordRepository;
import com.example.aiimage.service.DoubaoImageService;
import com.example.aiimage.service.I2IService;
import com.example.aiimage.service.MinioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class I2IServiceImpl implements I2IService {

    private final MinioService minioService;
    private final DoubaoImageService doubaoImageService;
    private final ImageRecordRepository recordRepository;
    private final RedisTemplate<String, String> redisTemplate;

    @Override
    public AjaxJsonResult<ImageResultVO> uploadSourceImage(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            return AjaxJsonResult.error(400, "文件不能为空");
        }
        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.matches("(?i).+\\.(jpg|jpeg|png|webp)$")) {
            return AjaxJsonResult.error(400, "仅支持 jpg/png/webp 格式");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            return AjaxJsonResult.error(400, "文件大小不能超过 10MB");
        }

        try {
            String ext = originalName.substring(originalName.lastIndexOf('.'));
            String objectName = String.format("source/%d/%s_%s",
                    userId, LocalDateTime.now().toString().replace(":", ""), UUID.randomUUID() + ext);

            minioService.putObject("ai-source-img", objectName, file.getInputStream(),
                    file.getContentType());

            ImageResultVO vo = new ImageResultVO();
            vo.setImageUrl(minioService.getPresignedUrl("ai-source-img", objectName));
            vo.setSourceImageUrl(vo.getImageUrl());
            return AjaxJsonResult.success("上传成功", vo);

        } catch (Exception e) {
            log.error("上传底图失败", e);
            return AjaxJsonResult.error(500, "上传失败");
        }
    }

    @Override
    @Retryable(retryFor = DoubaoApiException.class, maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2))
    public AjaxJsonResult<ImageResultVO> generateImage(Long userId, I2IRequest request) {
        String lockKey = "i2i:lock:" + userId + ":" + request.getPrompt().hashCode();
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", Duration.ofSeconds(5));
        if (Boolean.FALSE.equals(locked)) {
            return AjaxJsonResult.error(429, "请勿频繁提交相同绘图请求");
        }

        try {
            // 获取底图 Presigned URL
            String sourceUrl = minioService.getPresignedUrl(
                    "ai-source-img", request.getSourceImagePath());

            // 调用豆包图生图
            String doubaoUrl = doubaoImageService.imageToImage(
                    sourceUrl, request.getPrompt(),
                    request.getStrength().doubleValue(),
                    request.getSize(), request.getStyle());

            // 上传成品到 MinIO
            String objectName = String.format("i2i/%d/%s.png", userId, UUID.randomUUID());
            minioService.uploadFromUrl(doubaoUrl, "ai-img2img-out", objectName);

            // 写数据库
            ImageRecord record = new ImageRecord();
            record.setUserId(userId);
            record.setGenerateType(GenerateType.IMAGE_TO_IMAGE);
            record.setPrompt(request.getPrompt());
            record.setSize(request.getSize());
            record.setStyle(request.getStyle());
            record.setSimilarStrength(request.getStrength());
            record.setSourceMinioPath(request.getSourceImagePath());
            record.setResultMinioPath(objectName);
            record.setImageStatus(ImageStatus.SUCCESS);
            recordRepository.save(record);

            ImageResultVO vo = new ImageResultVO();
            vo.setRecordId(record.getId());
            vo.setImageUrl(minioService.getPresignedUrl("ai-img2img-out", objectName));
            vo.setSourceImageUrl(sourceUrl);
            vo.setSize(request.getSize());
            vo.setStyle(request.getStyle());
            vo.setGenerateType("IMAGE_TO_IMAGE");
            vo.setCreatedAt(record.getCreatedAt());
            vo.setPrompt(request.getPrompt());

            return AjaxJsonResult.success("图片生成成功", vo);

        } catch (DoubaoApiException e) {
            log.error("豆包 i2i 调用失败", e);
            return AjaxJsonResult.error(502, "AI 绘图服务暂时不可用");
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}
```

Note: I2IServiceImpl references `minioService.putObject()` which doesn't exist yet in MinioServiceImpl. Need to add that method. Let me revise - we already have `uploadFromUrl`, but for direct file upload from MultipartFile we need `putObject`. Let me add it.

Add this method to MinioServiceImpl:
```java
public String putObject(String bucket, String objectName, InputStream inputStream, String contentType) {
    try {
        minioClient.putObject(PutObjectArgs.builder()
                .bucket(bucket)
                .object(objectName)
                .stream(inputStream, -1, 10_485_760)
                .contentType(contentType)
                .build());
        return objectName;
    } catch (Exception e) {
        log.error("MinIO 上传失败", e);
        throw new RuntimeException("上传失败");
    }
}
```

And add the import `java.io.InputStream` and `import java.io.InputStream;` to the MinioService interface.

- [ ] **Step 2: 创建 I2IController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.I2IRequest;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.service.I2IService;
import com.example.aiimage.util.AuthContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/i2i")
public class I2IController {

    private final I2IService i2iService;

    public I2IController(I2IService i2iService) {
        this.i2iService = i2iService;
    }

    @PostMapping("/upload")
    public AjaxJsonResult<ImageResultVO> upload(@RequestParam("file") MultipartFile file) {
        Long userId = AuthContext.getCurrentUserId();
        return i2iService.uploadSourceImage(userId, file);
    }

    @PostMapping("/generate")
    public AjaxJsonResult<ImageResultVO> generate(@RequestBody @Valid I2IRequest request) {
        Long userId = AuthContext.getCurrentUserId();
        return i2iService.generateImage(userId, request);
    }
}
```

- [ ] **Step 3: 创建 HistoryService 接口与实现**

```java
// HistoryService.java
package com.example.aiimage.service;
import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;
import java.util.List;

public interface HistoryService {
    AjaxJsonResult<PageResult<ImageResultVO>> listRecords(
            Long userId, String type, int page, int size);
    AjaxJsonResult<ImageResultVO> getRecord(Long userId, Long recordId);
    AjaxJsonResult<Void> deleteRecord(Long userId, Long recordId);
}

// HistoryServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.repository.ImageRecordRepository;
import com.example.aiimage.service.HistoryService;
import com.example.aiimage.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HistoryServiceImpl implements HistoryService {

    private final ImageRecordRepository recordRepository;
    private final MinioService minioService;

    @Override
    public AjaxJsonResult<PageResult<ImageResultVO>> listRecords(
            Long userId, String type, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ImageRecord> recordPage;

        if (type != null && !type.isBlank()) {
            GenerateType generateType = GenerateType.valueOf(type);
            recordPage = recordRepository.findByUserIdAndGenerateTypeOrderByCreatedAtDesc(
                    userId, generateType, pageRequest);
        } else {
            recordPage = recordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        }

        List<ImageResultVO> list = recordPage.getContent().stream().map(r -> {
            ImageResultVO vo = new ImageResultVO();
            vo.setRecordId(r.getId());
            vo.setPrompt(r.getPrompt());
            vo.setSize(r.getSize());
            vo.setStyle(r.getStyle());
            vo.setGenerateType(r.getGenerateType().name());
            vo.setCreatedAt(r.getCreatedAt());

            String bucket = r.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                    ? "ai-text-image" : "ai-img2img-out";
            vo.setImageUrl(minioService.getPresignedUrl(bucket, r.getResultMinioPath()));
            return vo;
        }).toList();

        PageResult<ImageResultVO> pageResult = new PageResult<>();
        pageResult.setContent(list);
        pageResult.setPage(page);
        pageResult.setSize(size);
        pageResult.setTotalElements(recordPage.getTotalElements());
        pageResult.setTotalPages(recordPage.getTotalPages());

        return AjaxJsonResult.success("查询成功", pageResult);
    }

    @Override
    public AjaxJsonResult<ImageResultVO> getRecord(Long userId, Long recordId) {
        ImageRecord record = recordRepository.findByIdAndUserId(recordId, userId)
                .orElse(null);
        if (record == null) {
            return AjaxJsonResult.error(404, "记录不存在");
        }
        ImageResultVO vo = new ImageResultVO();
        vo.setRecordId(record.getId());
        vo.setPrompt(record.getPrompt());
        vo.setSize(record.getSize());
        vo.setStyle(record.getStyle());
        vo.setGenerateType(record.getGenerateType().name());
        vo.setCreatedAt(record.getCreatedAt());

        String bucket = record.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                ? "ai-text-image" : "ai-img2img-out";
        vo.setImageUrl(minioService.getPresignedUrl(bucket, record.getResultMinioPath()));
        return AjaxJsonResult.success("查询成功", vo);
    }

    @Override
    public AjaxJsonResult<Void> deleteRecord(Long userId, Long recordId) {
        ImageRecord record = recordRepository.findByIdAndUserId(recordId, userId)
                .orElse(null);
        if (record == null) {
            return AjaxJsonResult.error(404, "记录不存在");
        }

        // 删除 MinIO 文件
        String bucket = record.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                ? "ai-text-image" : "ai-img2img-out";
        minioService.deleteFile(bucket, record.getResultMinioPath());
        if (record.getSourceMinioPath() != null) {
            minioService.deleteFile("ai-source-img", record.getSourceMinioPath());
        }

        recordRepository.delete(record);
        return AjaxJsonResult.success("删除成功", null);
    }
}
```

- [ ] **Step 4: 创建 HistoryController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.service.HistoryService;
import com.example.aiimage.util.AuthContext;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/works")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public AjaxJsonResult<PageResult<ImageResultVO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.listRecords(userId, type, page, size);
    }

    @GetMapping("/{id}")
    public AjaxJsonResult<ImageResultVO> detail(@PathVariable Long id) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.getRecord(userId, id);
    }

    @DeleteMapping("/{id}")
    public AjaxJsonResult<Void> delete(@PathVariable Long id) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.deleteRecord(userId, id);
    }
}
```

- [ ] **Step 5: 创建 AdminUserService 接口与实现**

```java
// AdminUserService.java
package com.example.aiimage.service;
import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;

public interface AdminUserService {
    AjaxJsonResult<PageResult<UserVO>> listUsers(int page, int size, String keyword);
    AjaxJsonResult<UserVO> createUser(String username, String password, String nickname);
    AjaxJsonResult<Void> toggleUserStatus(Long userId, String status);
}

// AdminUserServiceImpl.java
package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.exception.BusinessException;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;
import com.example.aiimage.model.entity.User;
import com.example.aiimage.repository.UserRepository;
import com.example.aiimage.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public AjaxJsonResult<PageResult<UserVO>> listUsers(int page, int size, String keyword) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<User> userPage;

        if (keyword != null && !keyword.isBlank()) {
            userPage = userRepository.findByUsernameContaining(keyword, pageRequest);
        } else {
            userPage = userRepository.findAll(pageRequest);
        }

        List<UserVO> list = userPage.getContent().stream().map(u -> {
            UserVO vo = new UserVO();
            vo.setId(u.getId());
            vo.setUsername(u.getUsername());
            vo.setNickname(u.getNickname());
            vo.setRole(u.getRole());
            vo.setStatus(u.getStatus());
            vo.setCreatedAt(u.getCreatedAt());
            return vo;
        }).toList();

        PageResult<UserVO> result = new PageResult<>();
        result.setContent(list);
        result.setPage(page);
        result.setSize(size);
        result.setTotalElements(userPage.getTotalElements());
        result.setTotalPages(userPage.getTotalPages());

        return AjaxJsonResult.success(result);
    }

    @Override
    public AjaxJsonResult<UserVO> createUser(String username, String password, String nickname) {
        if (userRepository.findByUsername(username).isPresent()) {
            return AjaxJsonResult.error(400, "用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname != null ? nickname : username);
        user.setRole("USER");
        user.setStatus("ENABLED");
        userRepository.save(user);

        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setRole(user.getRole());
        vo.setStatus(user.getStatus());
        return AjaxJsonResult.success("用户创建成功", vo);
    }

    @Override
    public AjaxJsonResult<Void> toggleUserStatus(Long userId, String status) {
        if (userId == 1) {
            return AjaxJsonResult.error(400, "不能禁用 admin 账号");
        }
        User user = userRepository.findById(userId)
                .orElse(null);
        if (user == null) {
            return AjaxJsonResult.error(404, "用户不存在");
        }
        user.setStatus(status);
        userRepository.save(user);
        return AjaxJsonResult.success("用户状态更新成功", null);
    }
}
```

Note: Need to add `findByUsernameContaining` to UserRepository:
```java
Page<User> findByUsernameContaining(String keyword, Pageable pageable);
```

- [ ] **Step 6: 创建 AdminUserController**

```java
package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;
import com.example.aiimage.service.AdminUserService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public AjaxJsonResult<PageResult<UserVO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return adminUserService.listUsers(page, size, keyword);
    }

    @PostMapping
    public AjaxJsonResult<UserVO> create(@RequestBody Map<String, String> body) {
        return adminUserService.createUser(
                body.get("username"),
                body.get("password"),
                body.get("nickname"));
    }

    @PutMapping("/{id}/status")
    public AjaxJsonResult<Void> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return adminUserService.toggleUserStatus(id, body.get("status"));
    }
}
```

- [ ] **Step 7: Compile 验证**

```bash
cd backend && mvn clean compile -q
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/com/example/aiimage/service/I2IService.java
git add backend/src/main/java/com/example/aiimage/service/impl/I2IServiceImpl.java
git add backend/src/main/java/com/example/aiimage/controller/I2IController.java
git add backend/src/main/java/com/example/aiimage/service/HistoryService.java
git add backend/src/main/java/com/example/aiimage/service/impl/HistoryServiceImpl.java
git add backend/src/main/java/com/example/aiimage/controller/HistoryController.java
git add backend/src/main/java/com/example/aiimage/service/AdminUserService.java
git add backend/src/main/java/com/example/aiimage/service/impl/AdminUserServiceImpl.java
git add backend/src/main/java/com/example/aiimage/controller/AdminUserController.java
git add backend/src/main/java/com/example/aiimage/repository/UserRepository.java
git commit -m "feat: add I2I, History and Admin modules"
```

---

### Task 9: 前端脚手架搭建

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/api/request.js`
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/components/AuthGuard.jsx`
- Create: `frontend/src/components/ImagePreview.jsx`
- Create: `frontend/Dockerfile`

**Interfaces:**
- Consumes: (none — first frontend task)
- Produces: 可运行的 React + Ant Design + Vite 基础项目

- [ ] **Step 1: 初始化 Vite React 项目**

```bash
cd frontend
npm create vite@latest . -- --template react
npm install antd @ant-design/icons axios react-router-dom
```

- [ ] **Step 2: 配置 vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
```

- [ ] **Step 3: 创建 API 请求封装 request.js**

```js
import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default request;
```

- [ ] **Step 4: 创建 Navbar**

```jsx
import { Layout, Menu, Dropdown, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header } = Layout;

const menuItems = [
  { key: '/chat', label: 'AI对话' },
  { key: '/t2i', label: '文生图' },
  { key: '/i2i', label: '图生图' },
  { key: '/works', label: '我的作品' },
];

const adminItem = { key: '/admin/users', label: '账号管理' };

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = user?.role === 'ADMIN' ? [...menuItems, adminItem] : menuItems;

  return (
    <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 40,
                    cursor: 'pointer' }} onClick={() => navigate('/t2i')}>
        AI 生图平台
      </div>
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Dropdown menu={{
        items: [{
          key: 'logout', icon: <LogoutOutlined />, label: '退出登录',
          onClick: onLogout
        }]
      }}>
        <Button type="text" style={{ color: '#fff' }}>
          <UserOutlined /> {user?.nickname || '用户'}
        </Button>
      </Dropdown>
    </Header>
  );
}
```

- [ ] **Step 5: 创建 AuthGuard**

```jsx
import { Navigate } from 'react-router-dom';

export default function AuthGuard({ children, requireAdmin }) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && role !== 'ADMIN') return <Navigate to="/t2i" replace />;

  return children;
}
```

- [ ] **Step 6: 创建 ImagePreview 组件**

```jsx
import { Modal, Image } from 'antd';

export default function ImagePreview({ open, imageUrl, prompt, onClose }) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={800}
           title={prompt?.substring(0, 50)}>
      {imageUrl && <Image src={imageUrl} style={{ width: '100%' }} />}
    </Modal>
  );
}
```

- [ ] **Step 7: 创建 App.jsx（路由配置）**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import { useState } from 'react';
import Navbar from './components/Navbar';
import AuthGuard from './components/AuthGuard';
import Login from './pages/Login';
import Chat from './pages/Chat';
import T2I from './pages/T2I';
import I2I from './pages/I2I';
import Works from './pages/Works';
import AdminUsers from './pages/AdminUsers';

const { Content } = Layout;

export default function App() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const [user, setUser] = useState(token ? {
    nickname: localStorage.getItem('nickname'),
    role: localStorage.getItem('role'),
  } : null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <ConfigProvider>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <Content style={{ padding: user ? '24px' : 0 }}>
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/t2i" replace /> : <Login onLogin={handleLogin} />
              } />
              <Route path="/chat" element={
                <AuthGuard><Chat /></AuthGuard>
              } />
              <Route path="/t2i" element={
                <AuthGuard><T2I /></AuthGuard>
              } />
              <Route path="/i2i" element={
                <AuthGuard><I2I /></AuthGuard>
              } />
              <Route path="/works" element={
                <AuthGuard><Works /></AuthGuard>
              } />
              <Route path="/admin/users" element={
                <AuthGuard requireAdmin><AdminUsers /></AuthGuard>
              } />
              <Route path="*" element={<Navigate to="/t2i" replace />} />
            </Routes>
          </Content>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: init frontend with Vite, React, Ant Design, routing"
```

---

### Task 10: 前端页面 — 登录 + AI对话

**Files:**
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/pages/Chat.jsx`
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/api/chat.js`

**Interfaces:**
- Consumes: Task 9 (request.js, App.jsx routing)
- Produces: 登录页 + AI 对话页

- [ ] **Step 1: 创建 auth.js**

```js
import request from './request';

export function login(data) {
  return request.post('/auth/login', data);
}

export function logout() {
  return request.post('/auth/logout');
}
```

- [ ] **Step 2: 创建 Login.jsx**

```jsx
import { useState } from 'react';
import { Form, Input, Button, Card, Checkbox, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '../api/auth';

const { Title } = Typography;

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await login({ username: values.username, password: values.password });
      if (res.code === 200) {
        const { token, nickname, role } = res.data;

        if (values.remember) {
          localStorage.setItem('token', token);
          localStorage.setItem('nickname', nickname);
          localStorage.setItem('role', role);
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('nickname', nickname);
          sessionStorage.setItem('role', role);
        }

        onLogin({ nickname, role });
        message.success('登录成功');
      } else {
        message.error(res.message);
      }
    } catch (e) {
      message.error('登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center',
                  alignItems: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: 'center' }}>AI 生图平台</Title>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住登录状态</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: 创建 chat.js**

```js
import request from './request';

export function streamChat(prompt, image, onToken, onDone, onError) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const controller = new AbortController();

  fetch('/api/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, image }),
    signal: controller.signal,
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data: '));

      for (const line of lines) {
        const json = line.slice(6);
        try {
          const data = JSON.parse(json);
          if (data.done) {
            onDone();
          } else if (data.token) {
            onToken(data.token);
          }
        } catch (e) {
          // parse error, skip
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onError?.(err);
    }
  });

  return () => controller.abort();
}
```

- [ ] **Step 4: 创建 Chat.jsx**

```jsx
import { useState, useRef } from 'react';
import { Input, Button, Upload, message, Typography } from 'antd';
import { SendOutlined, PaperClipOutlined } from '@ant-design/icons';
import { streamChat } from '../api/chat';

const { TextArea } = Input;

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState(null);
  const abortRef = useRef(null);

  const handleSend = () => {
    if (!input.trim() && !imageBase64) return;

    const userMsg = { role: 'user', content: input, image: imageBase64 };
    const aiMsg = { role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setImageBase64(null);
    setLoading(true);

    const cancel = streamChat(
      input,
      imageBase64,
      (token) => {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content += token;
          return newMsgs;
        });
      },
      () => setLoading(false),
      () => {
        message.error('对话出错');
        setLoading(false);
      }
    );

    abortRef.current = cancel;
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageBase64(e.target.result);
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex',
                  flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fff',
                    borderRadius: 8, marginBottom: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Typography.Text strong>{msg.role === 'user' ? '🧑 你' : '🤖 AI'}</Typography.Text>
            <div style={{ background: msg.role === 'user' ? '#e6f7ff' : '#f6f6f6',
                          padding: '8px 12px', borderRadius: 8, marginTop: 4,
                          whiteSpace: 'pre-wrap' }}>
              {msg.content}
              {msg.role === 'assistant' && msg.content === '' && loading &&
                <Typography.Text type="secondary">AI 正在输入...</Typography.Text>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Upload beforeUpload={handleImageUpload} showUploadList={false} accept="image/*">
          <Button icon={<PaperClipOutlined />} />
        </Upload>
        {imageBase64 && (
          <img src={imageBase64} alt="preview" style={{ height: 60, borderRadius: 4 }} />
        )}
        <TextArea
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="输入消息，Enter 发送..."
          rows={2}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend}
                loading={loading} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Login.jsx
git add frontend/src/pages/Chat.jsx
git add frontend/src/api/auth.js
git add frontend/src/api/chat.js
git commit -m "feat: add Login and AI Chat pages"
```

---

### Task 11: 前端页面 — 文生图 + 图生图

**Files:**
- Create: `frontend/src/pages/T2I.jsx`
- Create: `frontend/src/pages/I2I.jsx`
- Create: `frontend/src/api/t2i.js`
- Create: `frontend/src/api/i2i.js`

**Interfaces:**
- Consumes: Task 9 (request.js), Task 10 (ImagePreview)
- Produces: 文生图页 + 图生图页

- [ ] **Step 1: 创建 t2i.js**

```js
import request from './request';

export function generateT2I(data) {
  return request.post('/t2i/generate', data);
}
```

- [ ] **Step 2: 创建 T2I.jsx**

```jsx
import { useState } from 'react';
import { Card, Row, Col, Input, Select, Slider, Switch, Button, Image, message,
         Space, Typography } from 'antd';

const { TextArea } = Input;

export default function T2I() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [size, setSize] = useState('2K');
  const [style, setStyle] = useState('写实');
  const [watermark, setWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('请输入正向提示词');
      return;
    }
    setLoading(true);
    setImageUrl(null);

    try {
      const { default: api } = await import('../api/t2i');
      const res = await api.generateT2I({ prompt, negativePrompt, size, style, watermark });

      if (res.code === 200) {
        setImageUrl(res.data.imageUrl);
        message.success('生成成功');
      } else {
        message.error(res.message);
      }
    } catch (e) {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={24} style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Col span={10}>
        <Card title="📝 参数配置">
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>正向提示词</Typography.Text>
            <TextArea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
                      placeholder="描述你想生成的画面..." maxLength={2000} showCount />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong>反向提示词（可选）</Typography.Text>
            <TextArea rows={2} value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
                      placeholder="不想出现的元素..." />
          </div>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text>尺寸</Typography.Text>
                <Select value={size} onChange={setSize} style={{ width: '100%' }}
                        options={['1K', '2K', '4K'].map(v => ({ label: v, value: v }))} />
              </Col>
              <Col span={12}>
                <Typography.Text>画风</Typography.Text>
                <Select value={style} onChange={setStyle} style={{ width: '100%' }}
                        options={['写实', '二次元', '插画', '3D', '赛博朋克']
                          .map(v => ({ label: v, value: v }))} />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text>水印</Typography.Text>
                <Switch checked={watermark} onChange={setWatermark}
                        style={{ marginLeft: 8 }} />
              </Col>
            </Row>
          </Space>
          <Button type="primary" size="large" block style={{ marginTop: 16 }}
                  onClick={handleGenerate} loading={loading}>
            🎨 开始生成
          </Button>
        </Card>
      </Col>
      <Col span={14}>
        <Card title="🖼 生成预览" style={{ minHeight: 400 }}>
          {loading && <Typography.Text>正在生成中...</Typography.Text>}
          {imageUrl && !loading && <Image src={imageUrl} style={{ width: '100%' }} />}
        </Card>
      </Col>
    </Row>
  );
}
```

- [ ] **Step 3: 创建 i2i.js**

```js
import request from './request';

export function uploadSourceImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/i2i/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export function generateI2I(data) {
  return request.post('/i2i/generate', data);
}
```

- [ ] **Step 4: 创建 I2I.jsx**

```jsx
import { useState } from 'react';
import { Card, Row, Col, Upload, Input, Slider, Button, Image, message,
         Select, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { TextArea } = Input;

export default function I2I() {
  const [sourceImageUrl, setSourceImageUrl] = useState(null);
  const [sourceImagePath, setSourceImagePath] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [strength, setStrength] = useState(0.7);
  const [size, setSize] = useState('2K');
  const [style, setStyle] = useState('写实');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);

  const handleUpload = async (file) => {
    try {
      const { default: api } = await import('../api/i2i');
      const res = await api.uploadSourceImage(file);
      if (res.code === 200) {
        setSourceImageUrl(res.data.imageUrl);
        setSourceImagePath(res.data.sourceImageUrl);
        message.success('上传成功');
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('上传失败');
    }
    return false;
  };

  const handleGenerate = async () => {
    if (!sourceImagePath) { message.warning('请先上传底图'); return; }
    if (!prompt.trim()) { message.warning('请输入提示词'); return; }

    setLoading(true);
    try {
      const { default: api } = await import('../api/i2i');
      const res = await api.generateI2I({
        sourceImagePath, prompt, strength, size, style
      });
      if (res.code === 200) {
        setResultUrl(res.data.imageUrl);
        message.success('生成成功');
      } else {
        message.error(res.message);
      }
    } catch {
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={24} style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Col span={10}>
        <Card title="📤 上传底图">
          <Dragger beforeUpload={handleUpload} showUploadList={false}
                   accept=".jpg,.jpeg,.png,.webp">
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p>拖拽或点击上传底图（jpg/png/webp，≤10MB）</p>
          </Dragger>
          {sourceImageUrl && (
            <Image src={sourceImageUrl} style={{ width: '100%', marginTop: 16 }} />
          )}
        </Card>
        <Card title="📝 提示词" style={{ marginTop: 16 }}>
          <TextArea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="描述目标画面..." />
          <div style={{ marginTop: 16 }}>
            <Typography.Text>重绘强度: {strength.toFixed(1)}</Typography.Text>
            <Slider min={0} max={1} step={0.1} value={strength}
                    onChange={setStrength} />
          </div>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Select value={size} onChange={setSize} style={{ width: '100%' }}
                      options={['1K', '2K', '4K'].map(v => ({ label: v, value: v }))} />
            </Col>
            <Col span={12}>
              <Select value={style} onChange={setStyle} style={{ width: '100%' }}
                      options={['写实', '二次元', '插画', '3D', '赛博朋克']
                        .map(v => ({ label: v, value: v }))} />
            </Col>
          </Row>
          <Button type="primary" size="large" block style={{ marginTop: 16 }}
                  onClick={handleGenerate} loading={loading}>
            🎨 开始生成
          </Button>
        </Card>
      </Col>
      <Col span={14}>
        <Card title="🖼 生成结果" style={{ minHeight: 300 }}>
          {resultUrl && (
            <Row gutter={16}>
              <Col span={12}>
                <Typography.Text strong>原图</Typography.Text>
                <Image src={sourceImageUrl} style={{ width: '100%' }} />
              </Col>
              <Col span={12}>
                <Typography.Text strong>新图</Typography.Text>
                <Image src={resultUrl} style={{ width: '100%' }} />
              </Col>
            </Row>
          )}
          {!resultUrl && loading &&
            <Typography.Text>正在生成中...</Typography.Text>}
        </Card>
      </Col>
    </Row>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/T2I.jsx
git add frontend/src/pages/I2I.jsx
git add frontend/src/api/t2i.js
git add frontend/src/api/i2i.js
git commit -m "feat: add T2I and I2I pages"
```

---

### Task 12: 前端页面 — 我的作品 + 管理员账号管理

**Files:**
- Create: `frontend/src/pages/Works.jsx`
- Create: `frontend/src/pages/AdminUsers.jsx`
- Create: `frontend/src/api/works.js`
- Create: `frontend/src/api/admin.js`

**Interfaces:**
- Consumes: Task 9 (request.js, ImagePreview)
- Produces: 我的作品页 + 管理员账号管理页

- [ ] **Step 1: 创建 works.js**

```js
import request from './request';

export function listWorks(params) {
  return request.get('/works', { params });
}

export function deleteWork(id) {
  return request.delete(`/works/${id}`);
}
```

- [ ] **Step 2: 创建 Works.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Image, Button, Pagination,
         Modal, message, Empty, Space, Tag } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { listWorks, deleteWork } from '../api/works';

const { RangePicker } = DatePicker;

export default function Works() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listWorks({ page, size: 12, type });
      if (res.code === 200) {
        setRecords(res.data.content);
        setTotal(res.data.totalElements);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, type]);

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除该作品吗？',
      onOk: async () => {
        const res = await deleteWork(id);
        if (res.code === 200) {
          message.success('删除成功');
          fetchData();
        } else {
          message.error(res.message);
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="全部类型"
            allowClear
            style={{ width: 150 }}
            onChange={v => { setType(v || null); setPage(0); }}
            options={[
              { label: '全部', value: '' },
              { label: '文生图', value: 'TEXT_TO_IMAGE' },
              { label: '图生图', value: 'IMAGE_TO_IMAGE' },
            ]}
          />
        </Space>

        {records.length === 0 && !loading && (
          <Empty description="暂无作品" />
        )}

        <Row gutter={[16, 16]}>
          {records.map(r => (
            <Col key={r.recordId} span={6}>
              <Card
                hoverable
                cover={
                  <Image src={r.imageUrl} preview={{ src: r.imageUrl }}
                         style={{ height: 200, objectFit: 'cover' }}
                         onClick={() => setPreviewUrl(r.imageUrl)} />
                }
                actions={[
                  <EyeOutlined key="preview"
                    onClick={() => setPreviewUrl(r.imageUrl)} />,
                  <DeleteOutlined key="delete"
                    onClick={() => handleDelete(r.recordId)} />,
                ]}
              >
                <Card.Meta
                  title={<Tag>{r.generateType === 'TEXT_TO_IMAGE' ? '文生图' : '图生图'}</Tag>}
                  description={r.createdAt?.substring(0, 10)}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {total > 12 && (
          <Pagination
            current={page + 1}
            total={total}
            pageSize={12}
            onChange={p => setPage(p - 1)}
            style={{ marginTop: 16, textAlign: 'center' }}
          />
        )}
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: 创建 admin.js**

```js
import request from './request';

export function listUsers(params) {
  return request.get('/admin/users', { params });
}

export function createUser(data) {
  return request.post('/admin/users', data);
}

export function toggleUserStatus(id, status) {
  return request.put(`/admin/users/${id}/status`, { status });
}
```

- [ ] **Step 4: 创建 AdminUsers.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Input, Space, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { listUsers, createUser, toggleUserStatus } from '../api/admin';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, size: 20, keyword });
      if (res.code === 200) {
        setUsers(res.data.content);
        setTotal(res.data.totalElements);
      }
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = async () => {
    if (!newUsername || !newPassword) {
      message.warning('请填写完整信息');
      return;
    }
    const res = await createUser({ username: newUsername, password: newPassword });
    if (res.code === 200) {
      message.success('创建成功');
      setModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    const res = await toggleUserStatus(id, newStatus);
    if (res.code === 200) {
      message.success('状态已更新');
      fetchData();
    } else {
      message.error(res.message);
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '角色', dataIndex: 'role', render: r =>
      <Tag color={r === 'ADMIN' ? 'red' : 'blue'}>{r}</Tag> },
    { title: '状态', dataIndex: 'status', render: s =>
      <Tag color={s === 'ENABLED' ? 'green' : 'red'}>
        {s === 'ENABLED' ? '启用' : '禁用'}
      </Tag> },
    { title: '创建时间', dataIndex: 'createdAt' },
    {
      title: '操作',
      render: (_, record) => (
        <Popconfirm
          title={record.status === 'ENABLED' ? '确定禁用该用户？' : '确定启用该用户？'}
          onConfirm={() => handleToggleStatus(record.id, record.status)}
        >
          <Button type="link" danger={record.status === 'ENABLED'}>
            {record.status === 'ENABLED' ? '禁用' : '启用'}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input prefix={<SearchOutlined />} placeholder="搜索用户名"
                 value={keyword} onChange={e => setKeyword(e.target.value)}
                 onPressEnter={() => { setPage(0); fetchData(); }} />
          <Button type="primary" icon={<PlusOutlined />}
                  onClick={() => setModalOpen(true)}>新增用户</Button>
        </Space>

        <Table dataSource={users} columns={columns} rowKey="id"
               loading={loading}
               pagination={{
                 current: page + 1, total, pageSize: 20,
                 onChange: p => setPage(p - 1),
               }} />
      </Card>

      <Modal title="新增用户" open={modalOpen}
             onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input placeholder="用户名" value={newUsername}
                 onChange={e => setNewUsername(e.target.value)} />
          <Input.Password placeholder="初始密码" value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} />
        </Space>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Works.jsx
git add frontend/src/pages/AdminUsers.jsx
git add frontend/src/api/works.js
git add frontend/src/api/admin.js
git commit -m "feat: add Works and Admin Users pages"
```

---

### Task 13: Docker Compose 部署配置

**Files:**
- Create: `deploy/docker-compose.yml`
- Create: `deploy/nginx/nginx.conf`
- Create: `deploy/.env.example`

**Interfaces:**
- Consumes: Task 1 (backend/Dockerfile), Task 9 (frontend/Dockerfile)
- Produces: 一键部署的 Docker Compose 编排

- [ ] **Step 1: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: ai-image-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ai_image_db
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-postgres} -d ai_image_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai-image-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-}
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  minio:
    image: minio/minio:latest
    container_name: ai-image-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 10s
      retries: 3

  init-buckets:
    image: minio/mc:latest
    container_name: ai-image-init-buckets
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      sleep 2 &&
      mc alias set myminio http://minio:9000 ${MINIO_ACCESS_KEY:-minioadmin} ${MINIO_SECRET_KEY:-minioadmin} &&
      mc mb myminio/ai-text-image --ignore-existing &&
      mc mb myminio/ai-img2img-out --ignore-existing &&
      mc mb myminio/ai-source-img --ignore-existing &&
      echo 'MinIO buckets created'
      "

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    image: ai-image-backend:latest
    container_name: ai-image-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DB_HOST: postgres
      DB_USERNAME: ${DB_USERNAME:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      REDIS_HOST: redis
      REDIS_PASSWORD: ${REDIS_PASSWORD:-}
      MINIO_HOST: minio
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
      ARK_API_KEY: ${ARK_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy

  nginx:
    image: nginx:1.25-alpine
    container_name: ai-image-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ../frontend/dist:/usr/share/nginx/html
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

- [ ] **Step 2: 创建 Nginx 配置**

```nginx
events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:8080;
    }

    server {
        listen 80;
        server_name localhost;

        gzip on;
        gzip_types text/plain application/json image/png image/jpeg;
        gzip_min_length 1024;

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 10s;
            proxy_read_timeout 120s;
            proxy_send_timeout 30s;
        }

        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;
            expires 7d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

- [ ] **Step 3: 创建 .env.example**

```bash
# 数据库
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Redis
REDIS_PASSWORD=

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# 豆包 API
ARK_API_KEY=your-api-key-here
```

- [ ] **Step 4: Commit**

```bash
git add deploy/
git commit -m "feat: add Docker Compose deployment config"
```

---

## 自检

1. **Spec 覆盖度**: 规格文档中所有 12 个 API、3 张表、6 个前端页面都有对应任务。SSE 流式对话、MinIO 签名 URL、Redis 限流/锁、AuthInterceptor、角色权限均有覆盖。
2. **无占位符**: 所有步骤均包含完整代码，无 "TBD" 或 "implement later"。
3. **类型一致性**: `AjaxJsonResult<T>` 在 Task 3 定义，后续所有 Controller 统一使用。`ChatRequest.image` 在 Task 3 定义，Task 6 使用。所有枚举名称、DTO 字段名跨任务一致。
4. **Missing**: 需要在 UserRepository 中添加 `findByUsernameContaining(String keyword, Pageable pageable)`（Task 8 的 Step 5 中有标注）。需要在 MinioService 中添加 `putObject()` 方法（Task 8 Step 1 中有标注）。
