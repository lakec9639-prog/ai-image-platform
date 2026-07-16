package com.example.aiimage.service;

public interface DoubaoImageService {
    String textToImage(String prompt, String size, String style, Boolean watermark);
    String imageToImage(String sourceImageBase64, String prompt, Double strength,
                         String size, String style);
}
