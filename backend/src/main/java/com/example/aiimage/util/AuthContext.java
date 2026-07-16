package com.example.aiimage.util;

public class AuthContext {
    private static final ThreadLocal<Long> currentUserId = new ThreadLocal<>();

    public static void setCurrentUserId(Long userId) {
        currentUserId.set(userId);
    }

    public static Long getCurrentUserId() {
        Long id = currentUserId.get();
        if (id == null) throw new RuntimeException("未获取到用户上下文");
        return id;
    }

    public static void clear() {
        currentUserId.remove();
    }
}
