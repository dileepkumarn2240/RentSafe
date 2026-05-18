package com.rentsafe.repository;

import com.rentsafe.entity.InventoryRecord;
import com.rentsafe.entity.InventoryRecord.ItemCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, String> {

    // Find all items in a unit
    List<InventoryRecord> findByUnitId(String unitId);

    // Find items by condition (e.g., for damage reports)
    List<InventoryRecord> findByUnitIdAndCondition(String unitId, ItemCondition condition);

    // Find unverified items
    List<InventoryRecord> findByUnitIdAndVerifiedFalse(String unitId);
}
