package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.I2IRequest;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.service.I2IService;
import com.example.aiimage.util.AuthContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/i2i")
public class I2IController {

    private final I2IService i2iService;

    public I2IController(I2IService i2iService) {
        this.i2iService = i2iService;
    }

    @PostMapping("/upload")
    public AjaxJsonResult<ImageResultVO> upload(@RequestParam("file") MultipartFile file) {
        Long userId = AuthContext.getCurrentUserId();
        return i2iService.uploadSourceImage(userId, file);
    }

    @PostMapping("/generate")
    public AjaxJsonResult<ImageResultVO> generate(@RequestBody @Valid I2IRequest request) {
        Long userId = AuthContext.getCurrentUserId();
        return i2iService.generateImage(userId, request);
    }
}
