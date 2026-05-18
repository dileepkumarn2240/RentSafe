package com.rentsafe.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TenantOnboardRequest {
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    @NotBlank
    @Email
    private String email;

    private String phone;
    private String location;
    private String occupation;
    private Integer occupantsCount;
    private String emergencyContactName;
    private String emergencyContactNumber;

    // Lease details
    private BigDecimal rentAmount;
    private BigDecimal depositAmount;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private LocalDate rentDueDate;
}
