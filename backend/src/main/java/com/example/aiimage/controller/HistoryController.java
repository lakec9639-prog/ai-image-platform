package com.example.aiimage.controller;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.service.HistoryService;
import com.example.aiimage.util.AuthContext;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/works")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public AjaxJsonResult<PageResult<ImageResultVO>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.listRecords(userId, type, page, size);
    }

    @GetMapping("/{id}")
    public AjaxJsonResult<ImageResultVO> detail(@PathVariable Long id) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.getRecord(userId, id);
    }

    @DeleteMapping("/{id}")
    public AjaxJsonResult<Void> delete(@PathVariable Long id) {
        Long userId = AuthContext.getCurrentUserId();
        return historyService.deleteRecord(userId, id);
    }
}
