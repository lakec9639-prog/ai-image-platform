package com.example.aiimage.service;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;

public interface HistoryService {
    AjaxJsonResult<PageResult<ImageResultVO>> listRecords(
            Long userId, String type, int page, int size);
    AjaxJsonResult<ImageResultVO> getRecord(Long userId, Long recordId);
    AjaxJsonResult<Void> deleteRecord(Long userId, Long recordId);
}
