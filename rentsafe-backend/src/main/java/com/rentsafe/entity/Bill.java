package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Bill entity - utility bills for a unit (electricity, water, internet, gas,
 * maintenance).
 * 
 * Maps to frontend: Bill { id, type, amount, dueDate, status, billingPeriod }
 */
@Entity
@Table(name = "bills", indexes = {
        @Index(name = "idx_bill_unit", columnList = "unit_id"),
        @Index(name = "idx_bill_status", columnList = "status"),
        @Index(name = "idx_bill_due_date", columnList = "due_date"),
        @Index(name = "idx_bill_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillType type;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @NotNull(message = "Due date is required")
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private BillStatus status = BillStatus.PENDING;

    @NotBlank(message = "Billing period is required")
    @Column(name = "billing_period", nullable = false, length = 50)
    private String billingPeriod;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference;

    // ---- Relationships ----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnore
    private Unit unit;

    // ---- Enums ----

    public enum BillType {
        ELECTRICITY, WATER, INTERNET, GAS, MAINTENANCE, RENT
    }

    public enum BillStatus {
        PAID, PENDING, OVERDUE
    }
}
