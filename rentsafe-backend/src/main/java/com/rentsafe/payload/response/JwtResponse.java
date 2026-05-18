package com.rentsafe.payload.response;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String id;
    private String name;
    private String email;
    private String userType;
    private String firstName;
    private String lastName;
    private String mobileNumber;
    private String countryCode;
    private String location;
    private String gender;
    private String occupation;
    private LocalDate dateOfBirth;

    public JwtResponse(String accessToken, String id, String name, String email,
            String userType, String firstName, String lastName,
            String mobileNumber, String countryCode, String location,
            String gender, String occupation, LocalDate dateOfBirth) {
        this.token = accessToken;
        this.id = id;
        this.name = name;
        this.email = email;
        this.userType = userType;
        this.firstName = firstName;
        this.lastName = lastName;
        this.mobileNumber = mobileNumber;
        this.countryCode = countryCode;
        this.location = location;
        this.gender = gender;
        this.occupation = occupation;
        this.dateOfBirth = dateOfBirth;
    }
}
