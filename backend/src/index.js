const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// WARNING: Hardcoding credentials is insecure; prefer environment variables in real projects.
const MONGO_URI =
  'mongodb+srv://nishant3054_db_user:KkW6HP40cWhe6E5v@cluster0.rxiurt8.mongodb.net/?appName=Cluster0';

// Define Rooms schema:
// rooms -> roomId -> day -> lectureNo -> { subject, teacher, class }
const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    // Nested object: { [day]: { [lectureNo]: { subject, teacher, class } } }
    timetable: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Small helper so backend can also parse "Subject (Teacher)"
function parseCellText(raw) {
  if (!raw) {
    return { subject: null, teacher: null };
  }

  const text = String(raw).trim();
  if (!text) {
    return { subject: null, teacher: null };
  }

  const match = text.match(/^(.*?)(?:\((.*?)\))?$/);
  if (!match) {
    return { subject: text, teacher: null };
  }

  const subject = match[1] ? match[1].trim() : '';
  const teacher = match[2] ? match[2].trim() : '';

  return {
    subject: subject || null,
    teacher: teacher || null,
  };
}

// Helper to render a timetable as a grid: rows = lecture numbers, columns = days.
// Returns the total height used so callers can place multiple tables on a page.
function renderRoomTimetableGrid(doc, roomId, timetable, startY = 60) {
  const days = Object.keys(timetable || {}).sort();

  // Collect all lecture numbers across all days
  const lectureSet = new Set();
  days.forEach((day) => {
    const lectures = timetable[day] || {};
    Object.keys(lectures).forEach((lecNo) => lectureSet.add(lecNo));
  });

  const lectureNos = Array.from(lectureSet).sort(
    (a, b) => Number(a) - Number(b)
  );

  // Title at top (centered)
  const titleY = startY;
  doc
    .fontSize(20)
    .text(`Timetable for Room ${roomId}`, 0, titleY, { align: 'center' });

  if (!days.length || !lectureNos.length) {
    doc
      .fontSize(12)
      .text('No timetable data available.', 0, titleY + 24, {
        align: 'center',
      });
    // Rough height taken by title + message
    return 60;
  }

  // Basic grid layout
  const startX = 50;
  const tableStartY = titleY + 28;
  const colWidth = 90; // width per day column
  const rowHeight = 45; // taller rows so subject + teacher can wrap

   // Slightly thicker borders for table
   doc.lineWidth(0.5);

  // Header row: first cell is "Lecture", then each day
  doc.fontSize(12).font('Helvetica-Bold');

  // Colored header background for "Lecture" column (left heading column)
  doc.save();
  doc
    .rect(startX, tableStartY, colWidth, rowHeight)
    .fillAndStroke('#004c99', '#002b55'); // deep blue for heading column
  doc.restore();

  // Colored header background for day columns
  days.forEach((_, index) => {
    const x = startX + colWidth * (index + 1);
    doc.save();
    doc
      .rect(x, tableStartY, colWidth, rowHeight)
      .fillAndStroke('#1976d2', '#0d47a1'); // lighter blue for header row
    doc.restore();
  });

  // Header text for "Lecture" column
  doc.fillColor('#ffffff');
  doc.text('Lecture', startX + 4, tableStartY + 10, {
    width: colWidth - 8,
    align: 'center',
  });

  // Header text for each day
  days.forEach((day, index) => {
    const x = startX + colWidth * (index + 1);
    doc.fillColor('#ffffff');
    doc.text(day, x + 4, tableStartY + 10, {
      width: colWidth - 8,
      align: 'center',
    });
  });

  // Body rows
  doc.font('Helvetica').fontSize(10);
  lectureNos.forEach((lecNo, rowIndex) => {
    const y = tableStartY + rowHeight * (rowIndex + 1);

    // Zebra striping for better readability
    if (rowIndex % 2 === 1) {
      doc.save();
      doc
        .rect(startX, y, colWidth * (days.length + 1), rowHeight)
        .fillOpacity(0.04)
        .fill('#000000');
      doc.restore();
    }

    // Lecture number column cell + grid (light blue background for heading column)
    doc.save();
    doc
      .rect(startX, y, colWidth, rowHeight)
      .fillAndStroke('#e3f2fd', '#90caf9');
    doc.restore();
    doc.fillColor('#000000');
    doc.text(String(lecNo), startX + 4, y + 12, {
      width: colWidth - 8,
      align: 'center',
    });

    // Each day cell
    days.forEach((day, colIndex) => {
      const x = startX + colWidth * (colIndex + 1);
      const entry = (timetable[day] || {})[lecNo] || {};
      const subject = entry.subject || '';
      const teacher = entry.teacher || '';

      let cellText = '';
      if (!subject && !teacher) {
        cellText = 'Free';
      } else {
        cellText = subject || '';
        if (teacher) {
          cellText += ` (${teacher})`;
        }
      }

      doc.rect(x, y, colWidth, rowHeight).stroke();
      doc.fillColor('#000000');
      doc.text(cellText, x + 4, y + 8, {
        width: colWidth - 8,
        height: rowHeight - 12,
      });
    });
  });

  const tableHeight = rowHeight * (lectureNos.length + 1);
  // Total height = title area + table
  return (tableStartY - startY) + tableHeight + 10;
}

// Save / update a single lecture entry for a room
app.post('/api/rooms/timetable', async (req, res) => {
  try {
    const { roomId, day, lectureNo, class: className } = req.body;
    let { teacher, subject } = req.body;

    console.log('Incoming /api/rooms/timetable', {
      roomId,
      day,
      lectureNo,
      className,
      teacher,
      subject,
    });

    // If teacher is missing but subject contains "Subject (Teacher)", attempt to split it.
    if (!teacher && typeof subject === 'string' && subject.includes('(')) {
      const parsed = parseCellText(subject);
      subject = parsed.subject;
      teacher = parsed.teacher;
    }

    if (!roomId || !day || !lectureNo) {
      console.warn('Missing key fields in timetable payload', {
        roomId,
        day,
        lectureNo,
      });
    }

    // Find existing room or create a new one
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId, timetable: {} });
    }

    // Ensure nested objects exist
    if (!room.timetable[day]) {
      room.timetable[day] = {};
    }

    // Save / overwrite this lecture slot
    room.timetable[day][lectureNo] = {
      class: className ?? null,
      teacher: teacher ?? null,
      subject: subject ?? null,
    };

    // Timetable is a Mixed field; explicitly mark it as modified so nested changes are persisted.
    room.markModified('timetable');

    await room.save();

    console.log('Saved lecture to DB', {
      roomId: room.roomId,
      day,
      lectureNo,
    });

    return res.status(200).json({
      message: 'Lecture saved successfully.',
      data: {
        roomId: room.roomId,
        day,
        lectureNo,
        class: className ?? null,
        teacher: teacher ?? null,
        subject: subject ?? null,
      },
    });
  } catch (err) {
    console.error('Error saving lecture', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Bulk save: double loop over rows x days and persist every non-empty cell
app.post('/api/rooms/timetable/bulk', async (req, res) => {
  try {
    const { roomId, days, rows } = req.body || {};

    console.log('Incoming /api/rooms/timetable/bulk', {
      roomId,
      daysCount: Array.isArray(days) ? days.length : 0,
      rowsCount: Array.isArray(rows) ? rows.length : 0,
    });

    if (!roomId || !Array.isArray(days) || !Array.isArray(rows)) {
      return res.status(400).json({
        message: 'roomId, days[], and rows[] are required for bulk save.',
      });
    }

    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId, timetable: {} });
    }

    // Double loop: rows x days
    for (const row of rows) {
      const lectureNo = row.lectureNo;
      if (!lectureNo) continue;

      for (const day of days) {
        const rawCell = row[day];
        if (rawCell == null || rawCell === '') continue;

        // Cell may already be split as { subject, teacher } on frontend,
        // or it may be a single string "Subject (Teacher)".
        let subject = null;
        let teacher = null;

        if (typeof rawCell === 'string') {
          const parsed = parseCellText(rawCell);
          subject = parsed.subject;
          teacher = parsed.teacher;
        } else if (rawCell && typeof rawCell === 'object') {
          subject = rawCell.subject ?? null;
          teacher = rawCell.teacher ?? null;
        }

        if (!subject) continue;

        if (!room.timetable[day]) {
          room.timetable[day] = {};
        }

        room.timetable[day][lectureNo] = {
          class: null,
          teacher,
          subject,
        };
        console.log('Bulk save cell', {
          roomId,
          day,
          lectureNo,
          subject,
          teacher,
        });
      }
    }

    // Timetable is a Mixed field; explicitly mark it as modified so nested changes are persisted.
    room.markModified('timetable');

    await room.save();

    return res.status(200).json({
      message: 'Bulk timetable saved successfully.',
      roomId: room.roomId,
    });
  } catch (err) {
    console.error('Error in bulk timetable save', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Generate a single PDF containing timetables for all rooms
app.get('/api/rooms/timetable/pdf', async (req, res) => {
  try {
    const rooms = await Room.find({}).lean();

    if (!rooms || !rooms.length) {
      return res.status(404).json({ message: 'No rooms found in database.' });
    }

    const roomsWithData = rooms
      .filter((room) => room.timetable && Object.keys(room.timetable).length)
      .sort((a, b) => a.roomId.localeCompare(b.roomId));

    if (!roomsWithData.length) {
      return res
        .status(404)
        .json({ message: 'No timetables found for any room.' });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="timetable_all_rooms.pdf"'
    );

    doc.pipe(res);

    // Place up to two room timetables per page (stacked vertically)
    const topMarginY = 60;
    const gapBetweenTables = 30;
    let index = 0;

    while (index < roomsWithData.length) {
      const pageHeight = doc.page.height - doc.page.margins.bottom;

      const roomA = roomsWithData[index];
      const { roomId: roomIdA, timetable: timetableA = {} } = roomA;

      // New page for each pair
      if (index > 0) {
        doc.addPage();
      }

      // First table on page
      const heightA = renderRoomTimetableGrid(
        doc,
        roomIdA,
        timetableA,
        topMarginY
      );
      index += 1;

      // If no second room, we're done with this page
      if (index >= roomsWithData.length) {
        break;
      }

      const roomB = roomsWithData[index];
      const { roomId: roomIdB, timetable: timetableB = {} } = roomB;

      const secondStartY = topMarginY + heightA + gapBetweenTables;

      // If second table wouldn't fit, render it on a fresh page instead
      if (secondStartY + 100 > pageHeight) {
        doc.addPage();
        renderRoomTimetableGrid(doc, roomIdB, timetableB, topMarginY);
      } else {
        renderRoomTimetableGrid(doc, roomIdB, timetableB, secondStartY);
      }

      index += 1;
    }

    doc.end();
  } catch (err) {
    console.error('Error generating all-rooms timetable PDF', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to generate PDF.' });
    }
  }
});

// Generate a PDF for a room's timetable
app.get('/api/rooms/:roomId/timetable/pdf', async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required.' });
    }

    const room = await Room.findOne({ roomId });

    if (!room || !room.timetable || !Object.keys(room.timetable).length) {
      return res
        .status(404)
        .json({ message: `No timetable found for room ${roomId}.` });
    }

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="timetable_${roomId}.pdf"`
    );

    // Pipe PDF stream to response
    doc.pipe(res);

    const timetable = room.timetable || {};
    renderRoomTimetableGrid(doc, roomId, timetable);

    doc.end();
  } catch (err) {
    console.error('Error generating timetable PDF', err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to generate PDF.' });
    }
  }
});

// Connect to MongoDB, then start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });



