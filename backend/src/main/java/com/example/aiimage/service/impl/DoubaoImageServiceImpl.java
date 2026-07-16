package com.example.aiimage.service.impl;

import com.example.aiimage.exception.DoubaoApiException;
import com.example.aiimage.service.DoubaoImageService;
import com.example.aiimage.util.ArkHttpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class DoubaoImageServiceImpl implements DoubaoImageService {

    @Value("${doubao.t2i-model}")
    private String model;

    @Override
    public String textToImage(String prompt, String size, String style, Boolean watermark) {
        String enrichedPrompt = enrichStylePrompt(prompt, style);
        return callImageApi(Map.of(
                "model", model,
                "prompt", enrichedPrompt,
                "size", size,
                "response_format", "url"
        ));
    }

    @Override
    public String imageToImage(String sourceImageBase64, String prompt, Double strength,
                                String size, String style) {
        String enrichedPrompt = enrichStylePrompt(prompt, style);
        return callImageApi(Map.of(
                "model", model,
                "prompt", enrichedPrompt,
                "image", sourceImageBase64,
                "size", size,
                "response_format", "url"
        ));
    }

    @SuppressWarnings("unchecked")
    private String callImageApi(Map<String, Object> body) {
        // normalize size format: frontend "2K" → API "2k", "1K" → "1024x1024"
        Object size = body.get("size");
        if (size instanceof String s) {
            String normalized = normalizeSize(s);
            body = new java.util.LinkedHashMap<>(body);
            body.put("size", normalized);
        }
        try {
            Map<String, Object> resp = ArkHttpUtil.getClient().post()
                    .uri("/images/generations")
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (resp == null || !resp.containsKey("data")) {
                throw new DoubaoApiException("豆包 API 返回数据为空");
            }
            List<Map<String, Object>> dataList = (List<Map<String, Object>>) resp.get("data");
            if (dataList == null || dataList.isEmpty()) {
                throw new DoubaoApiException("豆包 API 返回数据列表为空");
            }
            String url = (String) dataList.get(0).get("url");
            if (url == null || url.isBlank()) {
                throw new DoubaoApiException("豆包 API 返回图片 URL 为空");
            }
            return url;

        } catch (DoubaoApiException e) {
            throw e;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("豆包 API HTTP 错误: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new DoubaoApiException("豆包 API 返回错误: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("调用豆包 API 异常", e);
            throw new DoubaoApiException("图片生成调用失败", e);
        }
    }

    private String normalizeSize(String size) {
        if (size == null) return "2k";
        return switch (size.toUpperCase()) {
            case "1K" -> "1024x1024";
            case "2K" -> "2k";
            case "3K" -> "3k";
            case "4K" -> "4k";
            default -> size;
        };
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
