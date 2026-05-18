package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

/**
 * InventoryRecord entity - tracks items within a unit for condition reporting.
 * 
 * Maps to frontend: InventoryRecord { id, itemName, quantity, condition,
 * lastAudit? }
 */
@Entity
@Table(name = "inventory_records", indexes = {
        @Index(name = "idx_inventory_unit", columnList = "unit_id"),
        @Index(name = "idx_inventory_condition", columnList = "condition")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryRecord extends BaseEntity {

    @NotBlank(message = "Item name is required")
    @Size(max = 200)
    @Column(name = "item_name", nullable = false, length = 200)
    private String itemName;

    @Min(value = 0, message = "Quantity cannot be negative")
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ItemCondition condition = ItemCondition.NEW;

    @Column(name = "last_audit")
    private LocalDate lastAudit;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnore
    private Unit unit;

    // ---- Enums ----

    public enum ItemCondition {
        MINT, GOOD, NEW, WEAR_DETECTED, CRITICAL, WORN
    }
}
