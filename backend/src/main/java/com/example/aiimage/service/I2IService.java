package com.example.aiimage.service;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.I2IRequest;
import com.example.aiimage.model.dto.ImageResultVO;
import org.springframework.web.multipart.MultipartFile;

public interface I2IService {
    AjaxJsonResult<ImageResultVO> uploadSourceImage(Long userId, MultipartFile file);
    AjaxJsonResult<ImageResultVO> generateImage(Long userId, I2IRequest request);
}
