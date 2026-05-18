package com.rentsafe.payload.request;

import lombok.Data;

@Data
public class ResolveTicketRequest {
    private String resolution;
    /** Optional; defaults to GENERAL when absent */
    private String issueCategory;
}
