package com.rentsafe.service;

import com.rentsafe.entity.InventoryRecord;
import com.rentsafe.entity.Unit;
import com.rentsafe.repository.InventoryRecordRepository;
import com.rentsafe.repository.UnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRecordRepository inventoryRepository;

    @Autowired
    private UnitRepository unitRepository;

    public List<InventoryRecord> getInventoryByUnit(String unitId) {
        return inventoryRepository.findByUnitId(unitId);
    }

    public InventoryRecord addInventoryItem(String unitId, InventoryRecord item) {
        Unit unit = unitRepository.findById(unitId).orElseThrow(() -> new RuntimeException("Unit not found"));
        item.setUnit(unit);
        item.setLastAudit(LocalDate.now());
        return inventoryRepository.save(item);
    }

    public InventoryRecord updateCondition(String itemId, InventoryRecord.ItemCondition condition) {
        InventoryRecord item = inventoryRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        item.setCondition(condition);
        item.setLastAudit(LocalDate.now());
        return inventoryRepository.save(item);
    }
}
