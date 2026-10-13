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

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const rooms = await Room.find({});
    console.log('Found', rooms.length, 'rooms:');
    rooms.forEach(r => {
      console.log(`- Room: ${r.roomId}, Timetable keys (days): ${Object.keys(r.timetable || {})}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
