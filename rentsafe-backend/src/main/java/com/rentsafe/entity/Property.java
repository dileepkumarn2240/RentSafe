package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Property entity - represents a building/complex owned by an OWNER.
 * 
 * Maps to frontend: Property { id, name, address, units[], rules[], valuation?,
 * cctvCount? }
 */
@Entity
@Table(name = "properties", indexes = {
        @Index(name = "idx_property_owner", columnList = "owner_id"),
        @Index(name = "idx_property_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property extends BaseEntity {
    
    @Column(name = "registry_id", unique = true, length = 10)
    private String registryId; // Format: 5 letters name + 5 random digits

    @NotBlank(message = "Property name is required")
    @Size(min = 2, max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PropertyType type;

    @NotBlank(message = "Address is required")
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String address;

    @Column(precision = 15, scale = 2)
    private BigDecimal valuation;

    @Column(name = "cctv_count")
    @Builder.Default
    private Integer cctvCount = 0;

    @Column(name = "water_supply_type")
    private String waterSupplyType; // Municipal, Borewell, Tanker

    @Column(name = "water_availability")
    private String waterAvailability; // 24/7, Scheduled

    @Column(name = "maintenance_amount", precision = 12, scale = 2)
    private BigDecimal maintenanceAmount;

    @Column(name = "maintenance_frequency")
    private String maintenanceFrequency; // Monthly, Quarterly

    @Column(name = "parking_type")
    private String parkingType; // Covered, Open, Mechanical

    @Column(name = "parking_slots")
    private Integer parkingSlots;

    @Column(name = "security_guard_status")
    private String securityGuardStatus; // 24/7, Daytime

    @Column(name = "biometric_access")
    private boolean biometricAccess;

    @Column(name = "fire_safety")
    private boolean fireSafety;

    /**
     * Property rules stored as a semicolon-delimited string.
     * Converted to List<String> via helper methods.
     */
    @Column(length = 2000)
    private String rules;

    // ---- Enums ----
    public enum PropertyType {
        APARTMENT, VILLA, INDEPENDENT_HOUSE, STUDIO, COMMERCIAL
    }

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnore
    private User owner;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("name ASC")
    private List<Unit> units = new ArrayList<>();

    // ---- Helper Methods ----

    public List<String> getRulesList() {
        if (rules == null || rules.isBlank())
            return List.of();
        return List.of(rules.split(";"));
    }

    public void setRulesList(List<String> rulesList) {
        this.rules = rulesList == null ? "" : String.join(";", rulesList);
    }
}
