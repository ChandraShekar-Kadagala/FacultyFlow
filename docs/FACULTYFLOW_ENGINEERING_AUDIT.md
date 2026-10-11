# FACULTYFLOW ENGINEERING AUDIT

## 1. Verified Architecture and Technology Stack
*   **Backend**: Node.js, Express, MongoDB Atlas, Mongoose.
*   **Frontend**: React (Vite-based web dashboard).
*   **Authentication**: JWT (JSON Web Tokens), stored client-side. Role-based access control (`admin`, `faculty`).

## 2. Application Entry Points and Route Inventory
*   **Web**: `frontend/src/App.jsx` handles routing.
*   **Public Routes**: `/login`
*   **Protected Faculty Routes**: `/faculty`, `/faculty/:facultyId`, `/attendance`, `/profile`
*   **Protected Admin Routes**: `/admin`, `/admin/faculty`, `/admin/attendance`, `/admin/audit`, `/admin/policy`, `/admin/location`, `/admin/network`, `/admin/reports`
*   **Error Routes**: `/unauthorized`, `*` (Not Found)

## 3. Faculty and Admin Access Flows
*   **Authentication**: Handled via `/api/auth/login`. Returns JWT and user object.
*   **Role Mapping**: Decoded JWT dictates route accessibility via `RoleBasedRoute` wrappers.
*   **Bug identified**: Faculty trying to access their own `/profile` failed because it expected a `facultyId` URL parameter, rather than extracting it from their active session.

## 4. API Endpoint Inventory
*   **Auth**: `/api/auth/login`
*   **Faculty**: `/api/faculty`, `/api/faculty/:id`
*   **Attendance**: `/api/attendance/check-in`, `/api/attendance/check-out`, `/api/attendance/history`
*   **Verification**: `/api/verification/...` (Signal evaluation logic)
*   **Admin/Policy**: `/api/policy/...`
*   **Sync**: `/api/sync` (Offline event orchestrator)

## 5. Database Entities and Relationships
*   **User/Faculty**: Contains identity and role (`admin` or `faculty`).
*   **AttendanceRecord**: Contains `userId`, `checkInTime`, `checkOutTime`, `status`, `syncEventId`.
*   **SyncEvent**: Used for idempotency lock during offline sync recoveries.
*   **AuditLog**: Immutable action tracker for administrative and attendance events.

## 6. Current Deployment Topology
*   **Frontend**: Deployed via Vercel (static React build).
*   **Backend**: Hosted separately, communicating via CORS.
*   **Database**: MongoDB Atlas Cluster.

## 7. Confirmed Defects and Root Causes
*   **Defect 1**: "Unable to load faculty profile".
    *   *Root Cause*: `Profile.jsx` exclusively relied on `useParams().facultyId`. When accessing `/profile`, the param is undefined, causing the request to fail early and display the "Faculty ID or authentication session is missing." message.
*   **Defect 2**: Fake/Optimistic UI updates during Check-in/Check-out.
    *   *Root Cause*: Need to verify if the frontend skips server validation or fakes timestamps.
*   **Defect 3**: Verification Engine reporting Unavailable.
    *   *Root Cause*: Need to verify how the frontend attempts to gather network/location signals.

## 8. Unverified Assumptions and Access Limitations
*   Without production access, I must rely on the provided Vercel URL observations and local code evaluation.
*   It's assumed that the production database has correctly configured indexes matching the Mongoose schemas.

## 9. Security and Data-Integrity Risks
*   **Client-side Identity Trust**: Ensure no API uses a client-provided `userId` for sensitive operations rather than extracting it from the verified JWT.
*   **Idempotency / Duplication**: Frequent network drops could cause duplicate check-ins if the server doesn't use `SyncEvent` ID locking. (Previously patched in the backend, but must ensure frontend respects this).

## 10. Prioritized Repair Plan
1.  **Phase B**: Repair `Profile.jsx` authentication session extraction (Completed).
2.  **Phase C**: Audit Faculty Dashboard. Ensure data is server-driven. Remove hardcoded demo placeholders.
3.  **Phase D**: Repair Check-in/Check-out logic on the frontend to strictly use the API contract without spoofing timestamps.
4.  **Phase E**: Repair Verification UI to accurately reflect server capabilities (handling unavailable browser APIs gracefully).
5.  **Phase F**: Verify Admin Dashboard accessibility and implement missing features.
6.  **Phase G**: Optimize backend endpoints if rendering delays are observed.
7.  **Phases H-M**: E2E testing, security audits, and deployment preparation.
