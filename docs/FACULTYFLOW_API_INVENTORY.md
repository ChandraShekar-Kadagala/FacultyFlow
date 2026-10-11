# FacultyFlow API Inventory

This document catalogs the existing API routes, their methods, and expected payloads based on the current backend implementation.

## Base URL
`/api`

## Health
*   **GET /api/health**
    *   Description: System health check.
    *   Auth Required: No

## Authentication
*   **POST /api/auth/login**
    *   Payload: `{ email, password }`
    *   Auth Required: No
*   **GET /api/auth/me**
    *   Description: Get current authenticated user profile.
    *   Auth Required: Yes
*   **GET /api/auth/verify**
    *   Description: Verify token validity.
    *   Auth Required: Yes

## Faculty Management
*   **GET /api/faculty**
    *   Description: List faculty members.
    *   Auth Required: Yes (Admin)
*   **GET /api/faculty/:id**
    *   Description: Get specific faculty member details.
    *   Auth Required: Yes
*   **POST /api/faculty**
    *   Description: Create a new faculty member.
    *   Auth Required: Yes (Admin)
*   **PATCH /api/faculty/:id**
    *   Description: Update faculty details.
    *   Auth Required: Yes (Admin)
*   **PATCH /api/faculty/:id/status**
    *   Description: Update faculty active status.
    *   Auth Required: Yes (Admin)

## Attendance (Faculty)
*   **GET /api/attendance/today**
    *   Description: Get today's attendance record and verification context for the authenticated faculty.
    *   Auth Required: Yes (Faculty)
*   **POST /api/attendance/check-in**
    *   Payload: `{ device, network, location }` (Signal data for verification)
    *   Auth Required: Yes (Faculty)
*   **POST /api/attendance/check-out**
    *   Payload: `{ device, network, location }`
    *   Auth Required: Yes (Faculty)
*   **GET /api/attendance/history**
    *   Description: Get historical attendance records for the authenticated faculty.
    *   Auth Required: Yes (Faculty)

## Attendance (Admin)
*   **GET /api/admin/attendance**
    *   Description: List all attendance records with filtering (facultyId, date, startDate, endDate, status, verificationStatus, search).
    *   Auth Required: Yes (Admin)
*   **GET /api/admin/attendance/:attendanceId**
    *   Description: Get a specific attendance record.
    *   Auth Required: Yes (Admin)
*   **GET /api/admin/attendance/faculty/:facultyId**
    *   Description: Get attendance history for a specific faculty member.
    *   Auth Required: Yes (Admin)
*   **GET /api/admin/attendance/date/:date**
    *   Description: Get all attendance records for a specific date.
    *   Auth Required: Yes (Admin)

## Admin Dashboard
*   **GET /api/admin/dashboard/summary**
    *   Description: Get KPIs for the admin dashboard (total faculty, present, late, verification rates).
    *   Auth Required: Yes (Admin)

## Policy Management
*   **GET /api/admin/policy**
    *   Description: List all attendance policies.
    *   Auth Required: Yes (Admin)
*   **GET /api/admin/policy/active**
    *   Description: Get the currently active policy.
    *   Auth Required: Yes (Admin)
*   **POST /api/admin/policy**
    *   Description: Create a new policy.
    *   Auth Required: Yes (Admin)
*   **PUT /api/admin/policy/:id**
    *   Description: Update a policy.
    *   Auth Required: Yes (Admin)
*   **PATCH /api/admin/policy/:id/activate**
    *   Description: Set a policy as active.
    *   Auth Required: Yes (Admin)

## Location Management
*   **GET /api/admin/locations**
    *   Description: List location geofences.
    *   Auth Required: Yes (Admin)
*   **POST /api/admin/locations**
    *   Description: Create a location geofence.
    *   Auth Required: Yes (Admin)
*   **PUT /api/admin/locations/:id**
    *   Description: Update a location geofence.
    *   Auth Required: Yes (Admin)
*   **PATCH /api/admin/locations/:id/status**
    *   Description: Toggle location geofence status.
    *   Auth Required: Yes (Admin)

## Offline Sync
*   **POST /api/sync/events**
    *   Payload: `{ events: [ { syncEventId, type, payload, timestamp, ... } ] }`
    *   Auth Required: Yes
    *   Description: Idempotent batch synchronization for mobile clients operating offline.

## Development / Test
*   **POST /api/dev/verification/simulate**
    *   Description: Simulate a verification engine run for debugging.
    *   Auth Required: Yes (Admin)
