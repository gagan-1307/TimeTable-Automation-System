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

// Define Users schema for authentication
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['institute_incharge', 'dept_incharge'], 
      required: true 
    },
    department: { type: String, default: null }, // null for institute_incharge, dept code for dept_incharge
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// Define Rooms schema:
// rooms -> roomId -> day -> lectureNo -> { 
//   allocatedDept, subjectCode, subjectName, branch, section, teacher 
// }
const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },
    // Nested object: { [day]: { [lectureNo]: { allocatedDept, subjectCode, subjectName, branch, section, teacher } } }
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

// Simple authentication middleware (in production, use JWT tokens)
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  
  const token = authHeader.substring(7);
  try {
    // In production, verify JWT token here
    // For now, decode base64 token: email:password
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
};

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    
    // Create simple token (in production, use JWT)
    const token = Buffer.from(`${email}:${password}`).toString('base64');
    
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error('Error in login', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// List all room IDs (public, for dropdowns)
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({}).select('roomId').lean();
    return res.status(200).json({
      rooms: (rooms || []).map((r) => r.roomId).sort(),
    });
  } catch (err) {
    console.error('Error listing rooms', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get timetable data for a room (public endpoint)
app.get('/api/rooms/:roomId/timetable', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }
    
    return res.status(200).json({
      roomId: room.roomId,
      timetable: room.timetable || {},
    });
  } catch (err) {
    console.error('Error fetching timetable', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
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

// Helper to render a timetable as a grid: rows = days, columns = lecture numbers (1-10).
// Designed for landscape page so all 10 lecture columns fit. Returns height used.
function renderRoomTimetableGrid(doc, roomId, timetable, startY = 50) {
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const availableDays = Object.keys(timetable || {});
  const days = dayOrder.filter(day => availableDays.includes(day));
  const lectureNos = Array.from({ length: 10 }, (_, i) => String(i + 1));

  const pageWidth = doc.page.width;
  const margin = 36;
  const usableWidth = pageWidth - margin * 2;
  const dayColWidth = 52;
  const lectureColWidth = (usableWidth - dayColWidth) / 10;
  const rowHeight = 44;
  const startX = margin;
  const tableStartY = startY + 22;

  doc.fontSize(18).font('Helvetica-Bold').fillColor('#000000');
  doc.text(`Timetable for Room ${roomId}`, 0, startY, { align: 'center', width: pageWidth });

  if (!days.length) {
    doc.fontSize(11).text('No timetable data available.', 0, tableStartY, { align: 'center', width: pageWidth });
    return 80;
  }

  doc.lineWidth(0.4);

  // Header row
  doc.fontSize(10).font('Helvetica-Bold');
  doc.save();
  doc.rect(startX, tableStartY, dayColWidth, rowHeight).fillAndStroke('#1e3a5f', '#0d2137');
  doc.restore();
  doc.fillColor('#ffffff');
  doc.text('Day', startX + 2, tableStartY + 14, { width: dayColWidth - 4, align: 'center' });

  lectureNos.forEach((lecNo, i) => {
    const x = startX + dayColWidth + lectureColWidth * i;
    doc.save();
    doc.rect(x, tableStartY, lectureColWidth, rowHeight).fillAndStroke('#2563eb', '#1d4ed8');
    doc.restore();
    doc.fillColor('#ffffff');
    doc.text(`L${lecNo}`, x + 2, tableStartY + 14, { width: lectureColWidth - 4, align: 'center' });
  });

  doc.font('Helvetica').fontSize(8).fillColor('#000000');

  days.forEach((day, rowIndex) => {
    const y = tableStartY + rowHeight * (rowIndex + 1);

    if (rowIndex % 2 === 1) {
      doc.save();
      doc.rect(startX, y, dayColWidth + lectureColWidth * 10, rowHeight).fillOpacity(0.06).fill('#000000');
      doc.restore();
    }

    doc.save();
    doc.rect(startX, y, dayColWidth, rowHeight).fillAndStroke('#dbeafe', '#93c5fd');
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(day, startX + 2, y + 14, { width: dayColWidth - 4, align: 'center' });
    doc.font('Helvetica').fontSize(8);

    lectureNos.forEach((lecNo, colIndex) => {
      const x = startX + dayColWidth + lectureColWidth * colIndex;
      const entry = (timetable[day] || {})[lecNo] || {};
      const subjectCode = entry.subjectCode || '';
      const subjectName = entry.subjectName || '';
      const branch = entry.branch || '';
      const section = entry.section || '';
      const teacher = entry.teacher || '';
      const allocatedDept = entry.allocatedDept || '';

      const parts = [];
      if (subjectCode) parts.push(subjectCode);
      if (subjectName) parts.push(subjectName);
      if (branch) parts.push(branch);
      if (section) parts.push(`Sec ${section}`);
      if (teacher) parts.push(teacher);
      let cellText = parts.join('\n');
      if (!cellText && allocatedDept) cellText = `[${allocatedDept}]`;

      doc.rect(x, y, lectureColWidth, rowHeight).stroke();
      doc.fillColor('#1f2937');
      doc.text(cellText, x + 3, y + 4, {
        width: lectureColWidth - 6,
        height: rowHeight - 8,
        align: 'left',
      });
    });
  });

  const tableHeight = rowHeight * (days.length + 1);
  return (tableStartY - startY) + tableHeight + 12;
}

// Save / update a single lecture entry for a room (with permission check)
app.post('/api/rooms/timetable', authenticateUser, async (req, res) => {
  try {
    const { roomId, day, lectureNo, allocatedDept, subjectCode, subjectName, branch, section, teacher } = req.body;
    const user = req.user;

    console.log('Incoming /api/rooms/timetable', {
      roomId,
      day,
      lectureNo,
      allocatedDept,
      subjectCode,
      subjectName,
      branch,
      section,
      teacher,
      userRole: user.role,
      userDept: user.department,
    });

    if (!roomId || !day || !lectureNo) {
      return res.status(400).json({ message: 'roomId, day, and lectureNo are required.' });
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

    const existingEntry = room.timetable[day][lectureNo] || {};

    // Permission check:
    // - Institute incharge can allocate departments (set allocatedDept)
    // - Department incharge can only edit cells allocated to their department
    if (user.role === 'institute_incharge') {
      // Institute incharge can allocate departments and set all fields
      room.timetable[day][lectureNo] = {
        allocatedDept: allocatedDept || existingEntry.allocatedDept || null,
        subjectCode: subjectCode || existingEntry.subjectCode || null,
        subjectName: subjectName || existingEntry.subjectName || null,
        branch: branch || existingEntry.branch || null,
        section: section || existingEntry.section || null,
        teacher: teacher || existingEntry.teacher || null,
      };
    } else if (user.role === 'dept_incharge') {
      // Department incharge can only edit if allocated to their department
      const allocatedDeptForSlot = existingEntry.allocatedDept;
      
      if (!allocatedDeptForSlot) {
        return res.status(403).json({ 
          message: 'This time slot is not allocated to any department. Only institute incharge can allocate slots.' 
        });
      }
      
      if (allocatedDeptForSlot !== user.department) {
        return res.status(403).json({ 
          message: `You can only edit time slots allocated to ${user.department}. This slot is allocated to ${allocatedDeptForSlot}.` 
        });
      }

      // Department incharge can update subject details but not change allocation
      room.timetable[day][lectureNo] = {
        ...existingEntry,
        allocatedDept: allocatedDeptForSlot, // Keep existing allocation
        subjectCode: subjectCode !== undefined ? subjectCode : existingEntry.subjectCode,
        subjectName: subjectName !== undefined ? subjectName : existingEntry.subjectName,
        branch: branch !== undefined ? branch : existingEntry.branch,
        section: section !== undefined ? section : existingEntry.section,
        teacher: teacher !== undefined ? teacher : existingEntry.teacher,
      };
    } else {
      return res.status(403).json({ message: 'Unauthorized role.' });
    }

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
      data: room.timetable[day][lectureNo],
    });
  } catch (err) {
    console.error('Error saving lecture', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// Bulk save: Institute incharge uploads Excel with department allocations
app.post('/api/rooms/timetable/bulk', authenticateUser, async (req, res) => {
  try {
    const { roomId, days, rows } = req.body || {};
    const user = req.user;

    console.log('Incoming /api/rooms/timetable/bulk', {
      roomId,
      daysCount: Array.isArray(days) ? days.length : 0,
      rowsCount: Array.isArray(rows) ? rows.length : 0,
      userRole: user.role,
    });

    // Only institute incharge can do bulk uploads (to allocate departments)
    if (user.role !== 'institute_incharge') {
      return res.status(403).json({
        message: 'Only institute incharge can perform bulk uploads to allocate time slots.',
      });
    }

    if (!roomId || !Array.isArray(days) || !Array.isArray(rows)) {
      return res.status(400).json({
        message: 'roomId, days[], and rows[] are required for bulk save.',
      });
    }

    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId, timetable: {} });
    }

    // Double loop: rows (lectures) x days
    // Expected format: row[day] = { allocatedDept, subjectCode, subjectName, branch, section, teacher }
    // or row[day] = "Department" (just allocation)
    for (const row of rows) {
      const lectureNo = String(row.lectureNo || '');
      if (!lectureNo) continue;

      for (const day of days) {
        const rawCell = row[day];
        if (rawCell == null || rawCell === '') continue;

        if (!room.timetable[day]) {
          room.timetable[day] = {};
        }

        // Handle different cell formats
        if (typeof rawCell === 'string') {
          // Simple string: treat as department allocation only
          room.timetable[day][lectureNo] = {
            allocatedDept: rawCell.trim() || null,
            subjectCode: null,
            subjectName: null,
            branch: null,
            section: null,
            teacher: null,
          };
        } else if (rawCell && typeof rawCell === 'object') {
          // Object with full details
          room.timetable[day][lectureNo] = {
            allocatedDept: rawCell.allocatedDept || null,
            subjectCode: rawCell.subjectCode || null,
            subjectName: rawCell.subjectName || null,
            branch: rawCell.branch || null,
            section: rawCell.section || null,
            teacher: rawCell.teacher || null,
          };
        }

        console.log('Bulk save cell', {
          roomId,
          day,
          lectureNo,
          allocatedDept: room.timetable[day][lectureNo].allocatedDept,
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

    const doc = new PDFDocument({ margin: 36, layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="timetable_all_rooms.pdf"'
    );

    doc.pipe(res);

    const topMarginY = 42;
    const gapBetweenTables = 28;
    let index = 0;

    while (index < roomsWithData.length) {
      const pageHeight = doc.page.height - doc.page.margins.bottom;

      const roomA = roomsWithData[index];
      const { roomId: roomIdA, timetable: timetableA = {} } = roomA;

      if (index > 0) {
        doc.addPage({ layout: 'landscape' });
      }

      const heightA = renderRoomTimetableGrid(doc, roomIdA, timetableA, topMarginY);
      index += 1;

      if (index >= roomsWithData.length) {
        break;
      }

      const roomB = roomsWithData[index];
      const { roomId: roomIdB, timetable: timetableB = {} } = roomB;
      const secondStartY = topMarginY + heightA + gapBetweenTables;

      if (secondStartY + 120 > pageHeight) {
        doc.addPage({ layout: 'landscape' });
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

    const doc = new PDFDocument({ margin: 36, layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="timetable_${roomId}.pdf"`
    );

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



