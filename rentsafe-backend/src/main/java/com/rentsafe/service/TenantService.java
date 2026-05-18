package com.rentsafe.service;

import com.rentsafe.entity.Unit;
import com.rentsafe.entity.User;
import com.rentsafe.repository.UnitRepository;
import com.rentsafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class TenantService {
    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Unit assignTenantToUnit(String unitId, String tenantId) {
        if (unitId == null || tenantId == null) {
            throw new RuntimeException("Unit ID and Tenant ID must not be null");
        }
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        unit.setTenant(tenant);
        unit.setStatus(Unit.UnitStatus.OCCUPIED);

        return unitRepository.save(unit);
    }

    @Transactional(readOnly = true)
    public Unit getTenantUnit(String tenantId) {
        return unitRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant has not been assigned a unit"));
    }

    /** Empty when the tenant is not linked to any unit (distinct from load errors). */
    @Transactional(readOnly = true)
    public Optional<Unit> findUnitForTenant(String tenantId) {
        return unitRepository.findByTenantId(tenantId);
    }

    @Transactional
    public com.rentsafe.payload.response.TenantOnboardResponse onboardTenant(
            com.rentsafe.payload.request.TenantOnboardRequest req, String ownerId, String unitId,
            org.springframework.security.crypto.password.PasswordEncoder encoder) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        if (!unit.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to onboard tenant for this unit");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Generate robust temporary password
        String generatedPassword = "RENT" + (int) (Math.random() * 9000 + 1000) + "@SAFE";

        User newTenant = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .name(req.getFirstName() + " " + req.getLastName())
                .email(req.getEmail())
                .password(encoder.encode(generatedPassword))
                .mobileNumber(req.getPhone())
                .location(req.getLocation())
                .occupation(req.getOccupation())
                .emergencyContactName(req.getEmergencyContactName())
                .emergencyContactNumber(req.getEmergencyContactNumber())
                .userType(com.rentsafe.entity.UserType.TENANT)
                .build();

        userRepository.save(newTenant);

        // Update Unit Financial Constraints
        unit.setRent(req.getRentAmount() != null ? req.getRentAmount() : unit.getRent());
        unit.setDeposit(req.getDepositAmount() != null ? req.getDepositAmount() : unit.getDeposit());
        unit.setLeaseEndDate(req.getLeaseEndDate());
        unit.setRentDueDate(req.getRentDueDate());
        unit.setOccupantsCount(req.getOccupantsCount());

        unit.setTenant(newTenant);
        unit.setStatus(Unit.UnitStatus.OCCUPIED);
        unit.setLastFilledDate(java.time.LocalDate.now());

        unitRepository.save(unit);

        return com.rentsafe.payload.response.TenantOnboardResponse.builder()
                .email(newTenant.getEmail())
                .generatedPassword(generatedPassword)
                .message("Tenant successfully onboarded and unit secured.")
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<User> getTenantsByOwner(String ownerId) {
        return unitRepository.findAll().stream()
                .filter(u -> u.getProperty().getOwner().getId().equals(ownerId))
                .filter(u -> u.getTenant() != null)
                .map(Unit::getTenant)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
    }
}
