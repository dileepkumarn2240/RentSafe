package com.rentsafe.controller;

import com.rentsafe.entity.InventoryRecord;
import com.rentsafe.entity.Unit;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.InventoryService;
import com.rentsafe.service.TenantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private TenantService tenantService;

    @GetMapping("/me")
    @PreAuthorize("hasAuthority('TENANT')")
    public ResponseEntity<List<InventoryRecord>> getMyInventory(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        Unit unit = tenantService.getTenantUnit(userDetails.getId());
        return ResponseEntity.ok(inventoryService.getInventoryByUnit(unit.getId()));
    }

    @GetMapping("/unit/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<List<InventoryRecord>> getUnitInventory(@PathVariable String unitId) {
        return ResponseEntity.ok(inventoryService.getInventoryByUnit(unitId));
    }

    @PostMapping("/unit/{unitId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<InventoryRecord> addItem(@PathVariable String unitId, @RequestBody InventoryRecord item) {
        return ResponseEntity.ok(inventoryService.addInventoryItem(unitId, item));
    }

    @PatchMapping("/{itemId}/condition")
    public ResponseEntity<InventoryRecord> updateCondition(@PathVariable String itemId, @RequestBody String condition) {
        return ResponseEntity.ok(inventoryService.updateCondition(itemId,
                InventoryRecord.ItemCondition.valueOf(condition.replace("\"", ""))));
    }
}
