import React, { useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import TimetableEdit from './pages/TimetableEdit.jsx';
import Footer from './components/common/Footer.jsx';
import { TimetableProvider } from './context/TimetableContext.jsx';

export default function App() {
  const [page, setPage] = useState('dashboard');

  const content = useMemo(() => {
    if (page === 'timetable') return <TimetableEdit />;
    return <Dashboard />;
  }, [page]);

  return (
    <TimetableProvider>
      <div className="app">
        <header className="appHeader">
          <div className="appTitle">Timetable</div>
          <nav className="appNav" aria-label="Primary">
            <button
              type="button"
              className={page === 'dashboard' ? 'active' : ''}
              onClick={() => setPage('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={page === 'timetable' ? 'active' : ''}
              onClick={() => setPage('timetable')}
            >
              Edit timetable
            </button>
          </nav>
        </header>

        <main className="appMain">{content}</main>

        <Footer />
      </div>
    </TimetableProvider>
  );
}


