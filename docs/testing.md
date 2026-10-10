# Testing and Verification

FacultyFlow includes several automated testing scripts and manual checks to ensure systemic reliability.

## Automated Backend Integration Tests

The backend ships with custom integration tests testing real application logic against your configured MongoDB instance. These tests connect to the active database.

### Authentication Tests
Verifies login validity, strict user schema status assertions, JWT validity, and role constraints.
```bash
cd backend
node testAuthIntegration.js
```
*Expected Output*: Validation of successful login, rejection of inactive users, and 401s for invalid tokens.

### Attendance Rules Tests
Validates signal enforcement, Check-In/Check-Out flows, and duplicate protections.
```bash
cd backend
node testAttendanceIntegration.js
```
*Expected Output*: Creation of records using authoritative server timestamps, and rejection of duplicate check-ins or unverified attendance blocks.

### Offline Sync Integration Tests
Validates the system's resilience to interrupted connections, verifying idempotency and recovery logic.
```bash
cd backend
node testSyncIntegration.js
```
*Expected Output*: Initial sync records successfully, exact duplicate sync retries return `SYNC_EVENT_DUPLICATE` without duplicating the underlying records.

## Frontend Quality Checks

**Web Build**
Ensure the React Web Dashboard compiles successfully.
```bash
cd frontend/facultyflow-web
npm run build
```
*Expected Result*: Successful compilation of static assets into the `/dist` directory.

**Mobile Linting**
Ensure the React Native project passes quality rules.
```bash
cd frontend/facultyflow-mobile
npm run lint
```
*Known Limitations*: You may see warnings regarding `react-hooks/exhaustive-deps` or `react-hooks/set-state-in-effect` during hydration steps. These are strict rule interpretations by Expo and are safe to bypass in their specific contexts.

## Known Limitations

- **MongoDB Flakiness (Error 80)**: Due to Atlas free-tier cluster network drops, connections might occasionally throw `MongoNetworkError` (SSL alert 80). If this occurs during testing, simply retry the command.
- **Client Emulation**: Mobile signals (Biometrics, Location) are currently simulated locally by the app prior to calling the backend. In production, this requires binding to actual native device modules.
