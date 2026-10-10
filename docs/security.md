# Security & Audit

FacultyFlow emphasizes security by treating the backend as the singular source of truth.

## Authentication and Authorization

- **JWT (JSON Web Tokens)**: All API endpoints (except login) require a valid JWT passed in the `Authorization` header (`Bearer <token>`).
- **Role-Based Access Control (RBAC)**: Specific routes are protected by role (`admin` vs `faculty`). The backend explicitly reads the role securely from the decoded JWT payload—**never** from client-supplied request bodies.
- **Inactive Users**: The system rigorously checks user status against the database on critical actions. Deactivating a user immediately prevents them from checking in or logging into new sessions.

## Authoritative Timestamps and Signals

- The backend strictly enforces its own `serverTime` for all check-in and check-out logs. Client-provided timestamps are stored solely as metadata.
- Attendance outcomes are calculated based on active server-side policies, not client assertions.

## Audit Logging

An immutable audit trail is generated for:
1. **Attendance Actions**: `ATTENDANCE_ATTEMPT`, `ATTENDANCE_SUCCESS`, `ATTENDANCE_FAILED`.
2. **Policy Configuration**: `POLICY_CREATED`, `POLICY_UPDATED`.
3. **Synchronization**: `SYNC_EVENT_ATTEMPT`, `SYNC_EVENT_SUCCESS`, `SYNC_EVENT_FAILED`.

Logs are stored securely in the `AuditLog` collection, tracking the exact `action`, `targetType`, `performedBy`, `ipAddress`, and `metadata` for forensic analysis. Passwords, biometric vectors, and raw tokens are explicitly excluded from these logs.

## Secret Management
- Database URI and JWT secrets are injected strictly via Environment Variables. No keys are hardcoded in the repository.
