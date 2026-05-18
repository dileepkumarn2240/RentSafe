package com.rentsafe.payload.request;

import lombok.Data;

@Data
public class PreventiveLogRequest {
    private String unitId;
    private String category;
    private String notes;
}
