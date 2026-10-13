import * as XLSX from 'xlsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function normalizeCell(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function normalizeDayFromCell(v) {
  const s = normalizeCell(v).toLowerCase();
  if (!s) return '';
  if (s.startsWith('mon')) return 'Mon';
  if (s.startsWith('tue')) return 'Tue';
  if (s.startsWith('wed')) return 'Wed';
  if (s.startsWith('thu')) return 'Thu';
  if (s.startsWith('fri')) return 'Fri';
  return '';
}

/** Check if a header cell is a lecture column (Lecture 1, L1, 1, etc.) */
function parseLectureHeader(cell) {
  const s = normalizeCell(cell).toLowerCase();
  if (!s) return null;
  const match = s.match(/^(?:lecture\s*)?(?:l\s*)?(\d+)$/);
  if (match) return match[1];
  if (/^\d+$/.test(s)) return s;
  return null;
}

/**
 * Institute format: Days in ROWS, Lectures in COLUMNS.
 * - Row 1 (header): "Day" | "Lecture 1" | "Lecture 2" | ... | "Lecture 10"
 * - Row 2+: "Monday" | IT | Robotics | IT | CSE | ...
 *
 * Returns same shape as before for API: days, rows (one per lecture with Mon/Tue/... keys).
 */
function parseDaysInRowsLecturesInColumns(data) {
  const header = data[0];
  if (!header || header.length < 2) return null;

  const firstCell = normalizeCell(header[0]).toLowerCase();
  if (!firstCell.includes('day')) return null;

  const lectureColToNumber = new Map();
  for (let col = 1; col < header.length; col++) {
    const lecNo = parseLectureHeader(header[col]);
    if (lecNo) lectureColToNumber.set(col, lecNo);
  }
  if (lectureColToNumber.size < 3) return null;

  const dayOrder = [];
  const byDay = {};

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const dayCell = normalizeCell(row[0]);
    const day = normalizeDayFromCell(dayCell);
    if (!day) continue;

    dayOrder.push(day);
    byDay[day] = {};

    lectureColToNumber.forEach((lecNo, col) => {
      const value = normalizeCell(row[col]);
      if (value) byDay[day][lecNo] = value;
    });
  }

  if (dayOrder.length === 0) return null;

  const allLectureNos = [...new Set(lectureColToNumber.values())].sort(
    (a, b) => Number(a) - Number(b)
  );

  const rows = allLectureNos.map((lectureNo) => {
    const row = { lectureNo };
    DAYS.forEach((d) => {
      row[d] = byDay[d] && byDay[d][lectureNo] ? byDay[d][lectureNo] : '';
    });
    return row;
  });

  return {
    sheetName: null,
    days: DAYS,
    rows,
  };
}

/**
 * Legacy format: Rows = lectures, Columns = days (Mon..Fri).
 * Kept for backwards compatibility.
 */
function parseLecturesInRowsDaysInColumns(data) {
  const header = data[0];
  const dayToCol = new Map();
  header.forEach((cell, idx) => {
    const d = normalizeDayFromCell(cell);
    if (d) dayToCol.set(d, idx);
  });
  const hasDayHeaders = dayToCol.size >= 3;
  let startRow = 0;
  let lectureCol = -1;
  if (hasDayHeaders) {
    startRow = 1;
    header.forEach((cell, idx) => {
      const s = normalizeCell(cell).toLowerCase();
      if (s.includes('lecture') || s.includes('lec') || s.includes('period'))
        lectureCol = idx;
    });
  }

  const grid = [];
  for (let r = startRow; r < data.length; r++) {
    const row = data[r];
    const lectureRaw = lectureCol >= 0 ? row[lectureCol] : String(r - startRow + 1);
    const lectureNo = normalizeCell(lectureRaw) || String(r - startRow + 1);
    const byDay = {};
    DAYS.forEach((d, i) => {
      const col = hasDayHeaders ? dayToCol.get(d) : i;
      byDay[d] = col !== undefined && col !== null ? normalizeCell(row[col]) : '';
    });
    const hasAny = DAYS.some((d) => byDay[d] !== '');
    if (!hasAny) continue;
    grid.push({ lectureNo, ...byDay });
  }
  if (grid.length === 0) return null;
  return { sheetName: null, days: DAYS, rows: grid };
}

/**
 * Parses an Excel timetable file.
 * Primary format: Days in ROWS, Lectures in COLUMNS (institute format).
 * Fallback: Lectures in rows, days in columns.
 */
export async function parseTimetableExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) throw new Error('No sheets found in the Excel file.');
  const ws = wb.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  const data = rows
    .map((r) => (Array.isArray(r) ? r : []).map(normalizeCell))
    .filter((r) => r.some((c) => c !== ''));

  if (data.length === 0) throw new Error('Excel sheet is empty.');

  let result = parseDaysInRowsLecturesInColumns(data);
  if (result) {
    result.sheetName = sheetName;
    return result;
  }

  result = parseLecturesInRowsDaysInColumns(data);
  if (result) {
    result.sheetName = sheetName;
    return result;
  }

  throw new Error(
    'Could not parse timetable. Expected format: first row "Day" | "Lecture 1" … "Lecture 10", then one row per day (Monday, Tuesday, …) with department/subject codes in each column.'
  );
}
