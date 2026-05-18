package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO for detailed unit-level revenue and collection status.
 * Matches collection pillars: Rent, Maintenance, Water, Electricity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitRevenueDTO {
    private String unitId;
    private String unitName;
    private String propertyName;
    private BigDecimal monthlyRent;
    private String rentStatus; // PAID, PENDING
    private String agreementType; // RENTAL, LEASE
    private BigDecimal leaseAmount;
    private Integer leaseTenure;
    private String lastOccupancyUpdate;
    
    // Status of specific bill types for the current/latest cycle
    // Key: BillType string, Value: BillStatus string (PAID, PENDING, NONE)
    private Map<String, String> billStatuses;
}
