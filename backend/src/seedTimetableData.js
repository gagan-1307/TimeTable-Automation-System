const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} },
  }
);

const Room = mongoose.model('Room', roomSchema);

const DEPT_COURSES = {
  'IT': [
    { subjectCode: 'ITPC 302', subjectName: 'Big Data Analytics', teacher: 'Dr. Kuldeep Kumar', branch: 'IT', section: 'A1' },
    { subjectCode: 'ITPC 304', subjectName: 'Distributed Technologies', teacher: 'Dr. Santosh Kumar', branch: 'IT', section: 'B3' },
    { subjectCode: 'ITTC 306', subjectName: 'Distributed Computing', teacher: 'Prof. A.K. Singh', branch: 'IT', section: 'A2' },
    { subjectCode: 'ITPE 308', subjectName: 'Software Verification and Validation', teacher: 'Dr. Lov Kumar', branch: 'IT', section: 'B4' },
    { subjectCode: 'ITPE 320', subjectName: 'Compiler Design', teacher: 'Dr. Mohit', branch: 'IT', section: 'A1' }
  ],
  'CSE': [
    { subjectCode: 'CSPC 302', subjectName: 'Big Data Analytics', teacher: 'Dr. Yogita', branch: 'CSE', section: 'B4' },
    { subjectCode: 'CSPC 306', subjectName: 'Information Security', teacher: 'Dr. Minakshi Sharma', branch: 'CSE', section: 'C5' },
    { subjectCode: 'CSTC 318', subjectName: 'Generative AI', teacher: 'Dr. Pratistha Verma', branch: 'CSE', section: 'C6' },
    { subjectCode: 'CSPE 306', subjectName: 'Image Processing', teacher: 'Dr. Anoop Kumar Patel', branch: 'CSE', section: 'B3' },
    { subjectCode: 'CSPE 320', subjectName: 'Compiler Design', teacher: 'Dr. Ankit Kumar Jain', branch: 'CSE', section: 'A2' }
  ],
  'Cyber': [
    { subjectCode: 'CY-301', subjectName: 'Cyber Security Fundamentals', teacher: 'Dr. Vikram Singh', branch: 'CSE', section: 'A1' },
    { subjectCode: 'CY-302', subjectName: 'Cryptography & Network Security', teacher: 'Dr. Kriti Bhushan', branch: 'CSE', section: 'B3' },
    { subjectCode: 'CY-303', subjectName: 'Penetration Testing', teacher: 'Dr. Sudesh Kumar', branch: 'CSE', section: 'A2' }
  ],
  'DS': [
    { subjectCode: 'DS-301', subjectName: 'Data Science & Analysis', teacher: 'Dr. Preeti Sharma', branch: 'IT', section: 'B3' },
    { subjectCode: 'DS-302', subjectName: 'Data Visualization & Wrangling', teacher: 'Dr. Vaibhav Aggarwal', branch: 'IT', section: 'A2' },
    { subjectCode: 'DS-303', subjectName: 'Data Mining Techniques', teacher: 'Dr. Ruby Chauhan', branch: 'IT', section: 'B4' }
  ],
  'ECE': [
    { subjectCode: 'ECE-301', subjectName: 'Digital Signal Processing', teacher: 'Dr. Amit Verma', branch: 'ECE', section: 'A1' },
    { subjectCode: 'ECE-302', subjectName: 'Microcontrollers & Embedded Systems', teacher: 'Dr. Shweta Singh', branch: 'ECE', section: 'B3' },
    { subjectCode: 'ECE-303', subjectName: 'Wireless Communication Systems', teacher: 'Dr. Naveen Kumar', branch: 'ECE', section: 'A2' }
  ],
  'CE': [
    { subjectCode: 'CE-301', subjectName: 'Structural Analysis II', teacher: 'Dr. Rajesh Gupta', branch: 'CE', section: 'A1' },
    { subjectCode: 'CE-302', subjectName: 'Geotechnical Engineering', teacher: 'Dr. Sandeep Kumar', branch: 'CE', section: 'B3' },
    { subjectCode: 'CE-303', subjectName: 'Water Resources Engineering', teacher: 'Dr. Pooja Sharma', branch: 'CE', section: 'A2' }
  ],
  'ME': [
    { subjectCode: 'ME-301', subjectName: 'Thermodynamics & Heat Transfer', teacher: 'Dr. Anil Kumar', branch: 'ME', section: 'B4' },
    { subjectCode: 'ME-302', subjectName: 'Fluid Mechanics & Turbomachinery', teacher: 'Dr. Sunil Yadav', branch: 'ME', section: 'A1' },
    { subjectCode: 'ME-303', subjectName: 'Machine Design & Kinematics', teacher: 'Dr. Rakesh Verma', branch: 'ME', section: 'A2' }
  ],
  'EE': [
    { subjectCode: 'EE-301', subjectName: 'Power Electronics', teacher: 'Dr. Sunita Sharma', branch: 'EE', section: 'B3' },
    { subjectCode: 'EE-302', subjectName: 'Control Systems & Control Theory', teacher: 'Dr. Vikas Chaudhary', branch: 'EE', section: 'A2' },
    { subjectCode: 'EE-303', subjectName: 'Electrical Machines & Transformers', teacher: 'Dr. Meena Rani', branch: 'EE', section: 'B4' }
  ],
  'AI': [
    { subjectCode: 'AI-301', subjectName: 'Machine Learning', teacher: 'Dr. Neha Malik', branch: 'CSE', section: 'C5' },
    { subjectCode: 'AI-302', subjectName: 'Deep Learning & Neural Networks', teacher: 'Dr. Pratistha Verma', branch: 'CSE', section: 'C6' },
    { subjectCode: 'AI-303', subjectName: 'Natural Language Processing', teacher: 'Dr. Lov Kumar', branch: 'CSE', section: 'B4' }
  ],
  'Robotics': [
    { subjectCode: 'ROB-301', subjectName: 'Robotic Kinematics & Dynamics', teacher: 'Dr. Harish Kumar', branch: 'ME', section: 'B3' },
    { subjectCode: 'ROB-302', subjectName: 'Robotic Actuators & Control', teacher: 'Dr. Pankaj Sharma', branch: 'ME', section: 'A2' },
    { subjectCode: 'ROB-303', subjectName: 'Autonomous Systems & Sensors', teacher: 'Dr. Divya Gupta', branch: 'ME', section: 'B4' }
  ]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const rooms = await Room.find({});
    console.log(`Found ${rooms.length} rooms to seed data.`);

    for (const room of rooms) {
      console.log(`Processing room ${room.roomId}...`);
      const timetable = room.timetable || {};
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const lectureNos = Array.from({ length: 10 }, (_, i) => String(i + 1));

      let modified = false;

      days.forEach((day, dIdx) => {
        if (!timetable[day]) {
          timetable[day] = {};
        }

        lectureNos.forEach((lecNo) => {
          // If slot does not exist, let's create a default one
          if (!timetable[day][lecNo]) {
            // Assign a random department to make it look full
            const depts = Object.keys(DEPT_COURSES);
            const deptIdx = (room.roomId.charCodeAt(0) + day.charCodeAt(0) + Number(lecNo) * 7) % depts.length;
            timetable[day][lecNo] = {
              allocatedDept: depts[deptIdx],
              subjectCode: null,
              subjectName: null,
              branch: null,
              section: null,
              teacher: null
            };
          }

          const entry = timetable[day][lecNo];
          const dept = entry.allocatedDept || 'IT';

          // If subject details are empty, populate them!
          if (!entry.subjectCode) {
            // Look up courses for this dept
            const courses = DEPT_COURSES[dept] || DEPT_COURSES['IT'];
            // Deterministic pick based on room, day, lecture
            const seedVal = room.roomId.charCodeAt(0) + day.charCodeAt(0) + Number(lecNo) + (dIdx * 3);
            const course = courses[seedVal % courses.length];

            entry.subjectCode = course.subjectCode;
            entry.subjectName = course.subjectName;
            entry.branch = course.branch;
            entry.section = course.section;
            entry.teacher = course.teacher;
            modified = true;
          }
        });
      });

      if (modified) {
        room.timetable = timetable;
        room.markModified('timetable');
        await room.save();
        console.log(`Saved detailed timetable for room ${room.roomId}`);
      } else {
        console.log(`No changes needed for room ${room.roomId}`);
      }
    }

    console.log('Database seeding successfully finished.');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
