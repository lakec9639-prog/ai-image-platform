package com.example.aiimage.service.impl;

import com.example.aiimage.model.dto.ChatRequest;
import com.example.aiimage.model.entity.ChatRecord;
import com.example.aiimage.model.enums.ChatType;
import com.example.aiimage.repository.ChatRecordRepository;
import com.example.aiimage.service.ChatService;
import com.example.aiimage.util.ArkHttpUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRecordRepository chatRecordRepository;
    private static final String MODEL = "doubao-seed-2-0-pro-260215";

    @Override
    public void streamCompletion(Long userId, ChatRequest request, SseEmitter emitter) {
        List<Map<String, Object>> messages = new ArrayList<>();
        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "text", "text", request.getPrompt()));

        if (request.getImage() != null && !request.getImage().isBlank()) {
            content.add(Map.of("type", "image_url",
                    "image_url", Map.of("url", request.getImage())));
        }
        messages.add(Map.of("role", "user", "content", content));

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "messages", messages,
                "stream", true,
                "max_tokens", 4096
        );

        String apiKey = ArkHttpUtil.getApiKey();
        String baseUrl = ArkHttpUtil.getBaseUrl();

        new Thread(() -> {
            StringBuilder fullAnswer = new StringBuilder();
            try {
                URI uri = URI.create(baseUrl + "/chat/completions");
                HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bearer " + apiKey);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "text/event-stream");
                conn.setDoOutput(true);
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(120000);

                String jsonBody = ArkHttpUtil.getMapper().writeValueAsString(body);
                try (OutputStream os = conn.getOutputStream()) {
                    os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
                }

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (line.startsWith("data: ")) {
                            String data = line.substring(6).trim();
                            if ("[DONE]".equals(data)) {
                                break;
                            }
                            try {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> chunk = ArkHttpUtil.getMapper()
                                        .readValue(data, Map.class);
                                String delta = extractDelta(chunk);
                                if (delta != null && !delta.isBlank()) {
                                    fullAnswer.append(delta);
                                    emitter.send(SseEmitter.event()
                                            .data("{\"token\":\"" + escapeJson(delta) + "\"}"));
                                }
                            } catch (Exception e) {
                                log.warn("解析 SSE 数据失败: {}", data, e);
                            }
                        }
                    }
                }

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
                log.error("SSE 流异常", e);
                emitter.completeWithError(e);
            }
        }).start();
    }

    @SuppressWarnings("unchecked")
    private String extractDelta(Map<String, Object> response) {
        if (response.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> choice = choices.get(0);
                if (choice.containsKey("delta")) {
                    Map<String, Object> delta = (Map<String, Object>) choice.get("delta");
                    if (delta != null && delta.containsKey("content")) {
                        return (String) delta.get("content");
                    }
                }
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
