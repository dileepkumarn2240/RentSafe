package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * MaintenanceTicket entity - repair/maintenance requests from tenants.
 * 
 * Maps to frontend: MaintenanceTicket { id, tenantId, unitId, issue,
 * aiDiagnosis?, status, createdAt }
 */
@Entity
@Table(name = "maintenance_tickets", indexes = {
        @Index(name = "idx_ticket_unit", columnList = "unit_id"),
        @Index(name = "idx_ticket_tenant", columnList = "tenant_id"),
        @Index(name = "idx_ticket_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTicket extends BaseEntity {

    @NotBlank(message = "Issue description is required")
    @Size(max = 2000)
    @Column(nullable = false, length = 2000)
    private String issue;

    @Column(name = "ai_diagnosis", length = 5000)
    private String aiDiagnosis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @Column(length = 200)
    private String assignedTo;

    @Column(length = 1000)
    private String resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_category", length = 20)
    private MaintenanceIssueCategory issueCategory;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnore
    private Unit unit;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    @JsonIgnore
    private User tenant;

    // ---- Enums ----

    public enum TicketStatus {
        OPEN, IN_PROGRESS, RESOLVED
    }
}
