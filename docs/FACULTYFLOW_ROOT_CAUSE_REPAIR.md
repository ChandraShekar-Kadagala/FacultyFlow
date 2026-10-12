# FacultyFlow — Root Cause Analysis & Engineering Repairs Log

## 1. Issue A — Faculty Profile Not Found & Check-in Lockout

### Symptoms
- Faculty dashboard displayed: `Action Error: Faculty profile was not found on the server.`
- Faculty profile page displayed: `Unable to load faculty profile — Faculty not found.`
- Check-in action button disappeared completely from the Record Attendance card.

### Root Cause
1. In the production database, the demo faculty user (`faculty@facultyflow.com`) existed in the `User` collection with `role: "faculty"` and `userId: "F101"`, but NO corresponding record existed in the `Faculty` collection.
2. `attendanceController.js` executed `Faculty.findOne({ facultyId })`. When null was returned, it threw an HTTP 404 error with code `FACULTY_NOT_FOUND`.
3. `FacultyDashboard.jsx` evaluated `canCheckIn = Boolean(accessToken) && !attendanceLoading && !actionLoading && !attendance && !attendanceError`. The presence of `attendanceError` unconditionally hid the action button.
4. `facultyRoutes.js` lacked dedicated `/profile` and `/me` routes, causing requests to `:facultyId` with value `"me"` to fail authorization with HTTP 403.

### Repairs Implemented
- **Backend Service**: Enhanced `getFacultyById(identifier)` in `backend/src/services/faculty/facultyService.js` to cross-reference the `User` collection. If an authenticated user with `role: "faculty"` exists, it synchronizes the `Faculty` collection automatically.
- **Backend Routes**: Registered `GET /api/faculty/me` and `GET /api/faculty/profile` routes before parameter routes in `backend/src/routes/facultyRoutes.js`.
- **Backend Controller**: Updated `checkInController` and `getTodayAttendanceController` in `backend/src/controllers/attendanceController.js` to perform fallback lookups via `getFacultyById(req.user.facultyId || req.user.userId)`.
- **Frontend State**: Updated `FacultyDashboard.jsx` so `canCheckIn` and `canCheckOut` remain enabled when an error occurs, allowing the user to view the error and re-attempt check-in.
- **Database Repair**: Legally provisioned the official faculty document for `F101` (`Faculty User`, `CSE`, `Assistant Professor`) via authenticated institutional admin API.

---

## 2. Issue B — Campus Locations Refresh & Multiple Active Locations Crash

### Symptoms
- Added campus locations did not reliably appear in the configured list.
- Clicking "Refresh" prompted for a reset confirmation and cleared the form.
- Multiple active campus locations caused backend location verification to crash with HTTP 500.

### Root Cause
1. In `CampusLocationConfigurationPage.jsx`, the "Refresh" button next to "Campus Locations" had `onClick={handleReset}` instead of `refreshLocations`. `handleReset` opened a `window.confirm` dialog asking to reset the form and invoked `handleCancel()`, wiping in-progress input.
2. In `backend/src/services/location/locationService.js`, `getActiveCampusLocation()` explicitly threw `500 MULTIPLE_ACTIVE_CAMPUS_LOCATIONS` if `locations.length > 1`.
3. `verifyCampusLocation` only compared against a single location (`locations[0]`), failing any faculty member visiting a secondary campus.
4. `LocationForm.jsx` lacked submitting feedback and error messages right above the submit action, leading users to believe the button was unresponsive.

### Repairs Implemented
- **Frontend Page**: Replaced `onClick={handleReset}` with `onClick={refreshLocations}` and added an asynchronous `saving` state.
- **Frontend Form**: Added `isSaving` prop and localized inline feedback message banner in `LocationForm.jsx`.
- **Backend Service**: Removed the multiple active locations throw in `getActiveCampusLocation()`, returning the primary active location safely.
- **Backend Verification**: Rewrote `verifyCampusLocation` in `locationService.js` to evaluate coordinates against ALL active campus locations in MongoDB Atlas, succeeding if the faculty member is within ANY active campus geofence.

---

## 3. Issue C — Policy Validation Bug & Persistence

### Symptoms
- Saving the policy failed with `"At least one verification method must be enabled"` even when checkboxes were selected.

### Root Cause
- `validatePolicy` evaluated `!policy.requiredVerification`. In form state, verification methods were separate boolean flags (`identityVerification`, `locationVerification`, etc.). Since `requiredVerification` was `undefined`, the check permanently rejected saves.

### Repairs Implemented
- Rewrote `validatePolicy` in `policyValidation.js` to verify that at least one of `identityVerification`, `biometricVerification`, `networkVerification`, `locationVerification`, `scheduleVerification`, or `requiredSignals` is enabled.
- Connected `Schedule Verification` toggle in `PolicyForm.jsx`.
- Updated `PolicyConfigurationPage.jsx` so checkbox toggles immediately clear errors and reset restores the exact server baseline.

---

## 4. Issue D & E — Browser Sandbox Honesty & Dynamic Shared Configuration

### Symptoms
- Inability to read connected Wi-Fi SSID in web browsers.
- GPS coordinates auto-filling without user review.

### Repairs Implemented
- Added honest diagnostics banner explaining W3C/WHATWG browser privacy sandbox restrictions on Wi-Fi SSID/BSSID.
- Added "Use Current Location" button in `LocationForm.jsx` with real-time geofence preview, explicit permission error handling, manual editability, and commit confirmation guards.
- Created MongoDB Atlas CRUD endpoints for `NetworkLocation` (`/api/admin/networks`).
- Exposed dynamic authenticated config endpoints (`GET /api/attendance/policy`, `GET /api/attendance/locations`, `GET /api/attendance/networks`) for mobile and web parity.
