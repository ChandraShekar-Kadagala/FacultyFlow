# Deployment Guidelines

This document outlines the necessary steps to transition FacultyFlow from development to a production environment.

## Backend Deployment

1. **Environment Setup**:
   - Ensure `NODE_ENV=production`.
   - Set a strong, randomly generated `JWT_SECRET`.
   - Configure your production `MONGO_URI` pointing to a properly secured cluster.
   - Configure `CORS_ORIGIN` if implemented, ensuring only your deployed frontend domains are permitted.

2. **MongoDB Security**:
   - Limit Atlas network access to your backend server's static IP address rather than `0.0.0.0/0`.
   - Restrict database user roles to read/write specific databases.
   - Ensure TLS validation is strictly enforced.

3. **Application Hosting**:
   - Deploy the Node.js application behind a reverse proxy (e.g., NGINX) or using a managed service (e.g., Heroku, AWS Elastic Beanstalk, Render).
   - Ensure the server operates exclusively over HTTPS in production.

## Web Dashboard Deployment

The web dashboard is a static React application built via Vite.

1. **Build Process**:
   ```bash
   cd frontend/facultyflow-web
   npm run build
   ```
2. Ensure your `.env.production` sets `VITE_API_URL` to your production backend URL (e.g., `https://api.facultyflow.example.com`).
3. **Hosting**:
   - Deploy the generated `/dist` directory to a static hosting provider like Vercel, Netlify, or AWS S3 + CloudFront.

## Mobile Application Deployment

Deploying the Expo React Native app to the App Store and Google Play Store requires EAS (Expo Application Services).

1. **Configuration**:
   - Set `EXPO_PUBLIC_API_URL` to your production backend URL in your production environment logic or `.env` used for the build.
2. **EAS Build**:
   ```bash
   cd frontend/facultyflow-mobile
   eas build --platform all
   ```
3. Follow the official Expo distribution guidelines to handle code signing, certificates, and app store submissions.

## Readiness Classification

Currently, the project is **Staging-Ready**.

**Why:** The business logic, architecture, error handling, security contracts, and offline recovery mechanics are fully implemented and verified against actual database instances. To become fully **Production-Ready**, the system simply requires the provision of actual production infrastructure (servers, certificates, strict VPCs, and App Store certificates), as well as native device modules for gathering real biometric/location payloads instead of simulated ones.
