import React, { useMemo, useState } from 'react';
import { parseTimetableExcel } from '../utils/excelTimetable.js';
import { useTimetableContext } from '../context/TimetableContext.jsx';

const TimetableEdit = () => {
  const { timetableByRoom, updateRoomTimetable } = useTimetableContext();

  const [room, setRoom] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsed, setParsed] = useState(null);

  const knownRooms = useMemo(() => Object.keys(timetableByRoom || {}).sort(), [timetableByRoom]);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setParsed(null);

    const roomName = String(room || '').trim();
    if (!roomName) {
      setParseError('Please enter/select a room before uploading.');
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

  const onSave = () => {
    if (!parsed?.room || !parsed?.rows?.length) return;
    updateRoomTimetable(parsed.room, parsed);
    alert(`Saved timetable for ${parsed.room}`);
  };

  return (
    <div className="timetable-edit">
      <div className="editHeader">
        <div>
          <div className="editTitle">Upload Room Timetable (Excel)</div>
          <div className="editSubtitle">
            Excel format: rows = lecture number, columns = Mon to Fri.
          </div>
        </div>
      </div>

      <div className="editCard">
        <div className="editFormRow">
          <label className="field">
            <div className="fieldLabel">Room</div>
            <input
              className="input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Room 101"
              list="room-suggestions"
            />
            <datalist id="room-suggestions">
              {knownRooms.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>

          <label className="btn btnGhost">
            {isParsing ? 'Parsing…' : 'Upload Excel'}
            <input
              className="visuallyHidden"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={onUpload}
              disabled={isParsing}
            />
          </label>
        </div>

        {parseError ? <div className="error">{parseError}</div> : null}

        {parsed ? (
          <div className="previewBlock">
            <div className="previewHeader">
              <div className="previewMeta">
                <div className="previewTitle">Preview</div>
                <div className="previewSubtitle">
                  Room: <span className="mono">{parsed.room}</span> · File:{' '}
                  <span className="mono">{parsed.fileName}</span> · Sheet:{' '}
                  <span className="mono">{parsed.sheetName}</span>
                </div>
              </div>

              <button className="btn btnPrimary" type="button" onClick={onSave}>
                Save Timetable
              </button>
            </div>

            <div className="tableWrap">
              <table className="ttTable">
                <thead>
                  <tr>
                    <th>Lecture</th>
                    {parsed.days.map((d) => (
                      <th key={d}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, idx) => (
                    <tr key={`${row.lectureNo}-${idx}`}>
                      <td className="mono">{row.lectureNo}</td>
                      {parsed.days.map((d) => (
                        <td key={d}>{row[d]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {knownRooms.length ? (
        <div className="editCard">
          <div className="dashCardTitle">Saved (this session)</div>
          <div className="savedList">
            {knownRooms.map((r) => (
              <div key={r} className="savedItem">
                <div className="savedRoom">{r}</div>
                <div className="savedMeta">
                  {timetableByRoom?.[r]?.rows?.length || 0} lectures
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TimetableEdit;
