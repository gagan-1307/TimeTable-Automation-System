/**
 * Seed default users for timetable app.
 * Run: node src/seedUsers.js
 *
 * Creates:
 * - 1 Institute Timetable Incharge (can upload Excel, allocate departments, edit any cell)
 * - Department incharges for CSE, ECE, EEE, MECH, CIVIL (can only edit cells allocated to their dept)
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('Error: MONGO_URI environment variable is not set. Aborting seed.');
  process.exit(1);
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ['institute_incharge', 'dept_incharge'],
      required: true,
    },
    department: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

const defaultUsers = [
  // {
  //   email: 'institute@nitkkr.ac.in',
  //   password: 'institute123',
  //   name: 'Institute Timetable Incharge',
  //   role: 'institute_incharge',
  //   department: null,
  // },
  { email: 'it@nitkkr.ac.in', password: 'it123', name: 'IT Dept Incharge', role: 'dept_incharge', department: 'IT' },
  // { email: 'ece@nitkkr.ac.in', password: 'ece123', name: 'ECE Dept Incharge', role: 'dept_incharge', department: 'ECE' },
  // { email: 'eee@nitkkr.ac.in', password: 'eee123', name: 'EEE Dept Incharge', role: 'dept_incharge', department: 'EEE' },
  // { email: 'mech@nitkkr.ac.in', password: 'mech123', name: 'MECH Dept Incharge', role: 'dept_incharge', department: 'MECH' },
  // { email: 'civil@nitkkr.ac.in', password: 'civil123', name: 'CIVIL Dept Incharge', role: 'dept_incharge', department: 'CIVIL' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    for (const u of defaultUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { $set: { password: u.password, name: u.name, role: u.role, department: u.department } },
        { upsert: true, new: true }
      );
      console.log('Upserted user:', u.email, u.role, u.department || '-');
    }

    console.log('Seed completed.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
