package com.example.aiimage.service;

import com.example.aiimage.model.dto.LoginRequest;
import com.example.aiimage.model.dto.LoginResponse;

public interface AuthService {
    LoginResponse login(LoginRequest request);
    void logout(String token);
    Long validateToken(String token);
}
