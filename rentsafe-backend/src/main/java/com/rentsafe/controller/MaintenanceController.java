package com.rentsafe.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.rentsafe.entity.MaintenanceIssueCategory;
import com.rentsafe.entity.MaintenanceTicket;
import com.rentsafe.entity.Unit;
import com.rentsafe.payload.request.MaintenanceProgramUpsertRequest;
import com.rentsafe.payload.request.PreventiveLogRequest;
import com.rentsafe.payload.response.MaintenanceProgramDTO;
import com.rentsafe.payload.response.OwnerMaintenanceSummaryDTO;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.MaintenanceService;
import com.rentsafe.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<List<MaintenanceTicket>> getMyTickets(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Unit unit = tenantService.getTenantUnit(userDetails.getId());
        return ResponseEntity.ok(maintenanceService.getTicketsForUnit(unit.getId()));
    }

    @PostMapping("/me")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<MaintenanceTicket> createTicket(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody MaintenanceTicket ticket) {
        Unit unit = tenantService.getTenantUnit(userDetails.getId());
        return ResponseEntity.ok(maintenanceService.createTicket(ticket, unit.getId()));
    }

    @GetMapping("/unit/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<MaintenanceTicket>> getUnitTickets(@PathVariable String unitId) {
        return ResponseEntity.ok(maintenanceService.getTicketsForUnit(unitId));
    }

    /**
     * Accepts either a JSON string (legacy) or {"resolution":"...","issueCategory":"PLUMBING"}.
     */
    @PutMapping("/{ticketId}/resolve")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<MaintenanceTicket> resolveTicket(@PathVariable String ticketId,
            @RequestBody JsonNode body) {
        String resolution;
        MaintenanceIssueCategory category = null;
        if (body == null || body.isNull()) {
            resolution = "Resolved by owner";
        } else if (body.isTextual()) {
            resolution = body.asText();
        } else {
            resolution = body.path("resolution").asText("Resolved by owner");
            String catRaw = body.path("issueCategory").asText(null);
            category = MaintenanceService.parseCategory(catRaw).orElse(null);
        }
        return ResponseEntity.ok(maintenanceService.resolveTicket(ticketId, resolution, category));
    }

    @GetMapping("/owner/summary")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<OwnerMaintenanceSummaryDTO> getOwnerSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(maintenanceService.getOwnerMaintenanceSummary(userDetails.getId()));
    }

    @PostMapping("/owner/preventive")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Void> logPreventive(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody PreventiveLogRequest request) {
        MaintenanceIssueCategory cat = MaintenanceService.parseCategory(request.getCategory())
                .orElse(MaintenanceIssueCategory.GENERAL);
        maintenanceService.logPreventiveForOwner(userDetails.getId(), request.getUnitId(), cat, request.getNotes());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/owner/programs")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<MaintenanceProgramDTO> createProgram(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody MaintenanceProgramUpsertRequest body) {
        return ResponseEntity.ok(maintenanceService.createProgram(userDetails.getId(), body));
    }

    @PutMapping("/owner/programs/{programId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<MaintenanceProgramDTO> updateProgram(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String programId,
            @RequestBody MaintenanceProgramUpsertRequest body) {
        return ResponseEntity.ok(maintenanceService.updateProgram(userDetails.getId(), programId, body));
    }

    @DeleteMapping("/owner/programs/{programId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Void> deleteProgram(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String programId) {
        maintenanceService.deleteProgram(userDetails.getId(), programId);
        return ResponseEntity.noContent().build();
    }
}
