package com.example.aiimage.service;

import com.example.aiimage.model.dto.ChatRequest;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface ChatService {
    void streamCompletion(Long userId, ChatRequest request, SseEmitter emitter);
}
