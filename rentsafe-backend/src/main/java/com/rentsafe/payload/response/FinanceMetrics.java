package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceMetrics {
    private BigDecimal monthlyGross;
    private BigDecimal monthlyNet;
    private BigDecimal potentialRevenue;
    private BigDecimal pendingRent;
    private BigDecimal totalExpenses;
    private BigDecimal maintenanceReserve;
    
    // Original Fields
    private BigDecimal collectedBillsAllTime;
    private BigDecimal collectedBillsThisMonth;
    private BigDecimal rentMarkedPaidPortfolioTotal;
    private BigDecimal totalCollectedRecognized;

    // Simplified UI Fields
    private BigDecimal expectedMonthlyRent;
    private BigDecimal successfullyCollected;
    private BigDecimal unpaidRent;
    private BigDecimal outstandingUtilityBills;
}
