import React, { createContext, useContext, useState } from 'react';

const TimetableContext = createContext();

export const TimetableProvider = ({ children }) => {
  // Shape:
  // {
  //   [roomName: string]: {
  //     meta: { sheetName: string, uploadedAt: number },
  //     days: ['Mon','Tue','Wed','Thu','Fri'],
  //     rows: Array<{ lectureNo: string, Mon: string, Tue: string, Wed: string, Thu: string, Fri: string }>
  //   }
  // }
  const [timetableByRoom, setTimetableByRoom] = useState({});

  const updateRoomTimetable = (room, parsedTimetable) => {
    const key = String(room || '').trim();
    if (!key) return;
    setTimetableByRoom((prev) => ({
      ...prev,
      [key]: {
        ...parsedTimetable,
        meta: {
          sheetName: parsedTimetable?.sheetName || '',
          uploadedAt: Date.now(),
        },
      },
    }));
  };

  return (
    <TimetableContext.Provider value={{ timetableByRoom, updateRoomTimetable }}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetableContext = () => useContext(TimetableContext);
