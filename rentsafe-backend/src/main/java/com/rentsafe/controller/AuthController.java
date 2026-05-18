package com.rentsafe.controller;

import com.rentsafe.entity.User;
import com.rentsafe.entity.UserType;
import com.rentsafe.payload.request.LoginRequest;
import com.rentsafe.payload.request.SignupRequest;
import com.rentsafe.payload.response.JwtResponse;
import com.rentsafe.payload.response.MessageResponse;
import com.rentsafe.repository.UserRepository;
import com.rentsafe.security.jwt.JwtUtils;
import com.rentsafe.security.services.CaptchaService;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.security.services.UserDetailsServiceImpl;
import com.rentsafe.security.services.TextCaptchaStore;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    TextCaptchaStore textCaptchaStore;

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    CaptchaService captchaService;

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Value("${rentsafe.recaptcha.enabled:false}")
    private boolean isCaptchaEnabled;

    // ── Captcha Discovery ──────────────────────────────────────────────────────────
    @GetMapping("/captcha")
    public ResponseEntity<?> getCaptcha() {
        logger.info("CAPTCHA Challenge Requested");
        String data = textCaptchaStore.generateCaptcha();
        String[] parts = data.split(":");
        Map<String, String> res = new HashMap<>();
        res.put("id", parts[0]);
        res.put("code", parts[1]);
        return ResponseEntity.ok(res);
    }

    // ── Sign In ──────────────────────────────────────────────────────────────
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        if (isCaptchaEnabled && !captchaService.verifyCaptcha(loginRequest.getCaptchaToken())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Bot detected or invalid captcha!"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return ResponseEntity.ok(buildJwtResponse(jwt, userDetails));
    }

    // ── Sign Up ──────────────────────────────────────────────────────────────
    @Transactional
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest req) {
        logger.info("SIGNUP Process - Target: {}", req.getEmail());
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email already registered in system!"));
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Password Parity Check Failed!"));
        }

        // Text Captcha Verification
        if (!textCaptchaStore.verify(req.getCaptchaId(), req.getCaptchaValue())) {
            logger.warn("CAPTCHA Verification Failed for {}", req.getEmail());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Security verification (CAPTCHA) failed. Try again."));
        }

        String finalOccupation = req.getOccupation();
        if ("Others".equalsIgnoreCase(finalOccupation) && req.getOtherOccupation() != null) {
            finalOccupation = req.getOtherOccupation();
        }

        Integer finalAge = req.getAge();
        if (finalAge == null && req.getDateOfBirth() != null) {
            finalAge = java.time.Period.between(req.getDateOfBirth(), java.time.LocalDate.now()).getYears();
        }

        User user = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .name(req.getFirstName() + " " + (req.getLastName() != null ? req.getLastName() : ""))
                .email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .userType(req.getRole() != null ? req.getRole() : UserType.TENANT)
                .age(finalAge)
                .dateOfBirth(req.getDateOfBirth())
                .mobileNumber(req.getMobileNumber())
                .countryCode(req.getCountryCode())
                .location(req.getLocation())
                .gender(req.getGender())
                .occupation(finalOccupation)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        userRepository.saveAndFlush(user);
        logger.info("New User Profile Generated: {}", user.getEmail());

        // Manual Login Protocol (Bypasses transaction/provider context lag)
        try {
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            return ResponseEntity.ok(buildJwtResponse(jwt, (UserDetailsImpl) userDetails));
        } catch (Exception ex) {
            logger.error("Auto-Onboarding Relay Failed: ", ex);
            return ResponseEntity.ok(new MessageResponse("User profile created. Please sign in to initialize."));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Not authenticated"));
        }
        return ResponseEntity.ok(buildJwtResponse(null, userDetails));
    }

    private JwtResponse buildJwtResponse(String jwt, UserDetailsImpl u) {
        return new JwtResponse(
                jwt,
                u.getId(),
                u.getName(),
                u.getEmail(),
                u.getUserType(),
                u.getFirstName(),
                u.getLastName(),
                u.getMobileNumber(),
                u.getCountryCode(),
                u.getLocation(),
                u.getGender(),
                u.getOccupation(),
                u.getDateOfBirth());
    }
}
