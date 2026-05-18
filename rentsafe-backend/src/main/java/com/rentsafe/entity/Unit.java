package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Unit entity - represents an individual rental unit within a property.
 * 
 * Maps to frontend: Unit { id, name, tenantName?, tenantId?, rent, deposit,
 * status,
 * rentStatus?, agreements[], identityProofs?, documents?, inventory?,
 * leaseEndDate?, rentDueDate? }
 */
@Entity
@Table(name = "units", indexes = {
        @Index(name = "idx_unit_property", columnList = "property_id"),
        @Index(name = "idx_unit_tenant", columnList = "tenant_id"),
        @Index(name = "idx_unit_status", columnList = "status"),
        @Index(name = "idx_unit_rent_status", columnList = "rent_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Unit extends BaseEntity {

    @NotBlank(message = "Unit name/number is required")
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String name;

    @NotNull(message = "Rent amount is required")
    @DecimalMin(value = "0.0", message = "Rent must be positive")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal rent;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.0", message = "Deposit must be positive")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private UnitStatus status = UnitStatus.VACANT;

    @Enumerated(EnumType.STRING)
    @Column(name = "rent_status", length = 10)
    private RentStatus rentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "agreement_type", length = 15)
    @Builder.Default
    private AgreementType agreementType = AgreementType.RENTAL;

    @Column(name = "lease_amount", precision = 12, scale = 2)
    private BigDecimal leaseAmount;

    @Column(name = "lease_tenure")
    private Integer leaseTenure;

    @Column(name = "unit_type", length = 50)
    private String unitType; // e.g. 1 BHK, 2 BHK, Luxury Villa, Commercial

    @Column(name = "sq_ft")
    private Integer sqFt;

    @Column(name = "bathrooms")
    private Integer bathrooms;

    @Enumerated(EnumType.STRING)
    @Column(name = "furnished_status", length = 30)
    private FurnishedStatus furnishedStatus;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    @Column(name = "rent_due_date")
    private LocalDate rentDueDate;


    @Column(name = "last_vacant_date")
    private LocalDate lastVacantDate;

    @Column(name = "last_filled_date")
    private LocalDate lastFilledDate;

    @Column(name = "occupants_count")
    private Integer occupantsCount;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    @JsonIgnore
    private Property property;

    /**
     * The tenant currently assigned to this unit.
     * Security: Tenant details are only visible to the tenant and the property
     * owner.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id")
    private User tenant;

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Agreement> agreements = new ArrayList<>();

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryRecord> inventoryRecords = new ArrayList<>();

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Bill> bills = new ArrayList<>();

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MaintenanceTicket> maintenanceTickets = new ArrayList<>();

    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("movedOutDate DESC")
    private List<TenantHistory> tenantHistories = new ArrayList<>();

    // ---- Enums ----

    public enum UnitStatus {
        VACANT, OCCUPIED
    }

    public enum RentStatus {
        PAID, PENDING
    }

    public enum FurnishedStatus {
        UNFURNISHED, SEMI_FURNISHED, FULLY_FURNISHED
    }

    public enum AgreementType {
        RENTAL, LEASE
    }
}
