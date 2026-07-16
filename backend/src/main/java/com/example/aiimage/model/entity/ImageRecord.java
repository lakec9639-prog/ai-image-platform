package com.example.aiimage.model.entity;

import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.model.enums.ImageStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "image_records")
public class ImageRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GenerateType generateType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(columnDefinition = "TEXT")
    private String negativePrompt;

    @Column(length = 20)
    private String size;

    @Column(length = 50)
    private String style;

    @Column(precision = 3, scale = 2)
    private BigDecimal similarStrength;

    @Column(length = 500)
    private String sourceMinioPath;

    @Column(nullable = false, length = 500)
    private String resultMinioPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ImageStatus imageStatus = ImageStatus.SUCCESS;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
