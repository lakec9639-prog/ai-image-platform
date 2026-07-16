package com.example.aiimage.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class T2IRequest {
    @NotBlank(message = "提示词不能为空")
    private String prompt;
    private String negativePrompt;
    private String size = "2K";
    private String style;
    private Boolean watermark = false;
}
