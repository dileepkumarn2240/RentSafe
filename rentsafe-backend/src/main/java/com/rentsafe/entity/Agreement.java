package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Agreement entity - legal documents like leases, licenses, maintenance
 * contracts.
 * 
 * Maps to frontend: Agreement { id, name, type, startDate, endDate, status }
 */
@Entity
@Table(name = "agreements", indexes = {
        @Index(name = "idx_agreement_unit", columnList = "unit_id"),
        @Index(name = "idx_agreement_status", columnList = "status"),
        @Index(name = "idx_agreement_end_date", columnList = "end_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agreement extends BaseEntity {

    @NotBlank(message = "Agreement name is required")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AgreementType type;

    @NotNull(message = "Start date is required")
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    @Builder.Default
    private AgreementStatus status = AgreementStatus.PENDING_SIGNATURE;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnore
    private Unit unit;

    // ---- Enums ----

    public enum AgreementType {
        LEASE, LICENSE, MAINTENANCE
    }

    public enum AgreementStatus {
        ACTIVE, EXPIRED, PENDING_SIGNATURE
    }
}
