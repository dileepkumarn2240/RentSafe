package com.rentsafe.payload.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SecurityState {
    private String status; // SECURE, ALERT, MAINTENANCE
    private List<CameraFeed> feeds;
    private List<SecurityAlert> recentAlerts;

    @Data
    @Builder
    public static class CameraFeed {
        private String id;
        private String location;
        private boolean isActive;
        /** Populated for owner-wide CCTV wall */
        private String propertyId;
        private String propertyName;
    }

    @Data
    @Builder
    public static class SecurityAlert {
        private String id;
        private String message;
        private String time;
        private String severity; // LOW, MEDIUM, HIGH
    }
}
