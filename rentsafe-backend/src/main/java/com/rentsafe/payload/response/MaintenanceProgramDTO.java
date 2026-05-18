package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceProgramDTO {
    private String id;
    private String scope;
    private String propertyId;
    private String propertyName;
    private String unitId;
    private String unitName;
    private String category;
    private LocalDate lastServiceAt;
    private LocalDate nextDueAt;
    private String notes;
    private boolean dueWithin30Days;
}
