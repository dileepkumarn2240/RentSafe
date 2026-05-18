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
public class UnitStatusSummary {
    private String unitId;
    private String unitName;

    private String occupancyStatus; // OCCUPIED/VACANT
    private String rentStatus; // PAID/PENDING/null

    private int billsDueCount;
    private int openTicketsCount;
    private int renewalsDueSoon; // 0/1 flag

    private LocalDate leaseEndDate;
    private LocalDate rentDueDate;
}

