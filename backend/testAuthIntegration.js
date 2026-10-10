import mongoose from 'mongoose';

import dotenv from 'dotenv';
import User from './src/models/User.js';
import { hashPassword } from './src/services/auth/passwordService.js';
import { generateAccessToken } from './src/services/auth/tokenService.js';

dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

async function runAuthTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for setup.');

  // Clean up
  await User.deleteMany({ email: { $in: ['admin@test.com', 'faculty@test.com', 'inactive@test.com'] } });

  const passwordHash = await hashPassword('password123');

  // Create Users
  const admin = await User.create({
    userId: 'TEST-ADMIN',
    name: 'Admin User',
    email: 'admin@test.com',
    passwordHash,
    role: 'admin',
    status: 'active'
  });

  const faculty = await User.create({
    userId: 'TEST-FACULTY',
    name: 'Faculty User',
    email: 'faculty@test.com',
    passwordHash,
    role: 'faculty',
    facultyId: 'F-TEST',
    status: 'active'
  });

  const inactive = await User.create({
    userId: 'TEST-INACTIVE',
    name: 'Inactive User',
    email: 'inactive@test.com',
    passwordHash,
    role: 'faculty',
    status: 'inactive'
  });

  console.log('Test users created.');

  // 1. Test Login - Admin
  const resAdmin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
  });
  const dataAdmin = await resAdmin.json();
  if (dataAdmin.success && dataAdmin.accessToken) console.log('✅ Admin login successful');
  else console.error('❌ Admin login failed', dataAdmin);

  // 2. Test Login - Inactive
  const resInactive = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'inactive@test.com', password: 'password123' })
  });
  const dataInactive = await resInactive.json();
  if (!dataInactive.success && resInactive.status === 403) console.log('✅ Inactive login rejected');
  else console.error('❌ Inactive login should fail with 403', dataInactive);

  // 3. Test Invalid Token
  const resInvalid = await fetch(`${BASE_URL}/admin/dashboard/summary`, {
    headers: { 'Authorization': 'Bearer INVALID_TOKEN' }
  });
  if (resInvalid.status === 401) console.log('✅ Invalid token rejected');
  else console.error('❌ Invalid token not handled properly');

  // 4. Test Role Restrictions (Faculty trying to access admin endpoint)
  const resFaculty = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'faculty@test.com', password: 'password123' })
  });
  const dataFaculty = await resFaculty.json();

  const resRoleCheck = await fetch(`${BASE_URL}/admin/policy`, {
    headers: { 'Authorization': `Bearer ${dataFaculty.accessToken}` }
  });
  if (resRoleCheck.status === 403) console.log('✅ Faculty rejected from admin endpoint');
  else console.error('❌ Role restriction failed, status:', resRoleCheck.status);

  // 5. Test Protected Endpoints (Admin access)
  const resAdminAccess = await fetch(`${BASE_URL}/admin/policy`, {
    headers: { 'Authorization': `Bearer ${dataAdmin.accessToken}` }
  });
  if (resAdminAccess.status === 200) console.log('✅ Admin access allowed to admin endpoint');
  else console.error('❌ Admin access denied, status:', resAdminAccess.status);

  console.log('Done.');
  process.exit(0);
}

runAuthTests();
