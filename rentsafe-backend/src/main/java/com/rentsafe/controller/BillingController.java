package com.rentsafe.controller;

import com.rentsafe.entity.Bill;
import com.rentsafe.entity.Unit;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.BillingService;
import com.rentsafe.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bills")
public class BillingController {

    @Autowired
    private BillingService billingService;

    @Autowired
    private TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<List<Bill>> getMyBills(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Unit unit = tenantService.getTenantUnit(userDetails.getId());
        return ResponseEntity.ok(billingService.getBillsForUnit(unit.getId()));
    }

    @PostMapping("/pay/{billId}")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<Bill> payBill(@PathVariable String billId, @RequestBody String paymentRef) {
        return ResponseEntity.ok(billingService.payBill(billId, paymentRef));
    }

    @GetMapping("/unit/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<Bill>> getUnitBills(@PathVariable String unitId) {
        return ResponseEntity.ok(billingService.getBillsForUnit(unitId));
    }

    @PostMapping("/unit/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Bill> createBill(@PathVariable String unitId, @RequestBody Bill bill) {
        return ResponseEntity.ok(billingService.generateBill(unitId, bill));
    }
}
