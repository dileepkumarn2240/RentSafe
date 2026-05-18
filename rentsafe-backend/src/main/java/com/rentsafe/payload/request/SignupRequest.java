package com.rentsafe.payload.request;

import com.rentsafe.entity.UserType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 1, max = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Size(max = 150)
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z]).{8,}$", message = "Password must be case-sensitive and contain both letters and numbers")
    private String password;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    @NotNull(message = "User type is required (OWNER or TENANT)")
    private UserType role; // Mapping to userType internally

    @Min(value = 18, message = "Must be at least 18 years old")
    private Integer age;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be a 10-digit number")
    private String mobileNumber;

    private String countryCode;
    private String location;
    private String gender;
    private String occupation;
    private String otherOccupation; // For when "Others" is chosen

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Captcha ID is required")
    private String captchaId;

    @NotBlank(message = "Captcha verification is required")
    private String captchaValue;
}
