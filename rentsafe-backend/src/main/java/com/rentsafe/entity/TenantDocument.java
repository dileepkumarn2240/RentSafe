package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * TenantDocument entity - documents uploaded/managed per tenant (lease, police
 * verification, etc.)
 * 
 * Maps to frontend: TenantDocument { id, name, type, status, fileUrl?,
 * uploadDate }
 */
@Entity
@Table(name = "tenant_documents", indexes = {
        @Index(name = "idx_tdoc_user", columnList = "user_id"),
        @Index(name = "idx_tdoc_unit", columnList = "unit_id"),
        @Index(name = "idx_tdoc_status", columnList = "status"),
        @Index(name = "idx_tdoc_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantDocument extends BaseEntity {

    @NotBlank(message = "Document name is required")
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private DocumentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Transient
    private String displayUrl;

    @NotNull(message = "Upload date is required")
    @Column(name = "upload_date", nullable = false)
    private LocalDate uploadDate;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    @JsonIgnore
    private Unit unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    @JsonIgnore
    private Property property;

    // ---- Enums ----

    public enum DocumentType {
        // Legal Agreements
        LEASE_AGREEMENT, RENTAL_AGREEMENT, SALES_AGREEMENT,
        // Identity Proofs
        AADHAAR, PAN_CARD, DRIVING_LICENSE, PASSPORT,
        // Owner Documents
        UTILITY_BILL, POLICE_VERIFICATION, PROPERTY_DEED, TAX_RECEIPT, INSURANCE_POLICY,
        OTHER
    }

    public enum DocumentStatus {
        ACTIVE, EXPIRED, PENDING
    }
}
