package com.example.aiimage.model.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ImageResultVO {
    private Long recordId;
    private String imageUrl;
    private String sourceImageUrl;
    private String sourceImagePath;
    private String prompt;
    private String size;
    private String style;
    private String generateType;
    private LocalDateTime createdAt;
}
