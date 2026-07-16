package com.example.aiimage.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class I2IRequest {
    @NotBlank(message = "底图路径不能为空")
    private String sourceImagePath;
    @NotBlank(message = "提示词不能为空")
    private String prompt;
    private BigDecimal strength = new BigDecimal("0.7");
    private String size = "2K";
    private String style;
}
