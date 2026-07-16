package com.example.aiimage.model.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserVO {
    private Long id;
    private String username;
    private String nickname;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}
