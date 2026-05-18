<div align="center">

&#x20; <img src="./rentsafe\_banner.png" alt="RentSafe Banner" width="100%" style="border-radius: 8px;" />

&#x20; 

&#x20; # 🏢 RentSafe — Smart Rental Management SaaS Platform

&#x20; 



&#x20; \*A premium, executive-grade Smart Rental Management SaaS designed to orchestrate property portfolios, automate billing cycles, track assets, and streamline owner-tenant collaborations.\*

</div>



\---

## 📖 Project Overview

**RentSafe** is an enterprise-grade, full-stack Property and Tenancy Management SaaS. It bridges the gap between property owners and tenants by replacing manual bookkeeping with dynamic data-driven visualizations and precise financial automation.

Featuring a striking glassmorphism user interface with complete dark/light mode synchronization, the platform handles end-to-end rental operations: from digital tenant onboarding and secure KYC verification to granular bill split tracking, scheduled preventative maintenance programs, and automated daily occupancy-based rent rollouts.

\---

## 🛠️ Core Functionalities

### 👑 Owner Dashboard \& Administration

* **Executive Financial Viz**: Interactive, at-a-glance premium KPI cards tracking *Total Expected Rent*, *Successfully Collected Rent*, *Pending Rent*, and *Outstanding Utility Bills*.
* **Dynamic Portfolio Analytics**: Visual occupancy breakdowns, active lease metrics, expense analytics, and past-six-month historical cash-flow trends.
* **Smart Collections Hub**: Centralized accounts receivable ledger providing one-click manual rent/utility reconciliation and automated notification triggers.
* **Preventative Maintenance Console**: Full CRUD program planner to schedule property inspections, recurring utility repairs, and ticket assignments.
* **KYC Security Wall**: Structured approval workflow for tenant identity verification (Aadhaar, PAN, Passport, Voter ID) and lease agreements.
* **Live CCTV Feeds**: Integrated property safety console with active simulated security cameras.

### 🏠 Tenant Sanctuary Portal

* **Granular Billing Ledger**: Individual invoices with custom filtering (Gas, Water, Internet, Electricity, Rent) and simulated online payment gateways.
* **Digital Vault**: Self-service profile to upload identity documents, review signed lease agreements, and request deposit status.
* **Interactive Repair Tickets**: Multi-step issue wizard with urgency levels, photo references, and live ticket tracking.
* **Inventory Auditing**: Dedicated room-by-room inventory ledger detailing pre-configured appliances and furniture.

\---

## ⚙️ Technical Stack \& Skills Demonstrated

### **Frontend Architecture**

* **Framework**: React 19 (Vite)
* **Language**: TypeScript (strict-typing for robust state definitions)
* **Styling**: Premium HSL-curated Vanilla CSS with glassmorphism filters, responsive grids, and micro-animations.
* **State \& Navigation**: React Hooks (`useCallback`, `useMemo`, `useState`), `react-router-dom` for client routing.
* **Analytics**: Custom high-fidelity charting libraries for cash flow trends and occupancy donut distribution.

### **Backend Infrastructure**

* **Framework**: Spring Boot 3.x
* **Language**: Java 17
* **ORM / Database**: JPA / Hibernate with support for **H2 (Dev)** and **PostgreSQL (Prod)** profiles.
* **Security \& Auth**: JWT (JSON Web Tokens) with custom Authorization Filter and password hashing.
* **API Architecture**: 14 modular REST controllers handling secure JSON payloads.
* **Automated Schedulers**: Spring `@Scheduled` daily cron engine triggers to roll over rent cycles based on individual tenant occupancy anniversary dates.

\---

## 📂 Project Structure

```text
rentsafe---smart-rental-management/
├── 📂 rentsafe-backend/            # Spring Boot REST API
│   ├── 📂 src/main/java/com/rentsafe/
│   │   ├── 📂 controller/          # 14 REST API Controllers (Auth, Billing, Maintenance, etc.)
│   │   ├── 📂 entity/              # 17+ JPA Entities (User, Unit, Bill, Agreement, etc.)
│   │   ├── 📂 payload/             # DTO schemas for API request/response bindings
│   │   ├── 📂 repository/          # JpaRepository persistence layer queries
│   │   └── 📂 service/             # Business logic (FinanceService, RentCycleScheduler, etc.)
│   └── 📂 src/main/resources/      # DB profiles, migrations, and application properties
│
├── 📂 components/                  # React UI Components
│   ├── 📂 owner/                   # Specialized widgets (SecurityFeeds, CommandCenter, etc.)
│   ├── OwnerOverview.tsx           # Owner primary analytical console
│   ├── MySanctuaryView.tsx         # Tenant primary operations console
│   ├── SafePapersView.tsx          # Digital KYC \& Document hub
│   ├── MaintenanceView.tsx         # Ticketing \& Preventative Console
│   └── AuthPage.tsx                # Secure JWT login \& signup forms
│
├── 📂 services/                    # Axios API client integrations
├── App.tsx                         # Core React Router and Navigation Sidebar
├── index.css                       # Global modern layout \& design tokens
├── run-frontend.bat                # Automated frontend loader script
└── run-backend.bat                 # Automated backend builder \& compiler script


🚀 Steps to Run the Project Locally
📋 Prerequisites
Ensure you have the following installed on your machine:

Node.js (v18+)
Java Development Kit (JDK 17)
Apache Maven (v3.9+) (embedded in project)

🏃‍♂️ Quick Start (One-Click Runners)
The project includes pre-configured batch scripts that handle dependency checks, compilation, and starting up both servers automatically.

1. Start the Backend API Server
Double-click run-backend.bat at the project root, or execute:

powershell
.\\run-backend.bat
The Spring Boot server will compile and start at http://localhost:8080 using an in-memory H2 database (pre-seeded with mockup owner/tenant profiles).

2. Start the React Frontend Dev Server
Double-click run-frontend.bat at the project root, or execute:

powershell
.\\run-frontend.bat
This installs frontend dependencies and launches the Vite server at http://localhost:3000.




