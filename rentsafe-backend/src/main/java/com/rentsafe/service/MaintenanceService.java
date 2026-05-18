package com.rentsafe.service;

import com.rentsafe.entity.MaintenanceIssueCategory;
import com.rentsafe.entity.MaintenanceProgramScope;
import com.rentsafe.entity.MaintenanceTicket;
import com.rentsafe.entity.MaintenanceTicket.TicketStatus;
import com.rentsafe.entity.Notification;
import com.rentsafe.entity.PreventiveMaintenanceProgram;
import com.rentsafe.entity.Property;
import com.rentsafe.entity.Unit;
import com.rentsafe.payload.request.MaintenanceProgramUpsertRequest;
import com.rentsafe.payload.response.MaintenanceProgramDTO;
import com.rentsafe.payload.response.OwnerMaintenanceSummaryDTO;
import com.rentsafe.repository.MaintenanceTicketRepository;
import com.rentsafe.repository.PreventiveMaintenanceProgramRepository;
import com.rentsafe.repository.PropertyRepository;
import com.rentsafe.repository.UnitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MaintenanceService {
    @Autowired
    private MaintenanceTicketRepository ticketRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private PreventiveMaintenanceProgramRepository programRepository;

    @Autowired
    private NotificationService notificationService;

    public MaintenanceTicket createTicket(MaintenanceTicket ticket, String unitId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        ticket.setUnit(unit);
        ticket.setTenant(unit.getTenant());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedAt(LocalDateTime.now());
        if (ticket.getIssueCategory() == null) {
            ticket.setIssueCategory(MaintenanceIssueCategory.GENERAL);
        }

        return ticketRepository.save(ticket);
    }

    public List<MaintenanceTicket> getTicketsForUnit(String unitId) {
        return ticketRepository.findByUnitId(unitId);
    }

    @Transactional
    public MaintenanceTicket resolveTicket(String ticketId, String resolution, MaintenanceIssueCategory categoryParam) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        MaintenanceIssueCategory cat = ticket.getIssueCategory() != null
                ? ticket.getIssueCategory()
                : (categoryParam != null ? categoryParam : MaintenanceIssueCategory.GENERAL);
        ticket.setIssueCategory(cat);
        ticket.setResolution(resolution != null ? resolution : "Resolved");
        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());

        MaintenanceTicket saved = ticketRepository.save(ticket);
        Unit unit = unitRepository.findByIdWithPropertyAndOwner(ticket.getUnit().getId())
                .orElseGet(() -> unitRepository.findById(ticket.getUnit().getId()).orElse(ticket.getUnit()));
        upsertProgramAfterService(unit, cat, LocalDate.now(), resolution);
        return saved;
    }

    @Transactional
    public void logPreventiveForOwner(String ownerId, String unitId, MaintenanceIssueCategory category, String notes) {
        Unit unit = unitRepository.findByIdWithPropertyAndOwner(unitId)
                .orElseThrow(() -> new RuntimeException("Unit not found"));
        if (unit.getProperty() == null || unit.getProperty().getOwner() == null
                || !unit.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Not allowed");
        }
        upsertProgramAfterService(unit, category != null ? category : MaintenanceIssueCategory.GENERAL, LocalDate.now(), notes);
    }

    private void upsertProgramAfterService(Unit unit, MaintenanceIssueCategory category, LocalDate serviceDate, String notes) {
        Property property = unit.getProperty();
        LocalDate next = MaintenanceIntervalUtil.computeNextDue(category, serviceDate);

        PreventiveMaintenanceProgram program = programRepository
                .findByProperty_IdAndUnit_IdAndCategory(property.getId(), unit.getId(), category)
                .orElse(PreventiveMaintenanceProgram.builder()
                        .scope(MaintenanceProgramScope.UNIT)
                        .property(property)
                        .unit(unit)
                        .category(category)
                        .build());

        program.setScope(MaintenanceProgramScope.UNIT);
        program.setProperty(property);
        program.setUnit(unit);
        program.setCategory(category);
        program.setLastServiceAt(serviceDate);
        program.setNextDueAt(next);
        if (notes != null && !notes.isBlank()) {
            program.setNotes(notes);
        }
        programRepository.save(program);
        notifyIfDueSoon(property.getOwner().getId(), unit.getName(), null, category, next);
    }

    private void notifyIfDueSoon(String ownerId, String unitLabel, String propertyName,
                                 MaintenanceIssueCategory category, LocalDate next) {
        LocalDate today = LocalDate.now();
        if (next != null && !next.isAfter(today.plusDays(30))) {
            String loc = unitLabel != null ? ("Unit " + unitLabel) : ("Property " + propertyName);
            notificationService.createNotification(ownerId, Notification.NotificationType.MAINTENANCE,
                    "Upcoming maintenance: " + category,
                    loc + " — next " + category + " by " + next + ".",
                    Notification.Urgency.MED);
        }
    }

    @Transactional(readOnly = true)
    public OwnerMaintenanceSummaryDTO getOwnerMaintenanceSummary(String ownerId) {
        LocalDate today = LocalDate.now();
        List<MaintenanceProgramDTO> out = new ArrayList<>();
        for (PreventiveMaintenanceProgram p : programRepository.findAllForOwner(ownerId)) {
            LocalDate next = p.getNextDueAt();
            boolean dueSoon = next != null && !next.isAfter(today.plusDays(30));
            String unitName = p.getUnit() != null ? p.getUnit().getName() : null;
            String unitId = p.getUnit() != null ? p.getUnit().getId() : null;
            out.add(MaintenanceProgramDTO.builder()
                    .id(p.getId())
                    .scope(p.getScope().name())
                    .propertyId(p.getProperty().getId())
                    .propertyName(p.getProperty().getName())
                    .unitId(unitId)
                    .unitName(unitName)
                    .category(p.getCategory().name())
                    .lastServiceAt(p.getLastServiceAt())
                    .nextDueAt(p.getNextDueAt())
                    .notes(p.getNotes())
                    .dueWithin30Days(dueSoon)
                    .build());
        }
        return OwnerMaintenanceSummaryDTO.builder().programs(out).build();
    }

    @Transactional
    public MaintenanceProgramDTO createProgram(String ownerId, MaintenanceProgramUpsertRequest req) {
        LocalDate today = LocalDate.now();
        MaintenanceProgramScope scope = parseScope(req.getScope());
        MaintenanceIssueCategory cat = parseCategory(req.getCategory())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category"));
        LocalDate last = LocalDate.parse(req.getLastServiceAt());
        LocalDate next = req.getNextDueAt() != null && !req.getNextDueAt().isBlank()
                ? LocalDate.parse(req.getNextDueAt())
                : MaintenanceIntervalUtil.computeNextDue(cat, last);

        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));
        if (property.getOwner() == null || !property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Not allowed");
        }

        if (scope == MaintenanceProgramScope.UNIT) {
            if (req.getUnitId() == null || req.getUnitId().isBlank()) {
                throw new IllegalArgumentException("unitId required for UNIT scope");
            }
            Unit unit = unitRepository.findById(req.getUnitId()).orElseThrow(() -> new RuntimeException("Unit not found"));
            if (!unit.getProperty().getId().equals(property.getId())) {
                throw new IllegalArgumentException("Unit does not belong to property");
            }
            PreventiveMaintenanceProgram program = programRepository
                    .findByProperty_IdAndUnit_IdAndCategory(property.getId(), unit.getId(), cat)
                    .orElse(PreventiveMaintenanceProgram.builder()
                            .scope(MaintenanceProgramScope.UNIT)
                            .property(property)
                            .unit(unit)
                            .category(cat)
                            .build());
            program.setScope(MaintenanceProgramScope.UNIT);
            program.setProperty(property);
            program.setUnit(unit);
            program.setCategory(cat);
            program.setLastServiceAt(last);
            program.setNextDueAt(next);
            program.setNotes(req.getNotes());
            PreventiveMaintenanceProgram saved = programRepository.save(program);
            notifyIfDueSoon(ownerId, unit.getName(), null, cat, next);
            return toDto(saved, today);
        }

        PreventiveMaintenanceProgram program = programRepository
                .findByProperty_IdAndUnitIsNullAndCategory(property.getId(), cat)
                .orElse(PreventiveMaintenanceProgram.builder()
                        .scope(MaintenanceProgramScope.PROPERTY)
                        .property(property)
                        .unit(null)
                        .category(cat)
                        .build());
        program.setScope(MaintenanceProgramScope.PROPERTY);
        program.setProperty(property);
        program.setUnit(null);
        program.setCategory(cat);
        program.setLastServiceAt(last);
        program.setNextDueAt(next);
        program.setNotes(req.getNotes());
        PreventiveMaintenanceProgram saved = programRepository.save(program);
        notifyIfDueSoon(ownerId, null, property.getName(), cat, next);
        return toDto(saved, today);
    }

    @Transactional
    public MaintenanceProgramDTO updateProgram(String ownerId, String programId, MaintenanceProgramUpsertRequest req) {
        PreventiveMaintenanceProgram p = programRepository.findByIdAndProperty_Owner_Id(programId, ownerId)
                .orElseThrow(() -> new RuntimeException("Program not found"));
        MaintenanceIssueCategory cat = parseCategory(req.getCategory())
                .orElseThrow(() -> new IllegalArgumentException("Invalid category"));
        p.setCategory(cat);
        p.setLastServiceAt(LocalDate.parse(req.getLastServiceAt()));
        p.setNextDueAt(req.getNextDueAt() != null && !req.getNextDueAt().isBlank()
                ? LocalDate.parse(req.getNextDueAt())
                : MaintenanceIntervalUtil.computeNextDue(cat, p.getLastServiceAt()));
        p.setNotes(req.getNotes());
        programRepository.save(p);
        return toDto(p, LocalDate.now());
    }

    @Transactional
    public void deleteProgram(String ownerId, String programId) {
        PreventiveMaintenanceProgram p = programRepository.findByIdAndProperty_Owner_Id(programId, ownerId)
                .orElseThrow(() -> new RuntimeException("Program not found"));
        programRepository.delete(p);
    }

    private MaintenanceProgramDTO toDto(PreventiveMaintenanceProgram p, LocalDate today) {
        LocalDate next = p.getNextDueAt();
        boolean dueSoon = next != null && !next.isAfter(today.plusDays(30));
        return MaintenanceProgramDTO.builder()
                .id(p.getId())
                .scope(p.getScope().name())
                .propertyId(p.getProperty().getId())
                .propertyName(p.getProperty().getName())
                .unitId(p.getUnit() != null ? p.getUnit().getId() : null)
                .unitName(p.getUnit() != null ? p.getUnit().getName() : null)
                .category(p.getCategory().name())
                .lastServiceAt(p.getLastServiceAt())
                .nextDueAt(p.getNextDueAt())
                .notes(p.getNotes())
                .dueWithin30Days(dueSoon)
                .build();
    }

    private MaintenanceProgramScope parseScope(String raw) {
        if (raw == null || raw.isBlank()) {
            return MaintenanceProgramScope.UNIT;
        }
        return MaintenanceProgramScope.valueOf(raw.trim().toUpperCase());
    }

    @Transactional
    public MaintenanceTicket assignTicket(String ticketId, String assignedTo) {
        MaintenanceTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        ticket.setAssignedTo(assignedTo);
        ticket.setStatus(TicketStatus.IN_PROGRESS);

        return ticketRepository.save(ticket);
    }

    public static Optional<MaintenanceIssueCategory> parseCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(MaintenanceIssueCategory.valueOf(raw.trim().toUpperCase()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
