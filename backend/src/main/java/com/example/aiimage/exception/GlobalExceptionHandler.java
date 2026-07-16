package com.example.aiimage.exception;

import com.example.aiimage.R.AjaxJsonResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public AjaxJsonResult<Void> handleUnauthorized(UnauthorizedException e) {
        return AjaxJsonResult.error(401, e.getMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public AjaxJsonResult<Void> handleBusiness(BusinessException e) {
        return AjaxJsonResult.error(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public AjaxJsonResult<Void> handleValidation(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("参数校验失败");
        return AjaxJsonResult.error(400, msg);
    }

    @ExceptionHandler(DoubaoApiException.class)
    public AjaxJsonResult<Void> handleDoubaoApi(DoubaoApiException e) {
        log.error("豆包 API 异常", e);
        return AjaxJsonResult.error(502, "AI 服务暂时不可用，请稍后重试");
    }

    @ExceptionHandler(Exception.class)
    public AjaxJsonResult<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return AjaxJsonResult.error(500, "系统内部错误");
    }
}
