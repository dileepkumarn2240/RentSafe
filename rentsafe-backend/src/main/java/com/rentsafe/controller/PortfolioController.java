package com.rentsafe.controller;

import com.rentsafe.payload.response.PortfolioSummary;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('OWNER')")
    public ResponseEntity<PortfolioSummary> getSummary(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestParam(name = "renewalWindowDays", defaultValue = "30") int renewalWindowDays) {
        return ResponseEntity.ok(portfolioService.getOwnerPortfolioSummary(userDetails.getId(), renewalWindowDays));
    }
}

