package com.rentsafe.service;

import com.rentsafe.entity.Property;
import com.rentsafe.payload.response.SecurityState;
import com.rentsafe.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Surveillance metadata only — no fabricated streams are persisted. Tiles reflect configured camera counts per property.
 */
@Service
public class SecurityService {

    @Autowired
    private PropertyRepository propertyRepository;

    public SecurityState getPropertySecurity(String propertyId) {
        Property p = propertyRepository.findById(propertyId).orElse(null);
        int slots = p != null && p.getCctvCount() != null ? Math.max(0, p.getCctvCount()) : 0;
        return buildStateForProperty(p != null ? p.getName() : "Property", propertyId, slots);
    }

    public SecurityState getOwnerSecurity(String ownerId) {
        List<Property> properties = propertyRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        List<SecurityState.CameraFeed> allFeeds = new ArrayList<>();
        List<SecurityState.SecurityAlert> allAlerts = new ArrayList<>();
        int alertCounter = 0;

        for (Property p : properties) {
            int slots = p.getCctvCount() != null ? Math.max(0, p.getCctvCount()) : 0;
            if (slots <= 0) {
                continue;
            }
            SecurityState per = buildStateForProperty(p.getName(), p.getId(), slots);
            for (SecurityState.CameraFeed f : per.getFeeds()) {
                allFeeds.add(f);
            }
            for (SecurityState.SecurityAlert a : per.getRecentAlerts()) {
                allAlerts.add(SecurityState.SecurityAlert.builder()
                        .id("alt-" + p.getId() + "-" + (++alertCounter))
                        .message("[" + p.getName() + "] " + a.getMessage())
                        .time(a.getTime())
                        .severity(a.getSeverity())
                        .build());
            }
        }

        if (allFeeds.isEmpty()) {
            return SecurityState.builder()
                    .status("NO_CAMERAS_CONFIGURED")
                    .feeds(List.of())
                    .recentAlerts(List.of())
                    .build();
        }

        return SecurityState.builder()
                .status("SECURE")
                .feeds(allFeeds)
                .recentAlerts(allAlerts.stream().limit(8).toList())
                .build();
    }

    private SecurityState buildStateForProperty(String propertyName, String propertyId, int cameraSlots) {
        List<SecurityState.CameraFeed> feeds = new ArrayList<>();
        for (int i = 1; i <= cameraSlots; i++) {
            feeds.add(SecurityState.CameraFeed.builder()
                    .id("cam-" + propertyId + "-" + i)
                    .location("Channel " + i)
                    .isActive(true)
                    .propertyId(propertyId)
                    .propertyName(propertyName)
                    .build());
        }
        return SecurityState.builder()
                .status(cameraSlots > 0 ? "SECURE" : "NO_CAMERAS_CONFIGURED")
                .feeds(feeds)
                .recentAlerts(List.of(
                        SecurityState.SecurityAlert.builder()
                                .id("alt-" + propertyId)
                                .message("No live telemetry until streams are integrated.")
                                .time("—")
                                .severity("LOW")
                                .build()
                ))
                .build();
    }
}
