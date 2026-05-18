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
public class RenewalRowDTO {
    private String unitId;
    private String unitName;
    private String propertyName;
    /** LEASE_END or RENT_DUE */
    private String kind;
    private LocalDate dueDate;
}
