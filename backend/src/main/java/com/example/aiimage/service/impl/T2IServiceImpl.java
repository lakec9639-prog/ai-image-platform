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
import java.util.List;
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
        List<String> sensitiveWords = sensitiveFilter.check(request.getPrompt());
        if (!sensitiveWords.isEmpty()) {
            return AjaxJsonResult.error(400, "提示词包含敏感词: " + String.join(",", sensitiveWords));
        }

        String lockKey = "t2i:lock:" + userId + ":" + request.getPrompt().hashCode();
        Boolean locked = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", Duration.ofSeconds(5));
        if (Boolean.FALSE.equals(locked)) {
            return AjaxJsonResult.error(429, "请勿频繁提交相同绘图请求");
        }

        try {
            String doubaoUrl = doubaoImageService.textToImage(
                    request.getPrompt(), request.getSize(),
                    request.getStyle(), request.getWatermark());

            String objectName = String.format("t2i/%d/%s.png", userId, UUID.randomUUID());
            minioService.uploadFromUrl(doubaoUrl, "ai-text-image", objectName);

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
