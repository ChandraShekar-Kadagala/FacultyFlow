# FacultyFlow

FacultyFlow is a full-stack, cross-platform system for securely tracking and verifying faculty attendance. It features a Node.js backend, a React/Vite admin dashboard, and an Expo/React Native mobile client for offline-first check-ins.

## Project Architecture

- **Backend (`/backend`)**: Node.js + Express + MongoDB Atlas. Provides RESTful APIs, JWT authentication, role-based access control, complex attendance verification logic (device, location, network, schedule), and offline event synchronization endpoints.
- **Web Client (`/frontend/facultyflow-web`)**: React + Vite + TailwindCSS. The administrative interface for managing faculty, policies, and viewing attendance and audit logs.
- **Mobile Client (`/frontend/facultyflow-mobile`)**: React Native + Expo. The mobile app used by faculty to securely check in and check out. It features an offline-first architecture with local event queuing, retry logic, and idempotency guarantees.

## Getting Started

To get started with development, please follow the detailed setup instructions in the documentation:

1. [Local Setup Guide](docs/setup.md)
2. [Environment Configuration](docs/environment.md)
3. [Testing Guide](docs/testing.md)

## Documentation Structure

- [setup.md](docs/setup.md) - Requirements, installation, and startup instructions.
- [environment.md](docs/environment.md) - Environment variable definitions for all tiers.
- [testing.md](docs/testing.md) - Automated checks, linting, and manual testing instructions.
- [security.md](docs/security.md) - Authentication, authorization, secrets management, and audit trails.
- [offline-sync.md](docs/offline-sync.md) - Details on the mobile-to-backend offline synchronization protocol, idempotency, and recovery mechanics.
- [deployment.md](docs/deployment.md) - Recommendations for production deployment.

## Features Checklist

- [x] Secure JWT-based Authentication
- [x] Role-Based Access Control (Admin vs. Faculty)
- [x] Flexible Attendance Policies (On-Time, Late, Overtime)
- [x] Configurable Verification Signals (Identity, Network, Location, Schedule)
- [x] Immutable Audit Logging
- [x] Robust Offline-First Mobile Synchronization with Event Recovery
- [x] Web and Mobile Application Interfaces
