package com.example.aiimage.service;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;

public interface AdminUserService {
    AjaxJsonResult<PageResult<UserVO>> listUsers(int page, int size, String keyword);
    AjaxJsonResult<UserVO> createUser(String username, String password, String nickname);
    AjaxJsonResult<Void> toggleUserStatus(Long userId, String status);
}
