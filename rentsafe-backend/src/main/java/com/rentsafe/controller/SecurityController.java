package com.rentsafe.controller;

import com.rentsafe.payload.response.SecurityState;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/security")
public class SecurityController {

    @Autowired
    private SecurityService securityService;

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<SecurityState> getSecurityState(@PathVariable String propertyId) {
        return ResponseEntity.ok(securityService.getPropertySecurity(propertyId));
    }

    @GetMapping("/owner")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<SecurityState> getOwnerSecurity(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(securityService.getOwnerSecurity(userDetails.getId()));
    }
}
