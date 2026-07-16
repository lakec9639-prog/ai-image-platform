package com.example.aiimage.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ArkHttpUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Getter
    private static String apiKey;

    @Getter
    private static String baseUrl;

    private static RestClient restClient;

    @Value("${doubao.api-key}")
    private String key;

    @Value("${doubao.base-url}")
    private String url;

    @PostConstruct
    public void init() {
        apiKey = key;
        baseUrl = url;
        restClient = RestClient.builder()
                .baseUrl(url)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public static RestClient getClient() {
        if (restClient == null) {
            throw new RuntimeException("ArkHttpUtil 未初始化");
        }
        return restClient;
    }

    public static ObjectMapper getMapper() {
        return OBJECT_MAPPER;
    }
}
