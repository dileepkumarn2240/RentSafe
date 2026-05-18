package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class TenantOnboardResponse {
    private String email;
    private String generatedPassword;
    private String message;
}
