package com.example.aiimage.service.impl;

import com.example.aiimage.R.AjaxJsonResult;
import com.example.aiimage.model.dto.ImageResultVO;
import com.example.aiimage.model.dto.PageResult;
import com.example.aiimage.model.entity.ImageRecord;
import com.example.aiimage.model.enums.GenerateType;
import com.example.aiimage.repository.ImageRecordRepository;
import com.example.aiimage.service.HistoryService;
import com.example.aiimage.service.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HistoryServiceImpl implements HistoryService {

    private final ImageRecordRepository recordRepository;
    private final MinioService minioService;

    @Override
    public AjaxJsonResult<PageResult<ImageResultVO>> listRecords(
            Long userId, String type, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<ImageRecord> recordPage;

        if (type != null && !type.isBlank()) {
            GenerateType generateType = GenerateType.valueOf(type);
            recordPage = recordRepository.findByUserIdAndGenerateTypeOrderByCreatedAtDesc(
                    userId, generateType, pageRequest);
        } else {
            recordPage = recordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest);
        }

        List<ImageResultVO> list = recordPage.getContent().stream().map(r -> {
            ImageResultVO vo = new ImageResultVO();
            vo.setRecordId(r.getId());
            vo.setPrompt(r.getPrompt());
            vo.setSize(r.getSize());
            vo.setStyle(r.getStyle());
            vo.setGenerateType(r.getGenerateType().name());
            vo.setCreatedAt(r.getCreatedAt());

            String bucket = r.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                    ? "ai-text-image" : "ai-img2img-out";
            vo.setImageUrl(minioService.getPresignedUrl(bucket, r.getResultMinioPath()));
            return vo;
        }).toList();

        PageResult<ImageResultVO> pageResult = new PageResult<>();
        pageResult.setContent(list);
        pageResult.setPage(page);
        pageResult.setSize(size);
        pageResult.setTotalElements(recordPage.getTotalElements());
        pageResult.setTotalPages(recordPage.getTotalPages());

        return AjaxJsonResult.success("查询成功", pageResult);
    }

    @Override
    public AjaxJsonResult<ImageResultVO> getRecord(Long userId, Long recordId) {
        ImageRecord record = recordRepository.findByIdAndUserId(recordId, userId)
                .orElse(null);
        if (record == null) {
            return AjaxJsonResult.error(404, "记录不存在");
        }
        ImageResultVO vo = new ImageResultVO();
        vo.setRecordId(record.getId());
        vo.setPrompt(record.getPrompt());
        vo.setSize(record.getSize());
        vo.setStyle(record.getStyle());
        vo.setGenerateType(record.getGenerateType().name());
        vo.setCreatedAt(record.getCreatedAt());

        String bucket = record.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                ? "ai-text-image" : "ai-img2img-out";
        vo.setImageUrl(minioService.getPresignedUrl(bucket, record.getResultMinioPath()));
        return AjaxJsonResult.success("查询成功", vo);
    }

    @Override
    public AjaxJsonResult<Void> deleteRecord(Long userId, Long recordId) {
        ImageRecord record = recordRepository.findByIdAndUserId(recordId, userId)
                .orElse(null);
        if (record == null) {
            return AjaxJsonResult.error(404, "记录不存在");
        }

        String bucket = record.getGenerateType() == GenerateType.TEXT_TO_IMAGE
                ? "ai-text-image" : "ai-img2img-out";
        minioService.deleteFile(bucket, record.getResultMinioPath());
        if (record.getSourceMinioPath() != null) {
            minioService.deleteFile("ai-source-img", record.getSourceMinioPath());
        }

        recordRepository.delete(record);
        return AjaxJsonResult.success("删除成功", null);
    }
}
