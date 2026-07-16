package com.example.aiimage.service;

import java.io.InputStream;

public interface MinioService {
    String uploadFromUrl(String imageUrl, String bucket, String objectName);
    String putObject(String bucket, String objectName, InputStream inputStream, String contentType);
    String getPresignedUrl(String bucket, String objectName);
    void deleteFile(String bucket, String objectName);
}
