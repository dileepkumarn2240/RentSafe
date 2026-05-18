package com.rentsafe.controller;

import com.rentsafe.entity.Unit;
import com.rentsafe.payload.response.TenancySummary;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tenancy")
public class TenancyController {

    @Autowired
    private TenantService tenantService;

    @GetMapping("/me/summary")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<TenancySummary> getMySummary(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Unit unit = tenantService.getTenantUnit(userDetails.getId());
        return ResponseEntity.ok(TenancySummary.builder()
                .unitId(unit.getId())
                .unitName(unit.getName())
                .propertyId(unit.getProperty() != null ? unit.getProperty().getId() : null)
                .propertyName(unit.getProperty() != null ? unit.getProperty().getName() : null)
                .agreementType(unit.getAgreementType() != null ? unit.getAgreementType().name() : "RENTAL")
                .deposit(unit.getDeposit())
                .rent(unit.getRent())
                .leaseAmount(unit.getLeaseAmount())
                .leaseTenure(unit.getLeaseTenure())
                .rentDueDate(unit.getRentDueDate())
                .leaseEndDate(unit.getLeaseEndDate())
                .rentStatus(unit.getRentStatus() != null ? unit.getRentStatus().name() : null)
                .build());
    }
}

