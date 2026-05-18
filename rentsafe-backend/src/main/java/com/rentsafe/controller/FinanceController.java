package com.rentsafe.controller;

import com.rentsafe.payload.response.AnalyticsTrends;
import com.rentsafe.payload.response.FinanceMetrics;
import com.rentsafe.payload.response.LeaseSummary;
import com.rentsafe.payload.response.RevenueInsight;
import com.rentsafe.payload.response.UnitRevenueDTO;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import com.rentsafe.payload.response.RenewalRowDTO;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping("/insights")
    @PreAuthorize("hasAuthority('OWNER')")
    @Deprecated
    public ResponseEntity<RevenueInsight> getInsights(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getOwnerInsights(userDetails.getId()));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<FinanceMetrics> getMetrics(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getFinanceMetrics(userDetails.getId()));
    }

    @GetMapping("/units")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<UnitRevenueDTO>> getUnitRevenues(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getUnitRevenues(userDetails.getId()));
    }

    @GetMapping("/analytics/trends")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<AnalyticsTrends> getTrends(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getAnalyticsTrends(userDetails.getId()));
    }

    @GetMapping("/analytics/expenses")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Map<String, BigDecimal>> getExpenses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getExpenseBreakdown(userDetails.getId()));
    }

    @GetMapping("/analytics/leases")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<LeaseSummary> getLeaseSummary(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(financeService.getLeaseSummary(userDetails.getId()));
    }

    @GetMapping("/renewals")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<RenewalRowDTO>> getRenewals(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(name = "days", defaultValue = "90") int days) {
        return ResponseEntity.ok(financeService.getRenewalsForOwner(userDetails.getId(), days));
    }

    @PutMapping("/units/{unitId}/bills/{billType}/paid")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> markBillPaid(@PathVariable String unitId, @PathVariable String billType) {
        financeService.markBillPaid(unitId, billType);
        return ResponseEntity.ok().build();
    }
}
