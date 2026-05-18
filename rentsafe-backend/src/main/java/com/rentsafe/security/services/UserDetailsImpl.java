package com.rentsafe.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rentsafe.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private final String id;
    private final String name;
    private final String email;
    private final String firstName;
    private final String lastName;
    private final String mobileNumber;
    private final String countryCode;
    private final String location;
    private final String gender;
    private final String occupation;
    private final LocalDate dateOfBirth;
    private final String userType;

    @JsonIgnore
    private final String password;

    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(String id, String name, String email, String password,
            Collection<? extends GrantedAuthority> authorities,
            String firstName, String lastName, String mobileNumber,
            String countryCode, String location, String gender,
            String occupation, LocalDate dateOfBirth, String userType) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.authorities = authorities;
        this.firstName = firstName;
        this.lastName = lastName;
        this.mobileNumber = mobileNumber;
        this.countryCode = countryCode;
        this.location = location;
        this.gender = gender;
        this.occupation = occupation;
        this.dateOfBirth = dateOfBirth;
        this.userType = userType;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(user.getUserType().name()));

        return new UserDetailsImpl(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPassword(),
                authorities,
                user.getFirstName(),
                user.getLastName(),
                user.getMobileNumber(),
                user.getCountryCode(),
                user.getLocation(),
                user.getGender(),
                user.getOccupation(),
                user.getDateOfBirth(),
                user.getUserType().name());
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public String getLocation() {
        return location;
    }

    public String getGender() {
        return gender;
    }

    public String getOccupation() {
        return occupation;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public String getUserType() {
        return userType;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }
}
