package com.example.aiimage.repository;

import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ImageRecordRepository extends JpaRepository<ImageRecord, Long> {
    Page<ImageRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<ImageRecord> findByUserIdAndGenerateTypeOrderByCreatedAtDesc(
            Long userId, GenerateType type, Pageable pageable);
    Optional<ImageRecord> findByIdAndUserId(Long id, Long userId);
}
