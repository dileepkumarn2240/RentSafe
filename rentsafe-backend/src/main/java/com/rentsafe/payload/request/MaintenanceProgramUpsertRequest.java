package com.rentsafe.payload.request;

import lombok.Data;

@Data
public class MaintenanceProgramUpsertRequest {
    /** UNIT or PROPERTY */
    private String scope;
    private String propertyId;
    /** Required when scope is UNIT */
    private String unitId;
    private String category;
    /** ISO-8601 date yyyy-MM-dd */
    private String lastServiceAt;
    /** Optional; if blank, computed from category interval */
    private String nextDueAt;
    private String notes;
}
