import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AttendancePolicy from './src/models/AttendancePolicy.js';
import CampusLocation from './src/models/CampusLocation.js';

dotenv.config();

async function ensurePolicy() {
  await mongoose.connect(process.env.MONGO_URI);
  let policy = await AttendancePolicy.findOne({ active: true });
  if (!policy) {
    policy = await AttendancePolicy.findOne();
    if (policy) {
      policy.active = true;
      await policy.save();
    } else {
      policy = await AttendancePolicy.create({
        policyId: 'POL-TEST',
        name: 'Test Policy',
        active: true,
        description: 'Test',
        startTime: '00:00',
        endTime: '23:59',
        requiredVerification: []
      });
    }
  }

  let loc = await CampusLocation.findOne({ active: true });
  if (!loc) {
    await CampusLocation.create({
      locationId: 'LOC-TEST',
      name: 'Test Campus',
      latitude: 0,
      longitude: 0,
      radiusMeters: 1000,
      active: true
    });
  }

  console.log('Active Policy & Location ensured.');
  process.exit(0);
}

ensurePolicy();
