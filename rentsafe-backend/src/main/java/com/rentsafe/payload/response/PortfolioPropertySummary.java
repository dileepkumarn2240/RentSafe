package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Owner portfolio card summary for a single property.
 * Designed for dashboards: no deep unit graphs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioPropertySummary {
    private String propertyId;
    private String name;
    private String address;

    private int totalUnits;
    private int occupiedUnits;
    private int vacantUnits;

    private int pendingRentCount;
    private int openTicketsCount;
    private int renewalsDueSoonCount;
}

