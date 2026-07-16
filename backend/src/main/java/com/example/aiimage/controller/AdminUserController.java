package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.dto.UserVO;
import com.example.aiimage.service.AdminUserService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public AjaxJsonResult<PageResult<UserVO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {
        return adminUserService.listUsers(page, size, keyword);
    }

    @PostMapping
    public AjaxJsonResult<UserVO> create(@RequestBody Map<String, String> body) {
        return adminUserService.createUser(
                body.get("username"),
                body.get("password"),
                body.get("nickname"));
    }

    @PutMapping("/{id}/status")
    public AjaxJsonResult<Void> toggleStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return adminUserService.toggleUserStatus(id, body.get("status"));
    }
}
