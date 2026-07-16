package com.example.aiimage.util;

import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class SensitiveFilter {
    private static final Set<String> SENSITIVE_WORDS = Set.of(
            "暴力", "色情", "赌博", "毒品");

    public List<String> check(String text) {
        if (text == null || text.isBlank()) return List.of();
        return SENSITIVE_WORDS.stream()
                .filter(word -> text.contains(word))
                .collect(Collectors.toList());
    }
}
