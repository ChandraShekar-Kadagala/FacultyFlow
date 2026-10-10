import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { processSyncEvent } from './src/services/sync/syncService.js';
import Faculty from './src/models/Faculty.js';
import User from './src/models/User.js';
import AttendanceRecord from './src/models/AttendanceRecord.js';
import SyncEvent from './src/models/SyncEvent.js';

dotenv.config();

async function testSync() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const faculty = await Faculty.findOne({ status: 'active' });
  const user = await User.findOne({ facultyId: faculty.facultyId });

  await AttendanceRecord.deleteMany({ facultyId: faculty.facultyId });
  await SyncEvent.deleteMany({ facultyId: faculty.facultyId });

  const eventId = "TEST-SYNC-" + Date.now();

  const mockEvent = {
    eventId,
    eventType: "CHECK_IN",
    device: { deviceId: "SYNC1", platform: "android" },
    location: { latitude: 0, longitude: 0, accuracyMeters: 10 }
  };

  console.log('Processing first sync event...');
  const res1 = await processSyncEvent({ event: mockEvent, user });
  console.log('Res 1:', res1.code);

  console.log('Processing exact same event (retry)...');
  const res2 = await processSyncEvent({ event: mockEvent, user });
  console.log('Res 2:', res2.code);

  process.exit(0);
}

testSync().catch(console.error);
