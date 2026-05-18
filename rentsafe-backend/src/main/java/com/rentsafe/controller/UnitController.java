package com.rentsafe.controller;

import com.rentsafe.entity.Unit;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.TenantService;
import com.rentsafe.service.UnitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/units")
public class UnitController {

    @Autowired
    private UnitService unitService; // Need to create this service or merge logic

    @Autowired
    private TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<Unit> getMyUnit(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return tenantService.findUnitForTenant(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{unitId}/assign/{tenantId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Unit> assignTenant(@PathVariable String unitId, @PathVariable String tenantId) {
        return ResponseEntity.ok(tenantService.assignTenantToUnit(unitId, tenantId));
    }

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping("/{unitId}/onboard")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<com.rentsafe.payload.response.TenantOnboardResponse> onboardTenant(
            @PathVariable String unitId,
            @RequestBody com.rentsafe.payload.request.TenantOnboardRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(tenantService.onboardTenant(request, userDetails.getId(), unitId, passwordEncoder));
    }

    // Additional endpoint for owners to list units by property would go here
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<Unit>> getUnitsByProperty(@PathVariable String propertyId) {
        // Implement in UnitService ...
        // For now, assume it's done or I'll add methods
        return ResponseEntity.ok(unitService.getUnitsByProperty(propertyId));
    }

    @GetMapping("/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Unit> getUnitForOwner(
            @PathVariable String unitId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(unitService.getUnitForOwner(unitId, userDetails.getId()));
    }
}
