# Spring AI 集成国内大模型实战：千问/豆包（含多模态）+ Spring Boot 4.0.1 全攻略

国内开发者常面临的痛点是：如何基于 Spring AI 适配阿里通义千问、字节豆包等本土化大模型？是否支持多模态（图文问答）能力？本文将从「环境准备→文本交互集成→多模态能力落地」全流程拆解，结合 Spring Boot 4.0.1 给出可直接复用的代码示例，覆盖国内模型的核心使用场景。

## 一、前置准备：基础环境与依赖配置

### 1.1 环境要求（必满足）

- **JDK**：17+（Spring Boot 4.0.1 强制要求）
- **构建工具**：Maven 3.8.8+ / Gradle 8.0+
- **Spring 版本**：Spring Boot 4.0.1 + Spring AI 0.8.1（最佳兼容组合）
- **网络**：确保服务器/本地能访问国内大模型 API 地址（国内服务器无需代理）

### 1.2 国内模型 API 密钥获取

| 模型 | 密钥获取平台 | 核心信息 |
|------|-------------|---------|
| 通义千问 | 阿里云百炼大模型平台（dashscope.aliyun.com） | 获取 API-KEY |
| 字节豆包 | 火山方舟平台（volcengine.com/product/ark） | 获取 api-key + 接口地址 |

### 1.3 基础依赖配置

先搭建 Spring Boot 4.0.1 项目，在 pom.xml 中添加核心依赖（后续按模型补充专属依赖）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.1</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>spring-ai-china-llm-demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <dependencies>
        <!-- Spring Web：提供接口测试能力 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!-- Spring AI 核心依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-ai</artifactId>
            <version>0.8.1</version>
        </dependency>
        <!-- 测试依赖 -->
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
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## 二、核心场景1：文本交互集成（最常用）

### 2.1 集成阿里通义千问（官方适配，推荐）

Spring AI 对千问有官方适配依赖，无需自定义客户端，配置即可用。

**步骤1：添加千问专属依赖**

```xml
<!-- Spring AI 通义千问适配依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-ai-dashscope</artifactId>
    <version>0.8.1</version>
</dependency>
```

**步骤2：配置千问 API 信息**

在 application.yml 中添加配置（替换为你的 API-KEY）：

```yaml
spring:
  ai:
    dashscope:
      api-key: sk-xxxxxx  # 阿里云百炼平台获取的API-KEY
      chat:
        model: qwen-turbo  # 可选：qwen-plus、qwen-max、qwen-72b-chat等
        temperature: 0.7   # 随机性（0-1），值越小越精准
        max-tokens: 2048   # 最大生成token数
```

**步骤3：编写千问文本调用代码**

Spring AI 自动配置 DashScopeChatClient，直接注入使用：

```java
import org.springframework.ai.dashscope.DashScopeChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QwenTextController {

    @Autowired
    private DashScopeChatClient dashScopeChatClient;

    @GetMapping("/ai/qwen/chat")
    public String chatWithQwen(@RequestParam String prompt) {
        return dashScopeChatClient.call(prompt);

        // 进阶调用（自定义参数）：
        /*
        DashScopeChatRequest request = DashScopeChatRequest.builder()
                .prompt(prompt)
                .model("qwen-plus")
                .temperature(0.5)
                .maxTokens(1000)
                .build();
        return dashScopeChatClient.call(request).getResult().getOutput().getContent();
        */
    }
}
```

**步骤4：测试接口**

启动项目后访问：
```
http://localhost:8080/ai/qwen/chat?prompt=用Spring Boot 4.0.1写一个用户注册接口
```

### 2.2 集成字节豆包（OpenAI 兼容模式）

豆包暂无 Spring AI 官方适配，但支持「OpenAI 兼容模式」，可复用 OpenAI 客户端调用。

**步骤1：添加 OpenAI 适配依赖**

```xml
<!-- Spring AI OpenAI 适配依赖（兼容豆包接口） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-ai-openai</artifactId>
    <version>0.8.1</version>
</dependency>
```

**步骤2：配置豆包兼容接口信息**

```yaml
spring:
  ai:
    openai:
      api-key: your-doubao-api-key
      base-url: https://www.doubao.com/api/v1
      chat:
        model: doubao-pro
        temperature: 0.7
        max-tokens: 2048
```

**步骤3：编写豆包文本调用代码**

```java
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DouBaoTextController {

    @Autowired
    private OpenAiChatClient openAiChatClient;

    @GetMapping("/ai/doubao/chat")
    public String chatWithDouBao(@RequestParam String prompt) {
        return openAiChatClient.call(prompt);
    }
}
```

## 三、核心场景2：多模态集成（图文问答）

Spring AI 0.8.1+ 原生支持多模态能力（文本+图片），核心是将图片转为 Base64 编码后传入 Prompt。

### 3.1 千问多模态集成（官方适配，最便捷）

千问 qwen-vl/qwen-vl-plus 模型原生支持图文问答，Spring AI 提供完整封装。

**步骤1：确认配置（复用千问依赖，修改模型为多模态版本）**

```yaml
spring:
  ai:
    dashscope:
      api-key: sk-xxxxxx
      chat:
        model: qwen-vl
        temperature: 0.7
```

**步骤2：编写千问多模态调用代码**

```java
import org.springframework.ai.dashscope.DashScopeMultiModalChatClient;
import org.springframework.ai.image.ImageContent;
import org.springframework.ai.multimodal.MultiModalPrompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;

@RestController
public class QwenMultiModalController {

    @Autowired
    private DashScopeMultiModalChatClient multiModalChatClient;

    @PostMapping("/ai/qwen/multimodal/chat")
    public String multiModalChat(
            @RequestParam("file") MultipartFile file,
            @RequestParam("prompt") String prompt) throws Exception {
        
        byte[] imageBytes = file.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        ImageContent imageContent = new ImageContent("data:image/jpeg;base64," + base64Image);
        MultiModalPrompt multiModalPrompt = new MultiModalPrompt(prompt, imageContent);
        return multiModalChatClient.call(multiModalPrompt).getResult().getOutput().getContent();
    }
}
```

**步骤3：测试多模态接口**

- 请求方式：POST
- 地址：`http://localhost:8080/ai/qwen/multimodal/chat`
- 参数：`file`（图片文件）+ `prompt`（文本提问）

### 3.2 豆包多模态集成（兼容/自定义模式）

**方式1：OpenAI 兼容模式（推荐）**

```java
import org.springframework.ai.openai.OpenAiChatClient;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.api.OpenAiChatCompletionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.util.List;

@RestController
public class DouBaoMultiModalController {

    @Autowired
    private OpenAiChatClient openAiChatClient;

    @PostMapping("/ai/doubao/multimodal/chat")
    public String douBaoMultiModalChat(
            @RequestParam("file") MultipartFile file,
            @RequestParam("prompt") String prompt) throws Exception {
        
        byte[] imageBytes = file.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        
        OpenAiChatCompletionRequest.Message message = OpenAiChatCompletionRequest.Message.builder()
                .role(OpenAiApi.ChatRole.USER.value())
                .content(List.of(
                        OpenAiChatCompletionRequest.Message.ContentPart.builder()
                                .type("text")
                                .text(prompt)
                                .build(),
                        OpenAiChatCompletionRequest.Message.ContentPart.builder()
                                .type("image_url")
                                .imageUrl(OpenAiChatCompletionRequest.Message.ImageUrl.builder()
                                        .url("data:image/jpeg;base64," + base64Image)
                                        .build())
                                .build()
                ))
                .build();
        
        return openAiChatClient.call(List.of(message)).getResult().getOutput().getContent();
    }
}
```

**方式2：自定义客户端（原生接口）**

```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
public class CustomDouBaoMultiModalController {

    @Value("${doubao.api-key}")
    private String apiKey;
    @Value("${doubao.base-url}")
    private String baseUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/ai/doubao/custom/multimodal/chat")
    public String customMultiModalChat(
            @RequestParam("file") MultipartFile file,
            @RequestParam("prompt") String prompt) throws Exception {
        
        byte[] imageBytes = file.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        
        Map<String, Object> requestBody = Map.of(
                "model", "doubao-multimodal",
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of("type", "text", "text", prompt),
                                Map.of("type", "image", "image", base64Image)
                        )
                )),
                "temperature", 0.7
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(
                baseUrl + "/chat/multimodal/completions",
                request,
                Map.class
        );
        
        if (response.getStatusCode().is2xxSuccessful()) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
            return (String) choices.get(0).get("message").get("content");
        }
        return "调用失败：" + response.getStatusCode();
    }
}
```

对应的配置：

```yaml
doubao:
  api-key: your-doubao-api-key
  base-url: https://www.doubao.com/api/v1
```

## 四、关键注意事项（避坑指南）

### 4.1 版本兼容

- 必须使用 Spring AI 0.8.1+（适配 Spring Boot 4.0.1），低版本会出现依赖冲突；
- 国内模型需选择对应版本（千问多模态用 qwen-vl，豆包多模态用 doubao-multimodal）。

### 4.2 密钥安全

生产环境切勿硬编码 API 密钥，通过环境变量注入：

```yaml
spring:
  ai:
    dashscope:
      api-key: ${DASHSCOPE_API_KEY}
```

### 4.3 图片处理

- 图片格式：支持 JPG/PNG，部分模型限制大小（≤10MB）；
- 性能优化：大图片先压缩分辨率，再转 Base64（减少请求体积）。

### 4.4 网络与接口适配

- 国内服务器无需代理，海外服务器需配置国内代理；
- 定期确认模型官方接口地址（可能微调）。

## 五、总结

Spring AI 结合 Spring Boot 4.0.1 可高效集成国内主流大模型，核心要点如下：

- **文本交互**：千问用官方适配依赖，豆包复用 OpenAI 兼容模式，配置简单、调用便捷；
- **多模态能力**：核心是图片 Base64 编码，千问有官方封装，豆包可通过兼容/自定义模式实现；
- **核心原则**：国内模型集成的关键是「鉴权方式 + 接口格式」适配，Spring AI 已封装通用逻辑，只需少量配置即可落地。

---

> 原文：https://blog.csdn.net/lpfasd123/article/details/156516563
> 版权声明：本文为CSDN博主「谁在黄金彼岸」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
