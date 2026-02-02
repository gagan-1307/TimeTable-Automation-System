import * as XLSX from 'xlsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function normalizeCell(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

function normalizeDayHeader(v) {
  const s = normalizeCell(v).toLowerCase();
  if (!s) return '';
  if (s.startsWith('mon')) return 'Mon';
  if (s.startsWith('tue')) return 'Tue';
  if (s.startsWith('wed')) return 'Wed';
  if (s.startsWith('thu')) return 'Thu';
  if (s.startsWith('fri')) return 'Fri';
  return '';
}

/**
 * Parses an Excel file into a timetable grid:
 * - Rows: lecture number (1..N)
 * - Columns: Mon..Fri
 *
 * Supported sheet formats:
 * A) Header row with day names in columns (Mon..Fri), optional first column "Lecture"/"Lec No"
 * B) No headers: first 5 columns are assumed Mon..Fri, and lecture number is row index
 */
export async function parseTimetableExcel(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames?.[0];
  if (!sheetName) throw new Error('No sheets found in the Excel file.');
  const ws = wb.Sheets[sheetName];

  // 2D array of cell values
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
  const data = rows
    .map((r) => (Array.isArray(r) ? r : []).map(normalizeCell))
    .filter((r) => r.some((c) => c !== ''));

  if (data.length === 0) throw new Error('Excel sheet is empty.');

  // Try to detect a header row containing day names.
  const header = data[0];
  const dayToCol = new Map();
  header.forEach((cell, idx) => {
    const d = normalizeDayHeader(cell);
    if (d) dayToCol.set(d, idx);
  });

  const hasDayHeaders = dayToCol.size >= 3; // tolerate imperfect headers

  let startRow = 0;
  let lectureCol = -1;
  if (hasDayHeaders) {
    startRow = 1;
    header.forEach((cell, idx) => {
      const s = normalizeCell(cell).toLowerCase();
      if (s.includes('lecture') || s.includes('lec') || s.includes('period')) {
        lectureCol = idx;
      }
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

    // Skip fully empty timetable rows
    const hasAny = DAYS.some((d) => byDay[d] !== '');
    if (!hasAny) continue;

    grid.push({ lectureNo, ...byDay });
  }

  if (grid.length === 0) {
    throw new Error('No timetable entries found. Ensure columns are Mon–Fri and rows contain lectures.');
  }

  return {
    sheetName,
    days: DAYS,
    rows: grid,
  };
}


