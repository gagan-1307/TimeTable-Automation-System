const parseExcel = require("../utils/excelParser");
const Timetable = require("../models/Timetable.model");

exports.uploadRoomExcel = async (req, res) => {
  try {
    const room_id = req.body.room_id;
    const rows = parseExcel(req.file.buffer);

    for (let row of rows) {
      await Timetable.create({
        room_id,
        day: row.day,
        lecture_no: row.lecture_no,
        department: row.department,
        section: row.section,
        subject: row.subject,
        teacher: row.teacher
      });
    }

    res.json({ message: "Timetable uploaded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
