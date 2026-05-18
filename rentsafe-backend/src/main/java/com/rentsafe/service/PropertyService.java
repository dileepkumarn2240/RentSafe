package com.rentsafe.service;

import com.rentsafe.entity.Property;
import com.rentsafe.entity.TenantHistory;
import com.rentsafe.entity.Unit;
import com.rentsafe.entity.User;
import com.rentsafe.entity.Bill;
import com.rentsafe.entity.MaintenanceTicket;
import com.rentsafe.payload.response.PropertySummary;
import com.rentsafe.payload.response.UnitStatusSummary;
import com.rentsafe.repository.BillRepository;
import com.rentsafe.repository.MaintenanceTicketRepository;
import com.rentsafe.repository.PropertyRepository;
import com.rentsafe.repository.UnitRepository;
import com.rentsafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.util.ArrayList;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaintenanceTicketRepository maintenanceTicketRepository;

    @Autowired
    private BillRepository billRepository;

    public List<Property> getPropertiesByOwner(String ownerId) {
        return propertyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public PropertySummary getPropertySummary(String ownerId, String propertyId, int renewalWindowDays) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<Unit> units = unitRepository.findByPropertyId(propertyId);
        List<String> unitIds = units.stream().map(Unit::getId).toList();

        Map<String, Long> openTicketsByUnit = maintenanceTicketRepository.findByUnitIdIn(unitIds).stream()
                .filter(t -> t.getStatus() != MaintenanceTicket.TicketStatus.RESOLVED)
                .collect(Collectors.groupingBy(t -> t.getUnit().getId(), Collectors.counting()));

        Map<String, Long> pendingBillsByUnit = billRepository.findByUnitIdIn(unitIds).stream()
                .filter(b -> b.getStatus() != null && b.getStatus() != Bill.BillStatus.PAID)
                .collect(Collectors.groupingBy(b -> b.getUnit().getId(), Collectors.counting()));

        LocalDate cutoff = LocalDate.now().plusDays(Math.max(renewalWindowDays, 0));

        int totalUnits = units.size();
        int occupiedUnits = 0;
        int vacantUnits = 0;
        int pendingRentCount = 0;
        int openTicketsCount = 0;
        int renewalsDueSoonCount = 0;

        List<UnitStatusSummary> unitSummaries = new ArrayList<>();
        for (Unit u : units) {
            if (u.getStatus() == Unit.UnitStatus.OCCUPIED) occupiedUnits++;
            if (u.getStatus() == Unit.UnitStatus.VACANT) vacantUnits++;
            if (u.getRentStatus() == Unit.RentStatus.PENDING) pendingRentCount++;

            long openTickets = openTicketsByUnit.getOrDefault(u.getId(), 0L);
            long billsDue = pendingBillsByUnit.getOrDefault(u.getId(), 0L);
            boolean renewalSoon = u.getLeaseEndDate() != null && !u.getLeaseEndDate().isAfter(cutoff);

            openTicketsCount += (int) openTickets;
            if (renewalSoon) renewalsDueSoonCount++;

            unitSummaries.add(UnitStatusSummary.builder()
                    .unitId(u.getId())
                    .unitName(u.getName())
                    .occupancyStatus(u.getStatus() != null ? u.getStatus().name() : null)
                    .rentStatus(u.getRentStatus() != null ? u.getRentStatus().name() : null)
                    .billsDueCount((int) billsDue)
                    .openTicketsCount((int) openTickets)
                    .renewalsDueSoon(renewalSoon ? 1 : 0)
                    .leaseEndDate(u.getLeaseEndDate())
                    .rentDueDate(u.getRentDueDate())
                    .build());
        }

        return PropertySummary.builder()
                .propertyId(property.getId())
                .name(property.getName())
                .address(property.getAddress())
                .totalUnits(totalUnits)
                .occupiedUnits(occupiedUnits)
                .vacantUnits(vacantUnits)
                .pendingRentCount(pendingRentCount)
                .openTicketsCount(openTicketsCount)
                .renewalsDueSoonCount(renewalsDueSoonCount)
                .units(unitSummaries)
                .build();
    }

    @Transactional
    public Property createProperty(Property property, @NonNull String ownerId) {
        Objects.requireNonNull(ownerId, "Owner ID cannot be null");
        User owner = userRepository.findById(ownerId).orElseThrow(() -> new RuntimeException("Owner not found"));
        property.setOwner(owner);

        // Generate Registry ID: First 5 characters of name + 5 random digits
        String nameRef = property.getName().replaceAll("[^a-zA-Z]", "").toUpperCase();
        String prefix = nameRef.length() >= 5 ? nameRef.substring(0, 5) : (nameRef + "XXXXX").substring(0, 5);
        String randomPart = String.format("%05d", (int) (Math.random() * 100000));
        property.setRegistryId(prefix + randomPart);

        return propertyRepository.save(property);
    }

    @Transactional
    public void deleteProperty(String propertyId, @NonNull String ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }
        propertyRepository.delete(property);
    }

    @Transactional
    public Unit addUnitToProperty(String propertyId, Unit unit) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        unit.setProperty(property);
        property.getUnits().add(unit);

        return unitRepository.save(unit);
    }

    @Transactional
    public Unit updateUnit(String unitId, Unit unitRequest, String ownerId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        if (!unit.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        unit.setName(unitRequest.getName());
        unit.setRent(unitRequest.getRent());
        unit.setDeposit(unitRequest.getDeposit());
        unit.setAgreementType(unitRequest.getAgreementType());
        unit.setLeaseAmount(unitRequest.getLeaseAmount());
        unit.setLeaseTenure(unitRequest.getLeaseTenure());
        
        // Handle transition to VACANT
        boolean wasOccupied = unit.getStatus() == Unit.UnitStatus.OCCUPIED || unit.getTenant() != null;
        if (wasOccupied && unitRequest.getStatus() == Unit.UnitStatus.VACANT) {
            if (unit.getTenant() != null) {
                TenantHistory history = TenantHistory.builder()
                        .unit(unit)
                        .tenantName(unit.getTenant().getName())
                        .tenantEmail(unit.getTenant().getEmail())
                        .tenantPhone(unit.getTenant().getMobileNumber())
                        .leaseStartDate(unit.getLastFilledDate())
                        .leaseEndDate(unit.getLeaseEndDate())
                        .movedOutDate(java.time.LocalDate.now())
                        .rent(unit.getRent())
                        .deposit(unit.getDeposit())
                        .agreementType(unit.getAgreementType())
                        .leaseAmount(unit.getLeaseAmount())
                        .leaseTenure(unit.getLeaseTenure())
                        .build();
                unit.getTenantHistories().add(history);
                unit.setTenant(null);
            }
            unit.setLastVacantDate(java.time.LocalDate.now());
            unit.setRentStatus(null);
            unit.setStatus(Unit.UnitStatus.VACANT);
        } else if (unit.getTenant() != null) {
            // Safety: If tenant exists, force OCCUPIED status regardless of request
            unit.setStatus(Unit.UnitStatus.OCCUPIED);
        } else {
            unit.setStatus(unitRequest.getStatus());
        }
        unit.setUnitType(unitRequest.getUnitType());
        unit.setSqFt(unitRequest.getSqFt());
        unit.setFurnishedStatus(unitRequest.getFurnishedStatus());

        return unitRepository.save(unit);
    }

    @Transactional
    public void deleteUnit(String unitId, String ownerId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        if (!unit.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized");
        }

        unitRepository.delete(unit);
    }
}
