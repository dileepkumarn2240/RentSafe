package com.rentsafe.service;

import com.rentsafe.entity.Unit;
import com.rentsafe.repository.UnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UnitService {

    @Autowired
    private UnitRepository unitRepository;

    public List<Unit> getUnitsByProperty(String propertyId) {
        return unitRepository.findByPropertyId(propertyId);
    }

    public Unit getUnit(String unitId) {
        return unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));
    }

    @Transactional(readOnly = true)
    public Unit getUnitForOwner(String unitId, String ownerId) {
        Unit unit = getUnit(unitId);
        if (unit.getProperty() == null || unit.getProperty().getOwner() == null) {
            throw new RuntimeException("Unit has no property owner");
        }
        if (!unit.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }
        return unit;
    }
}
