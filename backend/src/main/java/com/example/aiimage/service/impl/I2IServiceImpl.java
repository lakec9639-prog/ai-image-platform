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
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
public class I2IServiceImpl implements I2IService {

    private final MinioService minioService;
    private final DoubaoImageService doubaoImageService;
    private final ImageRecordRepository recordRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final MinioClient minioClient;

    public I2IServiceImpl(MinioService minioService, DoubaoImageService doubaoImageService,
                          ImageRecordRepository recordRepository,
                          RedisTemplate<String, String> redisTemplate,
                          @Value("${minio.endpoint}") String endpoint,
                          @Value("${minio.access-key}") String accessKey,
                          @Value("${minio.secret-key}") String secretKey) {
        this.minioService = minioService;
        this.doubaoImageService = doubaoImageService;
        this.recordRepository = recordRepository;
        this.redisTemplate = redisTemplate;
        this.minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
    }

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
            vo.setSourceImagePath(objectName);
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
            String base64Image = downloadAsBase64("ai-source-img", request.getSourceImagePath());

            String doubaoUrl = doubaoImageService.imageToImage(
                    base64Image, request.getPrompt(),
                    request.getStrength().doubleValue(),
                    request.getSize(), request.getStyle());

            String objectName = String.format("i2i/%d/%s.png", userId, UUID.randomUUID());
            minioService.uploadFromUrl(doubaoUrl, "ai-img2img-out", objectName);

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
            vo.setSourceImageUrl(minioService.getPresignedUrl("ai-source-img", request.getSourceImagePath()));
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

    private String downloadAsBase64(String bucket, String objectName) {
        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder().bucket(bucket).object(objectName).build());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int len;
            while ((len = is.read(buf)) != -1) {
                baos.write(buf, 0, len);
            }
            byte[] bytes = baos.toByteArray();
            String mime = objectName.toLowerCase().endsWith(".png") ? "image/png"
                    : objectName.toLowerCase().endsWith(".webp") ? "image/webp"
                    : "image/jpeg";
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            throw new DoubaoApiException("读取底图失败: " + e.getMessage());
        }
    }
}
