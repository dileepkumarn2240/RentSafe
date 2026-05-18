package com.rentsafe.security.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class CaptchaService {

    @Value("${rentsafe.recaptcha.secret}")
    private String secretKey;

    @Value("${rentsafe.recaptcha.verify-url}")
    private String verifyUrl;

    public boolean verifyCaptcha(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        RestTemplate restTemplate = new RestTemplate();
        Map<String, String> body = new HashMap<>();
        body.put("secret", secretKey);
        body.put("response", token);

        // reCAPTCHA v3 verification
        Map<String, Object> response = restTemplate.postForObject(
                verifyUrl + "?secret=" + secretKey + "&response=" + token,
                null, Map.class);

        if (response == null || !((Boolean) response.get("success"))) {
            return false;
        }

        // Optional: Check score for v3
        Double score = (Double) response.get("score");
        if (score != null && score < 0.5) {
            return false;
        }

        return true;
    }
}
