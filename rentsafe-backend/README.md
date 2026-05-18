# RentSafe Backend

Professional Spring Boot Backend for RentSafe - Smart Rental Management.

## Technology Stack
- **Framework**: Spring Boot 3.3
- **Language**: Java 17
- **Database**: 
  - **Dev**: H2 In-Memory (Auto-configured)
  - **Prod**: PostgreSQL (Configured via `application-prod.properties`)
- **Security**: Spring Security + JWT (Stateless)
- **Build Tool**: Maven

## features
- **Role-Based Access Control**: Separate endpoints for Owners (Landlords) and Tenants.
- **Microservice-Ready Architecture**: Service layer separation allows easy scaling.
- **Secure Authentication**: BCrypt password hashing and JWT token validation.
- **Comprehensive API**:
  - `/api/auth`: Sign up/Sign in
  - `/api/properties`: Property & Unit management
  - `/api/units`: Unit fetching and tenant assignment
  - `/api/bills`: Billing and payments
  - `/api/maintenance`: Ticket tracking
  - `/api/notifications`: Alert system

## Running the Application

### Prerequisites
- Java 17+ installed

### Development Mode (H2 Database)
1. Open the project in your IDE.
2. Run `RentsafeBackendApplication.java`.
3. API will be available at `http://localhost:8080`.
4. H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:rentsafedb`)

### Production Mode (PostgreSQL)
1. Install PostgreSQL.
2. Create database `rentsafe`.
3. Set environment variables `DB_USERNAME` and `DB_PASSWORD`.
4. Run with profile: `java -jar -Dspring.profiles.active=prod target/rentsafe-backend-1.0.0-SNAPSHOT.jar`

## API Endpoints (Quick Reference)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/signin` | Login & get JWT | Public |
| GET | `/api/properties` | List my properties | OWNER |
| POST | `/api/properties` | Add property | OWNER |
| GET | `/api/units/me` | Get my unit details | TENANT |
| POST | `/api/maintenance/me` | Raise ticket | TENANT |
