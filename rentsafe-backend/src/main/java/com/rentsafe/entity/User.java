package com.rentsafe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * User entity - represents both Owners and Tenants.
 * 
 * Security: Passwords are BCrypt hashed. Sensitive fields like
 * phone/email are only visible to the user themselves or their owner.
 * 
 * Maps to frontend: UserSession (userId, role, name)
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email", unique = true),
        @Index(name = "idx_user_mobile", columnList = "mobile_number"),
        @Index(name = "idx_user_type", columnList = "user_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class User extends BaseEntity {

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 50)
    @Column(nullable = false, length = 50)
    private String firstName;

    @Size(max = 50)
    @Column(length = 50)
    private String lastName;

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100)
    @Column(nullable = false, length = 100)
    private String name; // This can store fullName

    @Transient
    public String getFullName() {
        return firstName + " " + lastName;
    }

    private Integer age;

    @Column(name = "dob")
    private java.time.LocalDate dateOfBirth;

    @Column(length = 20)
    private String gender; // MALE, FEMALE, OTHER

    @Column(length = 100)
    private String occupation;

    @Column(length = 5)
    private String countryCode;

    @Column(length = 100)
    private String location; // City/Area

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @NotBlank(message = "Password is required")
    @Column(nullable = false)
    private String password; // BCrypt hashed

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be a 10-digit number")
    @Column(name = "mobile_number", length = 15)
    private String mobileNumber;

    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Pattern(regexp = "^$|^\\d{10}$", message = "Emergency contact must be a 10-digit number")
    @Column(name = "emergency_contact_number", length = 15)
    private String emergencyContactNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false, length = 10)
    private UserType userType;

    @Column(length = 500)
    private String avatarUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean accountNonLocked = true;

    // ---- Relationships ----

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<Property> properties = new ArrayList<>();

    @OneToOne(mappedBy = "tenant")
    @JsonIgnore
    private Unit assignedUnit;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<IdentityProof> identityProofs = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<TenantDocument> documents = new ArrayList<>();
}
