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
