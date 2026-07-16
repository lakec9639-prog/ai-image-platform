package com.example.aiimage.service.impl;

import com.example.aiimage.exception.BusinessException;
import com.example.aiimage.exception.UnauthorizedException;
import com.example.aiimage.model.dto.LoginRequest;
import com.example.aiimage.model.dto.LoginResponse;
import com.example.aiimage.model.entity.User;
import com.example.aiimage.repository.UserRepository;
import com.example.aiimage.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("用户名或密码错误"));

        if ("DISABLED".equals(user.getStatus())) {
            throw new BusinessException("账号已被禁用");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("用户名或密码错误");
        }

        String token = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(
                "session:" + token,
                String.valueOf(user.getId()),
                7, TimeUnit.DAYS);

        LoginResponse resp = new LoginResponse();
        resp.setToken(token);
        resp.setNickname(user.getNickname());
        resp.setRole(user.getRole());
        resp.setExpireIn(604800);
        return resp;
    }

    @Override
    public void logout(String token) {
        redisTemplate.delete("session:" + token);
    }

    @Override
    public Long validateToken(String token) {
        String userId = redisTemplate.opsForValue().get("session:" + token);
        if (userId == null) {
            throw new UnauthorizedException("登录已过期，请重新登录");
        }
        return Long.parseLong(userId);
    }
}
