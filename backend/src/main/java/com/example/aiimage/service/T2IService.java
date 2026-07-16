package com.example.aiimage.service;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.T2IRequest;

public interface T2IService {
    AjaxJsonResult<ImageResultVO> generateImage(Long userId, T2IRequest request);
}
