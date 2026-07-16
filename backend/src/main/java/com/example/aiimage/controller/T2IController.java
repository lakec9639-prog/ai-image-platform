package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.T2IRequest;
import com.example.aiimage.service.T2IService;
import com.example.aiimage.util.AuthContext;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/t2i")
public class T2IController {

    private final T2IService t2iService;

    public T2IController(T2IService t2iService) {
        this.t2iService = t2iService;
    }

    @PostMapping("/generate")
    public AjaxJsonResult<ImageResultVO> generate(@RequestBody @Valid T2IRequest request) {
        Long userId = AuthContext.getCurrentUserId();
        return t2iService.generateImage(userId, request);
    }
}
