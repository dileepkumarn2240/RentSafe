package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenancySummary {
    private String unitId;
    private String unitName;
    private String propertyId;
    private String propertyName;

    private String agreementType; // RENTAL / LEASE
    private BigDecimal deposit;

    private BigDecimal rent; // monthly rent for rentals
    private BigDecimal leaseAmount; // for lease agreements
    private Integer leaseTenure; // months (optional)

    private LocalDate rentDueDate; // next rent due (if rental)
    private LocalDate leaseEndDate; // renewal date (if lease)
    private String rentStatus; // PAID/PENDING/null
}

