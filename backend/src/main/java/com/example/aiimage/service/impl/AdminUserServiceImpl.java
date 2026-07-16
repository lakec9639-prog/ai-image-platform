package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;
import com.example.aiimage.model.entity.User;
import com.example.aiimage.repository.UserRepository;
import com.example.aiimage.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public AjaxJsonResult<PageResult<UserVO>> listUsers(int page, int size, String keyword) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<User> userPage;

        if (keyword != null && !keyword.isBlank()) {
            userPage = userRepository.findByUsernameContaining(keyword, pageRequest);
        } else {
            userPage = userRepository.findAll(pageRequest);
        }

        List<UserVO> list = userPage.getContent().stream().map(u -> {
            UserVO vo = new UserVO();
            vo.setId(u.getId());
            vo.setUsername(u.getUsername());
            vo.setNickname(u.getNickname());
            vo.setRole(u.getRole());
            vo.setStatus(u.getStatus());
            vo.setCreatedAt(u.getCreatedAt());
            return vo;
        }).toList();

        PageResult<UserVO> result = new PageResult<>();
        result.setContent(list);
        result.setPage(page);
        result.setSize(size);
        result.setTotalElements(userPage.getTotalElements());
        result.setTotalPages(userPage.getTotalPages());

        return AjaxJsonResult.success(result);
    }

    @Override
    public AjaxJsonResult<UserVO> createUser(String username, String password, String nickname) {
        if (userRepository.findByUsername(username).isPresent()) {
            return AjaxJsonResult.error(400, "用户名已存在");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setNickname(nickname != null ? nickname : username);
        user.setRole("USER");
        user.setStatus("ENABLED");
        userRepository.save(user);

        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setNickname(user.getNickname());
        vo.setRole(user.getRole());
        vo.setStatus(user.getStatus());
        return AjaxJsonResult.success("用户创建成功", vo);
    }

    @Override
    public AjaxJsonResult<Void> toggleUserStatus(Long userId, String status) {
        if (userId == 1) {
            return AjaxJsonResult.error(400, "不能禁用 admin 账号");
        }
        User user = userRepository.findById(userId)
                .orElse(null);
        if (user == null) {
            return AjaxJsonResult.error(404, "用户不存在");
        }
        user.setStatus(status);
        userRepository.save(user);
        return AjaxJsonResult.success("用户状态更新成功", null);
    }
}
