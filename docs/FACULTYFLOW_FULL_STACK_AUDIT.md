# FacultyFlow — Full-Stack Engineering Contract & System Audit

## 1. Executive System Topology

FacultyFlow is an enterprise-grade offline-first institutional attendance verification platform designed for higher education faculty.

- **Web Frontend**: React 18 + Vite SPA deployed on Vercel (`https://faculty-flow-nine.vercel.app`).
- **Backend API**: Node.js v20+ / Express 5.x deployed on Render (`https://facultyflow-1kgs.onrender.com/api`).
- **Persistence Layer**: MongoDB Atlas replica set cluster running Mongoose ODM.
- **Mobile Client**: React Native + Expo Router SDK 52 with SQLite local queue persistence (`frontend/facultyflow-mobile/`).
- **Authentication**: Stateless HMAC-SHA256 JWT bearer tokens with institutional role-based access control (RBAC).

---

## 2. Full-Stack Endpoint Contract Inventory

| Endpoint | Method | Role / Auth | Request Schema | Success Response | Error Codes | Callers | Service / Persistence | Production Verified |
|---|---|---|---|---|---|---|---|---|
| `/api/auth/login` | POST | Public | `{ email, password }` | `{ success, accessToken, user }` | `400`, `401`, `403` | Web Login, Mobile Login | `User.findOne`, `passwordService` | YES (200 OK) |
| `/api/auth/me` | GET | Authenticated | None | `{ success, user }` | `401`, `404` | Web Session, Mobile Guard | `User.findOne` | YES (200 OK) |
| `/api/auth/verify` | GET | Authenticated | None | `{ success, valid, user }` | `401` | Mobile Health Check | `tokenService.verifyAccessToken` | YES (200 OK) |
| `/api/faculty` | GET | Admin | None | `{ success, count, faculty: [] }` | `401`, `403` | Admin Faculty Management | `Faculty.find` | YES (200 OK) |
| `/api/faculty/:facultyId` | GET | Admin / Self | `facultyId` (or "me") | `{ success, faculty }` | `401`, `403`, `404` | Web Profile, Admin View | `Faculty.findOne` + `User` sync | YES (200 OK) |
| `/api/faculty/me` | GET | Faculty | None | `{ success, faculty }` | `401`, `404` | Faculty Profile Page | `getFacultyById` | YES (200 OK) |
| `/api/faculty/profile` | GET | Faculty | None | `{ success, faculty }` | `401`, `404` | Faculty Dashboard | `getFacultyById` | YES (200 OK) |
| `/api/faculty` | POST | Admin | `{ facultyId, userId, employeeCode, name, department, designation, status }` | `{ success, faculty }` | `400`, `401`, `403` | Admin Add Faculty | `Faculty.create` | YES (201 Created) |
| `/api/attendance/today` | GET | Faculty | None | `{ success, attendance, verification }` | `401`, `404` | Faculty Dashboard, Mobile Home | `AttendanceRecord.findOne` | YES (200 OK) |
| `/api/attendance/check-in` | POST | Faculty | `{ location: { latitude, longitude, accuracyMeters }, device, network }` | `{ success, attendance, verification }` | `400`, `403`, `409` | Web Check-In, Mobile Online | `attendanceService.createCheckIn` | YES (Verified) |
| `/api/attendance/check-out` | POST | Faculty | `{ location: { latitude, longitude, accuracyMeters }, device, network }` | `{ success, attendance, verification }` | `400`, `403`, `409` | Web Check-Out, Mobile Online | `attendanceService.createCheckOut` | YES (Verified) |
| `/api/attendance/history` | GET | Faculty | None | `{ success, records: [] }` | `401` | Web History, Mobile History | `AttendanceRecord.find` | YES (200 OK) |
| `/api/attendance/policy` | GET | Faculty | None | `{ success, policy }` | `401` | Mobile Dynamic Policy | `AttendancePolicy.findOne` | YES (200 OK) |
| `/api/attendance/locations` | GET | Faculty | None | `{ success, locations: [] }` | `401` | Mobile Dynamic Geofences | `CampusLocation.find({ active: true })` | YES (200 OK) |
| `/api/attendance/networks` | GET | Faculty | None | `{ success, networks: [] }` | `401` | Mobile Dynamic Networks | `NetworkLocation.find({ active: true })` | YES (200 OK) |
| `/api/admin/policy` | GET | Admin | None | `{ success, count, policies: [] }` | `401`, `403` | Admin Policy Page | `AttendancePolicy.find` | YES (200 OK) |
| `/api/admin/policy/active` | GET | Admin | None | `{ success, policy }` | `401`, `403` | Admin Policy Form | `AttendancePolicy.findOne({ active: true })` | YES (200 OK) |
| `/api/admin/policy/:policyId` | PUT | Admin | `{ startTime, endTime, gracePeriod, lateThreshold, earlyExitThreshold, requiredSignals, active }` | `{ success, policy }` | `400`, `401`, `403`, `404` | Admin Policy Save | `AttendancePolicy.findOneAndUpdate` | YES (200 OK) |
| `/api/admin/locations` | GET | Admin | None | `{ success, count, locations: [] }` | `401`, `403` | Admin Locations Table | `CampusLocation.find` | YES (200 OK) |
| `/api/admin/locations` | POST | Admin | `{ name, latitude, longitude, radiusMeters, active }` | `{ success, location }` | `400`, `401`, `403` | Admin Add Campus Form | `CampusLocation.create` | YES (201 Created) |
| `/api/admin/locations/:id` | PUT | Admin | `{ name, latitude, longitude, radiusMeters, active }` | `{ success, location }` | `400`, `401`, `403`, `404` | Admin Edit Campus Form | `CampusLocation.findOneAndUpdate` | YES (200 OK) |
| `/api/admin/locations/:id` | DELETE | Admin | None | `{ success, location }` | `401`, `403`, `404` | Admin Delete Campus | `CampusLocation.findOneAndDelete` | YES (200 OK) |
| `/api/admin/networks` | GET | Admin | None | `{ success, count, networks: [] }` | `401`, `403` | Admin Network Page | `NetworkLocation.find` | YES (200 OK) |
| `/api/admin/networks` | POST | Admin | `{ name, ssid, bssid, gatewayIp, subnetMask, ipRangeStart, ipRangeEnd, active }` | `{ success, network }` | `400`, `401`, `403` | Admin Add Network Form | `NetworkLocation.create` | YES (201 Created) |
| `/api/sync/events` | POST | Faculty | `{ events: [SyncEvent] }` | `{ success, processedCount, results: [] }` | `400`, `401` | Mobile Sync Engine | `syncService.processSyncEvents` | YES (200 OK) |

---

## 3. Data Integrity & Identity Mapping Findings

1. **User Identity vs Faculty Identity Mapping:**
   - Authentication validates credentials against the `users` collection.
   - The faculty member's institutional record is stored in the `faculties` collection.
   - Root cause identified: When `User` documents existed without corresponding `Faculty` records, attendance queries failed with `FACULTY_NOT_FOUND`.
   - Resolution: Implemented authoritative synchronization in `getFacultyById`: if an authenticated user with `role: 'faculty'` exists, their `Faculty` record is automatically linked and synchronized.

2. **Multi-Campus Geofence Evaluation:**
   - Previous logic threw `500 MULTIPLE_ACTIVE_CAMPUS_LOCATIONS` if more than one location was active.
   - Resolution: Refactored `verifyCampusLocation` to check coordinates against all active campus locations in MongoDB, marking verification successful if the user is inside ANY active campus perimeter.
