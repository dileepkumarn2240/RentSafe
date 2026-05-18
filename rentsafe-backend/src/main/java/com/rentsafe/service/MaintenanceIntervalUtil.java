package com.rentsafe.service;

import com.rentsafe.entity.MaintenanceIssueCategory;

import java.time.LocalDate;

/**
 * Default preventive intervals (planning aid; tune per market later).
 */
public final class MaintenanceIntervalUtil {

    private MaintenanceIntervalUtil() {
    }

    public static LocalDate computeNextDue(MaintenanceIssueCategory category, LocalDate serviceDate) {
        if (serviceDate == null) {
            return null;
        }
        return switch (category != null ? category : MaintenanceIssueCategory.GENERAL) {
            case PAINTING -> serviceDate.plusYears(5);
            case HVAC -> serviceDate.plusYears(1);
            case ELECTRICAL -> serviceDate.plusYears(2);
            case PLUMBING -> serviceDate.plusYears(2);
            case GENERAL -> serviceDate.plusYears(1);
        };
    }
}
