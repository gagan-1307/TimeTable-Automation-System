import React, { useMemo, useState, useEffect } from 'react';
import { parseTimetableExcel } from '../utils/excelTimetable.js';
import CellEditor from '../components/timetable/CellEditor.jsx';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const LECTURE_NOS = Array.from({ length: 10 }, (_, i) => String(i + 1));

function formatCellDisplay(entry) {
  if (!entry) return '';
  const parts = [];
  if (entry.subjectCode) parts.push(entry.subjectCode);
  if (entry.subjectName) parts.push(entry.subjectName);
  if (entry.teacher) parts.push(entry.teacher);
  if (parts.length) return parts.join(' · ');
  if (entry.allocatedDept) return `[${entry.allocatedDept}]`;
  return '';
}

const TimetableEdit = ({ getAuthHeader, user: propUser }) => {
  const user = propUser || null;

  const [room, setRoom] = useState('');
  const [roomList, setRoomList] = useState([]);
  const [roomTimetable, setRoomTimetable] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsed, setParsed] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [savingCell, setSavingCell] = useState(false);

  const authHeader = getAuthHeader ? getAuthHeader() : '';

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms`);
        if (res.ok) {
          const data = await res.json();
          setRoomList(data.rooms || []);
        }
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (!room?.trim()) {
      setRoomTimetable(null);
      return;
    }
    let cancelled = false;
    setLoadingRoom(true);
    fetch(`${API_BASE_URL}/api/rooms/${encodeURIComponent(room.trim())}/timetable`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setRoomTimetable(data.timetable || {});
        else if (!cancelled) setRoomTimetable({});
      })
      .catch(() => {
        if (!cancelled) setRoomTimetable({});
      })
      .finally(() => {
        if (!cancelled) setLoadingRoom(false);
      });
    return () => { cancelled = true; };
  }, [room]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setParsed(null);

    const roomName = String(room || '').trim();
    if (!roomName) {
      setParseError('Please enter or select a room before uploading.');
      e.target.value = '';
      return;
    }

    try {
      setIsParsing(true);
      const result = await parseTimetableExcel(file);
      setParsed({ ...result, fileName: file.name, room: roomName });
    } catch (err) {
      setParseError(err?.message || 'Failed to parse Excel file.');
    } finally {
      setIsParsing(false);
      e.target.value = '';
    }
  };

  const onBulkSave = async () => {
    if (!parsed?.room || !parsed?.rows?.length) return;
    if (!authHeader) {
      alert('You must be logged in to save.');
      return;
    }

    const payload = {
      roomId: parsed.room,
      days: parsed.days,
      rows: parsed.rows,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/timetable/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${res.status}`);
      }
      alert(`Timetable for ${parsed.room} saved. You can now assign subject details by clicking cells.`);
      setRoomTimetable(null);
      setRoom(parsed.room);
      setParsed(null);
      const refetch = await fetch(`${API_BASE_URL}/api/rooms/${encodeURIComponent(parsed.room)}/timetable`);
      if (refetch.ok) {
        const data = await refetch.json();
        setRoomTimetable(data.timetable || {});
      }
    } catch (err) {
      alert(err?.message || 'Failed to save timetable.');
    }
  };

  const onSaveCell = async (formData) => {
    if (!editingCell || !room?.trim() || !authHeader) return;
    setSavingCell(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          roomId: room.trim(),
          day: editingCell.day,
          lectureNo: editingCell.lectureNo,
          allocatedDept: formData.allocatedDept || null,
          subjectCode: formData.subjectCode || null,
          subjectName: formData.subjectName || null,
          branch: formData.branch || null,
          section: formData.section || null,
          teacher: formData.teacher || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${res.status}`);
      }
      setEditingCell(null);
      const refetch = await fetch(`${API_BASE_URL}/api/rooms/${encodeURIComponent(room.trim())}/timetable`);
      if (refetch.ok) {
        const data = await refetch.json();
        setRoomTimetable(data.timetable || {});
      }
    } catch (err) {
      alert(err?.message || 'Failed to save cell.');
    } finally {
      setSavingCell(false);
    }
  };

  const onDownloadPdf = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/timetable/pdf`, { method: 'GET' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'timetable_all_rooms.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.message || 'Failed to download PDF.');
    }
  };

  const isInstituteIncharge = user?.role === 'institute_incharge';
  const canBulkUpload = isInstituteIncharge;

  const displayTimetable = useMemo(() => {
    if (roomTimetable && Object.keys(roomTimetable).length > 0) {
      return roomTimetable;
    }
    if (parsed?.rows?.length) {
      const grid = {};
      DAY_ORDER.forEach((d) => (grid[d] = {}));
      parsed.rows.forEach((row) => {
        const lecNo = String(row.lectureNo || '');
        DAY_ORDER.forEach((day) => {
          const val = row[day];
          if (val) {
            grid[day][lecNo] = { allocatedDept: String(val).trim(), subjectCode: null, subjectName: null, branch: null, section: null, teacher: null };
          }
        });
      });
      return grid;
    }
    return null;
  }, [roomTimetable, parsed]);

  const getCellEntry = (day, lecNo) => {
    if (!displayTimetable) return null;
    return (displayTimetable[day] || {})[lecNo] || null;
  };

  const isCellEditable = (day, lecNo) => {
    if (!user) return false;
    if (isInstituteIncharge) return true;
    if (user.role !== 'dept_incharge') return false;
    const entry = getCellEntry(day, lecNo);
    return entry && entry.allocatedDept === user.department;
  };

  return (
    <div className="timetable-edit">
      <div className="editHeader">
        <div>
          <div className="editTitle">Edit Room Timetable</div>
          <div className="editSubtitle">
            Institute incharge: upload Excel to allocate time slots to departments (cell = department code). Department incharge: click your allocated cells to set subject code, subject, branch, section, teacher.
          </div>
        </div>
      </div>

      <div className="editCard">
        <div className="editFormRow">
          <label className="field">
            <div className="fieldLabel">Room</div>
            <input
              className="input"
              list="room-suggestions"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Room 101"
            />
            <datalist id="room-suggestions">
              {roomList.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>

          {canBulkUpload && (
            <label className="btn btnGhost">
              {isParsing ? 'Parsing…' : 'Upload Excel (allocate departments)'}
              <input
                className="visuallyHidden"
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={onUpload}
                disabled={isParsing}
              />
            </label>
          )}
        </div>

        {parseError && <div className="error">{parseError}</div>}

        {parsed && canBulkUpload && (
          <div className="previewBlock" style={{ marginTop: 12 }}>
            <div className="previewHeader">
              <div className="previewMeta">
                <div className="previewTitle">Preview — Room: {parsed.room}</div>
                <div className="previewSubtitle">File: {parsed.fileName}. Each cell value will be saved as department allocation.</div>
              </div>
              <div className="previewActions">
                <button className="btn btnPrimary" type="button" onClick={onBulkSave}>
                  Save allocations to room
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(displayTimetable || loadingRoom) && (
        <div className="editCard">
          <div className="previewHeader">
            <div className="previewMeta">
              <div className="previewTitle">Timetable — {room}</div>
              <div className="previewSubtitle">
                {user?.role === 'institute_incharge' ? 'Click any cell to edit.' : `Click only cells allocated to ${user?.department || 'your department'} to edit.`}
              </div>
            </div>
            <button className="btn btnGhost" type="button" onClick={onDownloadPdf}>
              Download PDF
            </button>
          </div>

          {loadingRoom ? (
            <div className="pdfEmpty">Loading…</div>
          ) : (
            <div className="tableWrap">
              <table className="ttTable">
                <thead>
                  <tr>
                    <th className="ttDayHeader">Day</th>
                    {LECTURE_NOS.map((lecNo) => (
                      <th key={lecNo} className="ttLectureHeader">L{lecNo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAY_ORDER.map((day) => (
                    <tr key={day}>
                      <td className="ttDayCell">{day}</td>
                      {LECTURE_NOS.map((lecNo) => {
                        const entry = getCellEntry(day, lecNo);
                        const editable = isCellEditable(day, lecNo);
                        const display = formatCellDisplay(entry);
                        return (
                          <td
                            key={lecNo}
                            className={editable ? 'ttCellEditable' : 'ttCellLocked'}
                            onClick={() => editable && setEditingCell({ day, lectureNo: lecNo, entry })}
                            title={editable ? 'Click to edit' : entry?.allocatedDept ? `Allocated to ${entry.allocatedDept}` : ''}
                          >
                            {display || (editable ? '—' : '')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingCell && (
        <CellEditor
          cellData={editingCell.entry}
          allocatedDept={editingCell.entry?.allocatedDept}
          userDept={user?.department}
          userRole={user?.role}
          isEditable={isCellEditable(editingCell.day, editingCell.lectureNo)}
          onSave={(formData) => onSaveCell(formData)}
          onClose={() => !savingCell && setEditingCell(null)}
        />
      )}
    </div>
  );
};

export default TimetableEdit;
