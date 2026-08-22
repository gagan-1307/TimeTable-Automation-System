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
    const room = await Room.findOne({ roomId: 'LHC101' });
    console.log('Room LHC101 timetable:', JSON.stringify(room.timetable, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
