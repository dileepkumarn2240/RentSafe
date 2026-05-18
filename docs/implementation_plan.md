# RentSafe Implementation Plan

This document outlines the roadmap for transitioning RentSafe from a premium UI prototype to a fully functional, data-driven platform.

## Phase 1: Core Lifecycle & Real-time Connectivity
*Goal: Move from hardcoded mock objects to real database-backed state.*

### Backend Tasks:
- [ ] Complete `PropertyService` & `UnitService` implementation (CRUD).
- [ ] Implement `ActivityService` to log system-wide events (Verifications, Payments, Tickets).
- [ ] Refine `BillingService` to handle rent automation and utility tracking.
- [ ] Add `@PreAuthorize` guards for all new endpoints.

### Frontend Tasks:
- [ ] Create `services/apiService.ts` for unified backend communication.
- [ ] Integrate real `Properties` and `Units` fetching into `OwnerDashboard`.
- [ ] Implement `TenantUnit` hydration for the `TenantDashboard`.
- [ ] Replace hardcoded state in `App.tsx` with API-backed hooks.

## Phase 2: Finance & Cash Flow (Smart Accounting)
*Goal: Deliver actionable financial insights to Owners and effortless payments for Tenants.*

### Backend Tasks:
- [ ] Implement yield calculation logic (Total Rent - Expenses - Taxes).
- [ ] Add endpoints for "Revenue Insights" (Projected vs. Actual).
- [ ] Implement payment reference validation (simulated payment gateway).

### Frontend Tasks:
- [ ] Build the **Cash Flow** tab with interactive Sankey charts and ProfitFlow bars.
- [ ] Implement **Bill Payment** flow for tenants with status updates.
- [ ] Implement **Expense Logging** for owners to track maintenance costs.

## Phase 3: Assets & Inventory (Digital Twin)
*Goal: Create a digital record of every item in the property to prevent disputes.*

### Backend Tasks:
- [ ] Implement `InventoryController` for CRUD on Unit inventory items.
- [ ] Add "Audit Log" support to track condition changes (e.g., "Good" -> "Wear Detected").

### Frontend Tasks:
- [ ] Build the **Inventory Vault** (under Assets tab).
- [ ] Implement photo upload simulation for condition verification.
- [ ] Create the "Digital Handover" workflow for new tenants.

## Phase 4: Security & Intelligence (CCTV & AI)
*Goal: Leverage AI and security feeds to provide a "Elite" management experience.*

### Backend Tasks:
- [ ] Implement `SecurityController` to provide mock metadata for CCTV streams.
- [ ] Integrate persistent AI Maintenance Diagnosis (saving Gemini responses to DB).

### Frontend Tasks:
- [ ] Implement the **CCTV Security Widget** with simulated live feeds.
- [ ] Enhance Gemini interaction for **Smart Lease Analysis** (AI reading lease terms).
- [ ] Finalize the premium "Intelligence" dashboard with real-time health metrics.
