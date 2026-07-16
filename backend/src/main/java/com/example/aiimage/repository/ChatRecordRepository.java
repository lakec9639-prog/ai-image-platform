package com.example.aiimage.repository;

import com.example.aiimage.model.entity.ChatRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRecordRepository extends JpaRepository<ChatRecord, Long> {
    Page<ChatRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
