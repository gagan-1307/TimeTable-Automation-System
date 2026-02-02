import React, { createContext, useContext, useState } from 'react';

const TimetableContext = createContext();

export const TimetableProvider = ({ children }) => {
  const [timetable, setTimetable] = useState([]);

  const updateTimetable = (newTimetable) => {
    setTimetable(newTimetable);
  };

  return (
    <TimetableContext.Provider value={{ timetable, updateTimetable }}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetableContext = () => useContext(TimetableContext);
