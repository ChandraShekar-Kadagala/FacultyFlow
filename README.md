# FacultyFlow

FacultyFlow is a production-grade, full-stack, cross-platform faculty attendance and verification system. It features an Express/MongoDB backend, a React 19/Vite administrative web dashboard, and an Expo/React Native mobile application engineered with an offline-first architecture for reliable check-ins.

---

## 1. System Architecture

```
                               ┌─────────────────────────────────────────┐
                               │           MongoDB Atlas Cluster         │
                               └────────────────────▲────────────────────┘
                                                    │
                                                    │ (Mongoose ODM)
                                                    ▼
┌─────────────────────────────────┐    REST / JSON    ┌─────────────────────────────────┐
│   FacultyFlow Web Admin (Vercel)│ ◄───────────────► │   FacultyFlow API (Render)      │
│   React 19 + Vite + Tailwind    │                   │   Node.js + Express 5 + JWT     │
│   https://faculty-flow-nine...  │                   │   https://facultyflow-1kgs...   │
└─────────────────────────────────┘                   └────────────────▲────────────────┘
                                                                       │
                                              REST / Idempotent Sync   │
                                              POST /api/sync/events    │
                                                                       ▼
                                                      ┌─────────────────────────────────┐
                                                      │  FacultyFlow Mobile (Android/iOS│
                                                      │  React Native 0.86 + Expo SDK 57│
                                                      │  - expo-sqlite (Durable Queue)  │
                                                      │  - expo-secure-store (Auth)     │
                                                      │  - @react-native-community/     │
                                                      │    netinfo (Network Monitor)    │
                                                      └─────────────────────────────────┘
```

### Component Directory Layout
- **Backend API (`backend/`)**: Node.js, Express, MongoDB Atlas, JWT authentication, verification signal processing (location, network, schedule, device), role-based access control, and offline sync endpoint (`POST /api/sync/events`).
- **Web Admin Console (`frontend/`)**: React 19, Vite, React Router, TailwindCSS. Administrative portal for viewing campus rosters, configuring attendance policies, inspecting live attendance, and viewing audit logs.
- **Mobile Client (`frontend/facultyflow-mobile/`)**: React Native, Expo SDK 57, Expo Router. Faculty-facing mobile application featuring offline event queuing with SQLite, automatic synchronization upon reconnect, biometric/SecureStore token persistence, and location verification.
- **Documentation (`docs/`)**: Full architectural blueprints, API inventories, test logs, requirements traceability, and deployment guides.

---

## 2. Live Deployments

- **Production Backend API:** `https://facultyflow-1kgs.onrender.com`
  - Health Check: `https://facultyflow-1kgs.onrender.com/api/health`
- **Production Web Admin Console:** `https://faculty-flow-nine.vercel.app`
- **Mobile Application Package:** `com.facultyflow.app` (configured for EAS standalone APK build)

---

## 3. Environment Configuration

> [!IMPORTANT]
> Never commit actual credentials, database passwords, or secret keys to version control. Use the environment templates provided in each directory.

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/facultyflow` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *(Cryptographically random 32+ character string)* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `CORS_ORIGIN` | Allowed web frontend origin(s) | `http://localhost:5173,https://faculty-flow-nine.vercel.app` |

### Mobile Client (`frontend/facultyflow-mobile/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Base API URL | `http://10.0.2.2:5000/api` (Dev Android) or `https://facultyflow-1kgs.onrender.com/api` (Prod) |

---

## 4. Getting Started & Local Development

### 4.1 Prerequisites
- Node.js v20.x or higher
- npm v10.x or higher
- MongoDB Atlas cluster access or local MongoDB instance

### 4.2 Backend API
```powershell
cd backend
npm install
node server.js
# API running at http://localhost:5000
```

### 4.3 Web Admin Console
```powershell
cd frontend
npm install
npm run dev
# Web console running at http://localhost:5173
```

### 4.4 Mobile Application
```powershell
cd frontend/facultyflow-mobile
npm install
npx expo start
```

---

## 5. Verification & Test Commands

FacultyFlow includes comprehensive automated quality gates covering backend integrity, authentication, mobile actions, offline sync, and reliability hardening:

```powershell
# 1. Backend Release Verification Gate (7/7 Gates)
cd backend
node verifyReleaseGate.js

# 2. Mobile Foundation Verification Gate (7/7 Gates)
cd frontend/facultyflow-mobile
node testMobileFoundation.js

# 3. Mobile Phase 2 Actions & Attendance Gate (7/7 Gates)
cd frontend/facultyflow-mobile
node testMobilePhase2.js

# 4. Mobile Phase 3 Offline Sync Gate (7/7 Gates)
cd frontend/facultyflow-mobile
node testMobilePhase3.js

# 5. Mobile Phase 4 Reliability Hardening Gate (7/7 Gates)
cd frontend/facultyflow-mobile
node testMobilePhase4.js

# 6. Web Frontend Production Build
cd frontend
npm run build

# 7. Mobile Metro Production Bundling
cd frontend/facultyflow-mobile
npx expo export --no-bytecode

# 8. Mobile Static Code Analysis
cd frontend/facultyflow-mobile
npm run lint
```

---

## 6. Standalone Android APK Generation

The mobile application is configured for standalone Android APK generation via EAS (Expo Application Services):

```powershell
cd frontend/facultyflow-mobile

# Authenticate with your Expo account
npx eas login

# Trigger cloud build for standalone APK
npx eas build -p android --profile preview
```

For complete instructions regarding local Android SDK builds, ADB installation, runtime permissions, and device smoke testing, see the [Android Release Guide](docs/FACULTYFLOW_ANDROID_RELEASE_GUIDE.md).

---

## 7. Master Documentation & Reports

- [Requirements Traceability Matrix (RTM)](docs/FACULTYFLOW_REQUIREMENTS_TRACEABILITY.md) — Complete 24-requirement mapping across backend, web, mobile, and verification gates.
- [Phase 5 Master Audit & Release Readiness Report](docs/FACULTYFLOW_PHASE5_FINAL_REPORT.md) — Final executive summary, remediated bugs, deployment verification, and release decision.
- [Android Release & Deployment Guide](docs/FACULTYFLOW_ANDROID_RELEASE_GUIDE.md) — Operational instructions for APK generation, ADB installation, and device testing.
- [API Inventory](docs/FACULTYFLOW_API_INVENTORY.md) — Full REST endpoint catalog and contract schemas.
- [Repair & Hardening Log](docs/FACULTYFLOW_REPAIR_LOG.md) — Historical engineering repair log.
- [Release Gate Test Report](docs/FACULTYFLOW_TEST_REPORT.md) — Historical test execution report.
