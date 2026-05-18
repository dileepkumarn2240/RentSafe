package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertySummary {
    private String propertyId;
    private String name;
    private String address;

    private int totalUnits;
    private int occupiedUnits;
    private int vacantUnits;
    private int pendingRentCount;
    private int openTicketsCount;
    private int renewalsDueSoonCount;

    private List<UnitStatusSummary> units;
}

