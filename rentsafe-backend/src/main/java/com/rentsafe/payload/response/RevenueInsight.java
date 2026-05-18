package com.rentsafe.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueInsight {
    private BigDecimal monthlyGross;
    private BigDecimal monthlyNet;
    private BigDecimal potentialRevenue;
    private BigDecimal pendingRent;
    private BigDecimal totalExpenses;
    private BigDecimal maintenanceReserve;
    private BigDecimal collectedBillsAllTime;
    private BigDecimal collectedBillsThisMonth;
    private BigDecimal rentMarkedPaidPortfolioTotal;
    private BigDecimal totalCollectedRecognized;
    private BigDecimal totalLeaseDeposits;
    private Integer activeLeaseCount;
    private Map<String, BigDecimal> expenseBreakdown;
    private List<BigDecimal> monthlyTrends;
    private List<UnitRevenueDTO> unitRevenues;
    private Map<String, BigDecimal> historicalRevenue; // "JAN-2024", "2023", etc.
}
