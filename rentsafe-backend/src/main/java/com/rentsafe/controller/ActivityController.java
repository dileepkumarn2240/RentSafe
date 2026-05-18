package com.rentsafe.controller;

import com.rentsafe.entity.Activity;
import com.rentsafe.security.services.UserDetailsImpl;
import com.rentsafe.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @GetMapping("/me")
    public ResponseEntity<List<Activity>> getMyActivities(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(activityService.getActivitiesByUser(userDetails.getId()));
    }
}
