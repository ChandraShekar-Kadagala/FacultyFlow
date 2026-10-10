import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Faculty from './src/models/Faculty.js';
import { hashPassword } from './src/services/auth/passwordService.js';
import { generateAccessToken } from './src/services/auth/tokenService.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runAttendanceTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for setup.');

  // Clean up
  await User.deleteMany({ email: 'faculty_att@test.com' });
  await Faculty.deleteMany({ facultyId: 'F-ATT-TEST' });

  const passwordHash = await hashPassword('password123');

  const facultyDoc = await Faculty.create({
    facultyId: 'F-ATT-TEST',
    userId: 'U-ATT-TEST',
    employeeCode: 'EMP-ATT-TEST',
    name: 'Att Faculty',
    department: 'CSE',
    designation: 'Professor',
    status: 'active'
  });

  const facultyUser = await User.create({
    userId: 'U-ATT-TEST',
    name: 'Att Faculty',
    email: 'faculty_att@test.com',
    passwordHash,
    role: 'faculty',
    facultyId: 'F-ATT-TEST',
    status: 'active'
  });

  // Log in
  const resLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty_att@test.com', password: 'password123' })
  });
  const dataLogin = await resLogin.json();
  const token = dataLogin.accessToken;

  // Set up an active policy if needed? Let's just try to check in and see what happens.
  const checkInRes1 = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      device: { deviceId: "D1", platform: "ios" },
      network: { ssid: "Campus_WiFi", bssid: "00:00:00:00" },
      location: { latitude: 0, longitude: 0, accuracy: 10 }
    })
  });

  const checkInData1 = await checkInRes1.json();
  console.log('Check-In 1 Status:', checkInRes1.status, checkInData1);

  // If verification fails, it's fine, we are testing the endpoint logic.
  // We can test double check-in.
  const checkInRes2 = await fetch(`${BASE_URL}/attendance/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      device: { deviceId: "D1", platform: "ios" }
    })
  });
  const checkInData2 = await checkInRes2.json();
  console.log('Check-In 2 Status:', checkInRes2.status, checkInData2);

  const checkOutRes = await fetch(`${BASE_URL}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({})
  });
  const checkOutData = await checkOutRes.json();
  console.log('Check-Out 1 Status:', checkOutRes.status, checkOutData);

  const checkOutRes2 = await fetch(`${BASE_URL}/attendance/check-out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({})
  });
  const checkOutData2 = await checkOutRes2.json();
  console.log('Check-Out 2 Status:', checkOutRes2.status, checkOutData2);

  process.exit(0);
}

runAttendanceTests();
