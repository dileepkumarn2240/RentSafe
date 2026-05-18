package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Owner portfolio summary for dashboards.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummary {
    private int propertiesCount;
    private int totalUnits;
    private int occupiedUnits;
    private int vacantUnits;
    private int pendingRentCount;
    private int openTicketsCount;
    private int renewalsDueSoonCount;

    private List<PortfolioPropertySummary> properties;
}

