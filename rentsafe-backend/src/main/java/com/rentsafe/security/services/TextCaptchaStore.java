package com.rentsafe.security.services;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Random;

@Service
public class TextCaptchaStore {
    private final Map<String, String> captchaMap = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateCaptcha() {
        String id = UUID.randomUUID().toString();
        String code = generateCode(6);
        captchaMap.put(id, code);
        // Expiration logic could go here, but for now simple storage
        return id + ":" + code;
    }

    public boolean verify(String id, String value) {
        if (id == null || value == null) return false;
        String stored = captchaMap.get(id);
        if (stored != null && stored.equalsIgnoreCase(value)) {
            captchaMap.remove(id); // Use once
            return true;
        }
        return false;
    }

    private String generateCode(int length) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1 for clarity
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
