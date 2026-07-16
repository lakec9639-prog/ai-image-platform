package com.example.aiimage.model.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String token;
    private String nickname;
    private String role;
    private long expireIn;
}
