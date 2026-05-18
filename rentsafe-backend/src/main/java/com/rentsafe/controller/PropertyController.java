package com.rentsafe.controller;

import com.rentsafe.entity.Property;
import com.rentsafe.entity.Unit;
import com.rentsafe.payload.response.PropertySummary;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.PropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private PropertyService propertyService;

    @GetMapping
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<Property>> getMyProperties(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(propertyService.getPropertiesByOwner(userDetails.getId()));
    }

    @GetMapping("/{propertyId}/summary")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<PropertySummary> getPropertySummary(
            @PathVariable String propertyId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(name = "renewalWindowDays", defaultValue = "30") int renewalWindowDays) {
        return ResponseEntity.ok(propertyService.getPropertySummary(userDetails.getId(), propertyId, renewalWindowDays));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Property> createProperty(@AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Property property) {
        return ResponseEntity.ok(propertyService.createProperty(property, userDetails.getId()));
    }

    @PostMapping("/{propertyId}/units")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Unit> addUnit(@PathVariable String propertyId, @RequestBody Unit unit) {
        return ResponseEntity.ok(propertyService.addUnitToProperty(propertyId, unit));
    }

    @PutMapping("/units/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<Unit> updateUnit(@PathVariable String unitId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Unit unit) {
        return ResponseEntity.ok(propertyService.updateUnit(unitId, unit, userDetails.getId()));
    }

    @DeleteMapping("/units/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> deleteUnit(@PathVariable String unitId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        propertyService.deleteUnit(unitId, userDetails.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{propertyId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<?> deleteProperty(@PathVariable String propertyId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        propertyService.deleteProperty(propertyId, userDetails.getId());
        return ResponseEntity.ok().build();
    }
}
