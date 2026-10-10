# Environment Configuration

This project requires environment variables configured across the backend, web frontend, and mobile clients.
**Never commit these `.env` files or expose credentials publicly.**

## Backend (`/backend/.env`)

Required configuration for the Express server and MongoDB connection.

```ini
# Application configuration
PORT=5000
NODE_ENV=development

# Database connection
# Replace with your actual MongoDB Atlas connection string. Keep this secure!
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Security credentials
# Generate a strong randomized 64-character secret for production.
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=8h
```

## Web Frontend (`/frontend/facultyflow-web/.env`)

Required configuration for the React Vite application.
Variables must be prefixed with `VITE_` to be exposed to the client build.

```ini
# Target URL for backend API requests
VITE_API_URL=http://localhost:5000
```

## Mobile Client (`/frontend/facultyflow-mobile/.env`)

Required configuration for the React Native Expo application.
Variables must be prefixed with `EXPO_PUBLIC_` to be exposed to the mobile bundle.

```ini
# Target URL for backend API requests
# IMPORTANT: If testing on a physical device using Expo Go, "localhost" will resolve to the phone itself.
# You MUST change this to your computer's local network IP address (e.g., 192.168.x.x).
EXPO_PUBLIC_API_URL=http://localhost:5000
```
