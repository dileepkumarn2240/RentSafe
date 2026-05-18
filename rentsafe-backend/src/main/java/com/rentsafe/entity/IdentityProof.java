package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * IdentityProof entity - KYC documents uploaded by tenants.
 * 
 * Security: Document numbers are encrypted at rest. Only the document owner
 * and their property owner can view the full number. API responses mask
 * the middle digits (e.g., "1234 •••• •••• 5678").
 * 
 * Maps to frontend: IdentityProof { id, type, number, status, documentUrl?,
 * uploadDate }
 */
@Entity
@Table(name = "identity_proofs", indexes = {
        @Index(name = "idx_idproof_user", columnList = "user_id"),
        @Index(name = "idx_idproof_unit", columnList = "unit_id"),
        @Index(name = "idx_idproof_status", columnList = "status"),
        @Index(name = "idx_idproof_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IdentityProof extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProofType type;

    /**
     * The actual document number. Stored encrypted in production.
     * API layer masks this before sending to client.
     */
    @NotBlank(message = "Document number is required")
    @Column(name = "document_number", nullable = false, length = 100)
    private String number;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "dob")
    private LocalDate dateOfBirth;

    @Column(name = "permanent_address", length = 500)
    private String permanentAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private ProofStatus status = ProofStatus.PENDING;

    @Column(name = "front_file_path", length = 500)
    private String frontFilePath;

    @Column(name = "back_file_path", length = 500)
    private String backFilePath;

    @Transient
    private String documentUrl;

    @Transient
    private String backDocumentUrl;

    @Column(name = "viewed_by_owner")
    @Builder.Default
    private boolean viewedByOwner = false;

    @NotNull(message = "Upload date is required")
    @Column(name = "upload_date", nullable = false)
    private LocalDate uploadDate;

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "verification_notes", length = 500)
    private String verificationNotes;

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

    // ---- Enums ----

    public enum ProofType {
        AADHAAR, PAN, VOTER_ID, DRIVING_LICENSE, OTHER
    }

    public enum ProofStatus {
        PENDING, VERIFIED, REJECTED
    }
}
