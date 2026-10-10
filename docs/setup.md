# Local Development Setup

Follow these instructions to configure and run FacultyFlow on your local development machine.

## Prerequisites

- **Node.js**: v18.0.0 or higher.
- **npm**: v9 or higher.
- **MongoDB Atlas**: An active MongoDB Atlas cluster with network access allowed for your development IP address (or `0.0.0.0/0` for testing).

## Installation

The repository is structured as a monorepo with separate packages.

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install Web Frontend Dependencies:**
   ```bash
   cd frontend/facultyflow-web
   npm install
   ```

3. **Install Mobile App Dependencies:**
   ```bash
   cd frontend/facultyflow-mobile
   npm install
   ```

## Configuration

You must configure environment variables for all three packages. Please refer to [environment.md](./environment.md) for detailed variable templates.

1. Create a `.env` file in `/backend`.
2. Create a `.env` file in `/frontend/facultyflow-web`.
3. Create a `.env` file in `/frontend/facultyflow-mobile`.

## Starting the Application

We recommend opening three separate terminal windows to run the services simultaneously.

### 1. Start the Backend API
```bash
cd backend
npm run dev
```
The backend will run at `http://localhost:5000`. You should see `MongoDB Connected` in the terminal.

### 2. Start the Web Admin Dashboard
```bash
cd frontend/facultyflow-web
npm run dev
```
The web dashboard will typically run at `http://localhost:5173`. Open this URL in your browser.

### 3. Start the Mobile Client (Expo)
```bash
cd frontend/facultyflow-mobile
npm start
```
This will start the Expo Metro Bundler.
- To run on an iOS Simulator, press `i`.
- To run on an Android Emulator, press `a`.
- To run on a physical device, scan the QR code using the Expo Go app. **Note:** If running on a physical device, ensure your `EXPO_PUBLIC_API_URL` points to your computer's local network IP address (e.g., `http://192.168.1.X:5000`), not `localhost`.

## Database Seeding (Optional)

If starting with a fresh database, you can use the included `ensurePolicy.js` script to bootstrap an initial active attendance policy and location:
```bash
cd backend
node ensurePolicy.js
```
