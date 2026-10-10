import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const TestSchema = new mongoose.Schema({ name: String, createdAt: Date });
const TestModel = mongoose.model('TestConnection', TestSchema);

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    // Write
    const doc = await TestModel.create({ name: 'write-test', createdAt: new Date() });
    console.log("Write successful, id:", doc._id);

    // Read
    const found = await TestModel.findById(doc._id);
    console.log("Read successful, name:", found.name);

    // Delete (cleanup)
    await TestModel.deleteOne({ _id: doc._id });
    console.log("Cleanup successful.");

    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
}

runTest();
