package com.example.aiimage.R;

import lombok.Data;

@Data
public class AjaxJsonResult<T> {
    private int code;
    private String message;
    private T data;

    public AjaxJsonResult() {}

    public AjaxJsonResult(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> AjaxJsonResult<T> success(T data) {
        return new AjaxJsonResult<>(200, "操作成功", data);
    }

    public static <T> AjaxJsonResult<T> success(String message, T data) {
        return new AjaxJsonResult<>(200, message, data);
    }

    public static <T> AjaxJsonResult<T> error(int code, String message) {
        return new AjaxJsonResult<>(code, message, null);
    }
}
