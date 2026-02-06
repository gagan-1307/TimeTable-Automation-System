import React, { useMemo } from 'react';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const LECTURE_NOS = Array.from({ length: 10 }, (_, i) => String(i + 1));

const formatEntry = (entry) => {
  if (!entry) return '';
  const parts = [];
  if (entry.subjectCode) parts.push(String(entry.subjectCode));
  if (entry.subjectName) parts.push(String(entry.subjectName));
  if (entry.teacher) parts.push(String(entry.teacher));
  if (entry.branch) parts.push(String(entry.branch));
  if (entry.section) parts.push(String(entry.section));
  if (parts.length) return parts.join(' · ');
  return entry.allocatedDept ? String(entry.allocatedDept) : '';
};

const TimeTableGrid = ({
  timetableByRoom,
  selectedRoom,
  selectedDepartment,
  selectedTeacher,
  loading,
  error,
}) => {
  const roomIds = useMemo(() => {
    const rooms = Object.keys(timetableByRoom || {}).sort();
    if (selectedRoom) {
      return rooms.includes(selectedRoom) ? [selectedRoom] : [];
    }
    return rooms;
  }, [timetableByRoom, selectedRoom]);

  const hasFilters = Boolean(selectedDepartment || selectedTeacher);

  if (loading) {
    return <div className="pdfEmpty">Loading timetables…</div>;
  }

  if (error) {
    return <div className="error">Failed to load timetables: {error}</div>;
  }

  if (!roomIds.length) {
    return <div className="pdfEmpty">No timetable data available.</div>;
  }

  return (
    <div className="previewBlock">
      {roomIds.map((roomId) => {
        const timetable = timetableByRoom[roomId] || {};
        return (
          <div key={roomId} className="previewBlock">
            <div className="previewTitle">Room: {roomId}</div>
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
                        const entry = (timetable[day] || {})[lecNo] || null;
                        const dept = entry?.allocatedDept ? String(entry.allocatedDept) : '';
                        const teacher = entry?.teacher ? String(entry.teacher) : '';
                        const matchesDept = !selectedDepartment || dept === selectedDepartment;
                        const matchesTeacher = !selectedTeacher || teacher === selectedTeacher;
                        const matchesFilters = matchesDept && matchesTeacher && entry;
                        const cellText = !hasFilters
                          ? formatEntry(entry)
                          : matchesFilters
                            ? formatEntry(entry)
                            : '';

                        return <td key={lecNo}>{cellText}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeTableGrid;
