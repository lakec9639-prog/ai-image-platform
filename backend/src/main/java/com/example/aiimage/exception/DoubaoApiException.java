package com.example.aiimage.exception;

public class DoubaoApiException extends RuntimeException {
    public DoubaoApiException(String message) { super(message); }
    public DoubaoApiException(String message, Throwable cause) { super(message, cause); }
}
