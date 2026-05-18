# RentSafe - Quick Start Guide

This guide explains how to verify the framework (Backend) and GUI (Frontend) for the RentSafe application.

## 1. Prerequisites
- **Java 17+**: Ensure Java is installed (`java -version`).
- **Node.js**: Ensure Node.js is installed (`node -v`).

## 2. Running the Backend (Framework)
The backend is a **Spring Boot** application with embedded H2 database (for dev).
I have included a portable **Maven** distribution so you don't need to install anything extra.

**Simply double-click:** `run-backend.bat`

This script will:
1.  Verify the Maven environment.
2.  Clean and build the project (`mvn clean install`).
3.  Start the Spring Boot server on `http://localhost:8080`.

**Verification:**
- Once started, visit the H2 Console: [http://localhost:8080/h2-console](http://localhost:8080/h2-console)
- JDBC URL: `jdbc:h2:mem:rentsafedb`
- User: `sa`, Password: (blank)
- Check Backend Health: [http://localhost:8080/api/health](http://localhost:8080/api/health) (Should reply "RentSafe Backend is Running!")
- **Demo Users**:
  - Owner: `owner@rentsafe.com` / `password123`
  - Tenant: `tenant@rentsafe.com` / `password123`

## 3. Running the Frontend (GUI)
The frontend is a **React + Vite** application.

**Simply double-click:** `run-frontend.bat`

This script will:
1.  Start the development server.
2.  Load the GUI on `http://localhost:3000` (check terminal output).

**Verification:**
- Open browser to [http://localhost:3000](http://localhost:3000).
- You should see the login screen and dashboards.
- Note: Currently the frontend is using mock data. To connect to the real backend, additional integration steps are required (updating API endpoints in `types.ts` or `services/`). But the backend is fully functional and ready to accept connections.

## Troubleshooting
- **Backend Fails to Start**: Check if port 8080 is already in use.
- **Frontend Fails**: Ensure `npm install` was run previously (the script assumes dependencies are installed). If not, run `npm install` manually in the root folder.
