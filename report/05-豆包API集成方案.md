# 5. 豆包 API 集成方案

## 5.1 集成方式对比

| 方案 | 优点 | 缺点 | 本项目选择 |
|------|------|------|-----------|
| 火山引擎 Ark Java SDK | 官方维护、类型安全、连接池管理 | 依赖版本需匹配 | ✅ **首选** |
| Spring AI OpenAI 兼容模式 | Spring AI 统一抽象 | 需要适配 baseUrl | 备选 |
| 原生 HTTP 调用 (RestTemplate) | 无依赖、灵活 | 需手动处理序列化/重试 | 不推荐 |

本项目选择 **火山引擎 Ark Java SDK** 作为主要集成方式，结合 `Spring Retry` 实现重试容错。

## 5.2 Ark SDK 依赖

```xml
<!-- 火山引擎 Ark Runtime SDK -->
<dependency>
    <groupId>com.volcengine</groupId>
    <artifactId>volcengine-java-sdk-ark-runtime</artifactId>
    <version>LATEST</version>
</dependency>
```

## 5.3 SDK 客户端初始化

### ArkServiceUtil (单例 Spring Bean)

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
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("doubao.api-key 未配置");
        }

        ConnectionPool connectionPool = new ConnectionPool(
            5,                          // 最大空闲连接数
            30,                         // 空闲连接存活时间
            TimeUnit.SECONDS
        );

        Dispatcher dispatcher = new Dispatcher();
        dispatcher.setMaxRequests(10);          // 最大并发请求数
        dispatcher.setMaxRequestsPerHost(5);     // 每台主机的最大并发数

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

## 5.4 文生图接口封装

### DoubaoImageService

```java
package com.example.aiimage.service;

public interface DoubaoImageService {
    /**
     * 文生图
     * @param prompt 正向提示词
     * @param negativePrompt 反向提示词（可选）
     * @param size 图片尺寸 2K/4K 或 宽x高
     * @param style 画风
     * @param watermark 是否添加水印
     * @return 豆包返回的图片 URL
     */
    DoubaoImageResult textToImage(String prompt, String negativePrompt,
                                   String size, String style, Boolean watermark);

    /**
     * 图生图
     * @param sourceImageUrl 参考图 URL
     * @param prompt 提示词
     * @param strength 重绘强度 0-1
     * @param size 图片尺寸
     * @param style 画风
     * @return 豆包返回的图片 URL
     */
    DoubaoImageResult imageToImage(String sourceImageUrl, String prompt,
                                    Double strength, String size, String style);
}
```

### 实现类关键代码

```java
@Service
@Slf4j
public class DoubaoImageServiceImpl implements DoubaoImageService {

    private static final String T2I_MODEL = "doubao-seedream-4-5-251128";
    private static final String I2I_MODEL = "doubao-seedream-4-5-251128";

    @Override
    public DoubaoImageResult textToImage(String prompt, String negativePrompt,
                                          String size, String style, Boolean watermark) {
        // 1. 构建完整提示词（正向 + 反向 + 风格扩充）
        String fullPrompt = buildFullPrompt(prompt, negativePrompt, style);
        log.info("文生图请求: model={}, size={}, promptLen={}",
                T2I_MODEL, size, fullPrompt.length());

        // 2. 构建请求参数
        GenerateImagesRequest request = GenerateImagesRequest.builder()
                .model(T2I_MODEL)
                .prompt(fullPrompt)
                .size(size)
                .sequentialImageGeneration("disabled")
                .responseFormat(ResponseFormat.Url)
                .stream(false)
                .watermark(watermark != null && watermark)
                .build();

        // 3. 调用 API（含超时处理）
        ImagesResponse response = ArkServiceUtil.getArkService()
                .generateImages(request);

        // 4. 解析响应
        return parseResponse(response);
    }

    @Override
    public DoubaoImageResult imageToImage(String sourceImageUrl, String prompt,
                                           Double strength, String size, String style) {
        String fullPrompt = buildFullPrompt(prompt, null, style);
        log.info("图生图请求: sourceImage={}, size={}, strength={}",
                sourceImageUrl, size, strength);

        GenerateImagesRequest request = GenerateImagesRequest.builder()
                .model(I2I_MODEL)
                .prompt(fullPrompt)
                .image(sourceImageUrl)       // 参考图片 URL
                .size(size)
                .sequentialImageGeneration("disabled")
                .responseFormat(ResponseFormat.Url)
                .stream(false)
                .watermark(true)
                .build();

        ImagesResponse response = ArkServiceUtil.getArkService()
                .generateImages(request);

        return parseResponse(response);
    }

    /** 构建完整提示词 */
    private String buildFullPrompt(String prompt, String negativePrompt, String style) {
        StringBuilder sb = new StringBuilder(prompt);

        // 追加风格描述
        String styleDesc = getStyleDescription(style);
        if (styleDesc != null) {
            sb.append("，").append(styleDesc);
        }

        // 追加反向提示词（豆包 API 通过正向提示词内嵌负向描述）
        if (negativePrompt != null && !negativePrompt.isBlank()) {
            sb.append("，避免").append(negativePrompt);
        }

        return sb.toString();
    }

    /** 解析豆包 API 响应 */
    private DoubaoImageResult parseResponse(ImagesResponse response) {
        if (response == null) {
            throw new DoubaoApiException("豆包 API 返回为空");
        }
        if (response.getData() == null || response.getData().isEmpty()) {
            throw new DoubaoApiException("豆包 API 返回数据列表为空");
        }

        var data = response.getData().get(0);
        String imageUrl = data.getUrl();
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new DoubaoApiException("豆包 API 返回图片 URL 为空");
        }

        DoubaoImageResult result = new DoubaoImageResult();
        result.setImageUrl(imageUrl);
        result.setSize(data.getSize());
        result.setOutputFormat(data.getOutputFormat());
        return result;
    }
}
```

## 5.5 文生文/图生文流式接口封装

### ChatService（SSE 流式）

```java
@Service
@Slf4j
public class ChatServiceImpl implements ChatService {

    @Override
    public void streamCompletion(Long userId, ChatRequest request, SseEmitter emitter) {
        ArkService arkService = ArkServiceUtil.getArkService();

        // 构建请求参数：支持纯文本和多模态
        CompletionRequest completionReq = CompletionRequest.builder()
                .model("doubao-seed-2-0-pro-260215")
                .messages(buildMessages(request))
                .stream(true)  // 启用流式
                .temperature(0.7)
                .maxTokens(4096)
                .build();

        StringBuilder fullAnswer = new StringBuilder();

        // 订阅流式响应
        arkService.streamCompletions(completionReq).subscribe(
            response -> {
                String delta = extractDelta(response);
                if (delta != null) {
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
                // 流结束：保存完整对话
                saveChatRecord(userId, request, fullAnswer.toString());
                emitter.send(SseEmitter.event().data("{\"done\":true}"));
                emitter.complete();
            }
        );
    }

    /** 构建多模态消息列表 */
    private List<Map<String, Object>> buildMessages(ChatRequest request) {
        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", request.getPrompt()));

        // 如果有图片，加入多模态 content
        if (request.getImage() != null && !request.getImage().isBlank()) {
            content.add(Map.of("type", "image_url",
                    "image_url", Map.of("url", request.getImage())));
        }

        return List.of(Map.of("role", "user", "content", content));
    }
}
```

### 请求/响应数据流

```json
// 文生文请求
POST /api/chat/completion
Authorization: Bearer <token>
{
  "prompt": "帮我写一个 Spring Boot 用户注册接口",
  "image": null
}

// SSE 流式响应 (text/event-stream)
data: {"token":"以下是"}
data: {"token":"用户注"}
data: {"token":"册接口"}
data: {"token":"的实现"}
data: {"done":true}
```

## 5.7 Spring Retry 容错配置

### 重试策略

```java
@Configuration
@EnableRetry
public class RetryConfig {

    @Bean
    public RetryTemplate retryTemplate() {
        // 指数退避：初始 1s，倍数 2，最大 10s
        ExponentialBackOffPolicy backOff = new ExponentialBackOffPolicy();
        backOff.setInitialInterval(1000);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(10000);

        RetryTemplate template = new RetryTemplate();
        template.setBackOffPolicy(backOff);
        template.setRetryPolicy(new SimpleRetryPolicy(3));
        return template;
    }
}
```

### 服务层使用

```java
@Override
@Retryable(
    retryFor = {DoubaoApiException.class, SocketTimeoutException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000, multiplier = 2)
)
public DoubaoImageResult textToImage(...) {
    // 调用豆包 API
}

@Recover
public DoubaoImageResult recover(DoubaoApiException e, ...) {
    log.error("豆包 API 重试 3 次后仍然失败", e);
    throw new BusinessException("AI 绘图服务暂时不可用，请稍后重试");
}
```

## 5.8 异常类型定义

```java
// 豆包 API 业务异常
public class DoubaoApiException extends RuntimeException {
    public DoubaoApiException(String message) {
        super(message);
    }
    public DoubaoApiException(String message, Throwable cause) {
        super(message, cause);
    }
}

// 业务异常（向前端返回友好提示）
public class BusinessException extends RuntimeException {
    private final String code;
    public BusinessException(String message) {
        super(message);
        this.code = "400";
    }
    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
    }
}
```

## 5.9 敏感词处理

```java
@Component
public class SensitiveFilter {

    private static final Set<String> SENSITIVE_WORDS = Set.of(
        "暴力", "色情", "赌博", "毒品"  // 按实际业务扩展
    );

    /**
     * 校验提示词是否包含敏感词
     * @return 空列表表示合规，否则返回命中的敏感词列表
     */
    public List<String> check(String text) {
        if (text == null || text.isBlank()) return List.of();
        return SENSITIVE_WORDS.stream()
                .filter(word -> text.contains(word))
                .collect(Collectors.toList());
    }
}
```

## 5.10 API 调用时序

### 文生图完整调用链

```
前端                    后端                      豆包 API              MinIO
 │                       │                        │                   │
 │── POST /t2i/generate ─→│                        │                   │
 │                       │── 参数校验              │                   │
 │                       │── Redis 防重复锁        │                   │
 │                       │── call textToImage() ──→│                   │
 │                       │                        │── 生成图片          │
 │                       │←──── image_url ────────│                   │
 │                       │── 下载图片              │                   │
 │                       │── 上传图片 ────────────────────────────────→│
 │                       │── 写入 PostgreSQL       │                   │
 │←──── ImageResultVO ───│                        │                   │
 │                       │                        │                   │
 │── 展示图片             │                        │                   │
 │── 点击下载 ───────────→│                        │                   │
 │                       │── 生成 Presigned URL ────────────────────→│
 │                       │←── 签名 URL ───────────│                   │
 │←── 下载链接 ──────────│                        │                   │
 │── 直接下载 ───────────────────────────────────────────────────────→│
```

### 请求/响应数据流

```json
// 文生图请求
POST /api/t2i/generate
Authorization: Bearer <token>
{
  "prompt": "赛博朋克风格的猫，霓虹灯，雨夜",
  "negativePrompt": "模糊，低质量，畸形",
  "size": "2K",
  "style": "赛博朋克",
  "watermark": false
}

// 文生图响应
{
  "code": 200,
  "message": "图片生成成功",
  "data": {
    "recordId": 1024,
    "imageUrl": "http://minio:9000/ai-text-image/t2i/1/xxx.png?...",
    "size": "2K",
    "generateType": "文生图",
    "createdAt": "2026-07-16T14:30:22"
  }
}
```
