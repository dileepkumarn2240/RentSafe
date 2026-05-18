package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "tenant_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    @JsonIgnore
    private Unit unit;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "tenant_email")
    private String tenantEmail;

    @Column(name = "tenant_phone")
    private String tenantPhone;

    @Column(name = "lease_start_date")
    private LocalDate leaseStartDate;

    @Column(name = "lease_end_date")
    private LocalDate leaseEndDate;

    @Column(name = "moved_out_date")
    private LocalDate movedOutDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal rent;

    @Column(precision = 12, scale = 2)
    private BigDecimal deposit;

    @Enumerated(EnumType.STRING)
    @Column(name = "agreement_type", length = 15)
    private Unit.AgreementType agreementType;

    @Column(name = "lease_amount", precision = 12, scale = 2)
    private BigDecimal leaseAmount;

    @Column(name = "lease_tenure")
    private Integer leaseTenure;
}
