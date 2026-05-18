package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Owner-maintained preventive maintenance schedule (no synthetic rows; persisted only when created or resolved).
 */
@Entity
@Table(name = "preventive_maintenance_programs", indexes = {
        @Index(name = "idx_pmp_property", columnList = "property_id"),
        @Index(name = "idx_pmp_unit", columnList = "unit_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreventiveMaintenanceProgram extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private MaintenanceProgramScope scope;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    @JsonIgnore
    private Unit unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MaintenanceIssueCategory category;

    @Column(name = "last_service_at")
    private LocalDate lastServiceAt;

    @Column(name = "next_due_at")
    private LocalDate nextDueAt;

    @Column(length = 2000)
    private String notes;
}
