import React, { useMemo, useState } from 'react';
import './App.css';
import Footer from './components/common/Footer.jsx';
import { useAuth } from './hooks/useAuth.js';
import Dashboard from './pages/Dashboard.jsx';
import TimetableEdit from './pages/TimetableEdit.jsx';
import { TimetableProvider } from './context/TimetableContext.jsx';

export default function App() {
  const { isAuthenticated, adminId, login, logout } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [pdfObjectUrl, setPdfObjectUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  const [activePage, setActivePage] = useState('viewer'); // 'viewer' | 'dashboard' | 'edit'

  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // NOTE: These can be replaced with real data from src/data/* when available.
  const branchOptions = useMemo(
    () => ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'],
    []
  );
  const roomOptions = useMemo(
    () => ['Room 101', 'Room 102', 'Lab 1', 'Lab 2', 'Seminar Hall'],
    []
  );
  const subjectOptions = useMemo(
    () => ['Mathematics', 'Data Structures', 'DBMS', 'Operating Systems', 'Networks'],
    []
  );

  const canAdminLogin = true;
  const adminProfile = useMemo(() => {
    // NOTE: sample values for now — replace with real admin profile data later.
    if (!adminId) return null;
    return {
      id: adminId,
      name: 'Admin User',
      post: 'Timetable In-charge',
      role: 'Administrator',
      department: 'CSE',
    };
  }, [adminId]);

  const onPickPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      e.target.value = '';
      return;
    }

    setPdfFileName(file.name);
    setPdfObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const onOpenLogin = () => {
    setIsLoginOpen(true);
    setLoginId('');
    setPassword('');
    setLoginError('');
  };

  const onCloseLogin = () => {
    setIsLoginOpen(false);
    setLoginId('');
    setPassword('');
    setLoginError('');
  };

  const onSubmitLogin = (e) => {
    e.preventDefault();
    const ok = login(loginId.trim(), password);
    if (ok) {
      setActivePage('dashboard');
      onCloseLogin();
      return;
    }
    setLoginError('Invalid Admin ID or Password.');
  };

  const viewerSrc = useMemo(() => {
    return pdfObjectUrl || '';
  }, [pdfObjectUrl]);

  const onLogout = () => {
    logout();
    setActivePage('viewer');
  };

  return (
    <TimetableProvider>
      <div className="app">
        <header className="appHeader">
          <div className="appTitle">Timetable PDF Viewer</div>

          <div className="appHeaderRight">
            {isAuthenticated ? (
              <div className="headerAuth">
                <div className="headerAuthId" title={adminId}>
                  {adminId}
                </div>
                <button className="btn" type="button" onClick={onLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <button
                className="btn btnPrimary"
                type="button"
                onClick={onOpenLogin}
                disabled={!canAdminLogin}
              >
                Admin Login
              </button>
            )}
          </div>
        </header>

        <main className="appMain">
          {activePage === 'edit' && isAuthenticated ? (
            <div className="pageShell">
              <div className="pageShellHeader">
                <button className="btn" type="button" onClick={() => setActivePage('dashboard')}>
                  ← Back to Dashboard
                </button>
                <div className="pageShellTitle">Edit Timetable</div>
              </div>
              <TimetableEdit />
            </div>
          ) : activePage === 'dashboard' && isAuthenticated ? (
            <Dashboard
              adminProfile={adminProfile}
              onEditTimetable={() => setActivePage('edit')}
              onBackToViewer={() => setActivePage('viewer')}
            />
          ) : (
            <div className="pdfCard">
              <div className="pdfCardHeader">
                <div className="pdfMeta">
                  <div className="pdfTitle">Displayed PDF</div>
                  <div className="pdfSubtitle">{pdfFileName || 'No PDF selected yet.'}</div>
                </div>

                <div className="pdfHeaderControls">
                  <div className="filterRow" aria-label="Filters">
                    <label className="filterField">
                      <div className="filterLabel">Branch</div>
                      <select
                        className="select"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                      >
                        <option value="">All</option>
                        {branchOptions.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filterField">
                      <div className="filterLabel">Room</div>
                      <select
                        className="select"
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                      >
                        <option value="">All</option>
                        {roomOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filterField">
                      <div className="filterLabel">Subject</div>
                      <select
                        className="select"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        <option value="">All</option>
                        {subjectOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {isAuthenticated ? (
                    <label className="btn btnGhost">
                      Choose PDF
                      <input
                        className="visuallyHidden"
                        type="file"
                        accept="application/pdf"
                        onChange={onPickPdf}
                      />
                    </label>
                  ) : (
                    <div className="pdfHint">Login as admin to upload a PDF.</div>
                  )}
                </div>
              </div>

              <div className="pdfViewer">
                {viewerSrc ? (
                  <iframe title="PDF Viewer" className="pdfFrame" src={viewerSrc} />
                ) : (
                  <div className="pdfEmpty">Select a PDF (admin) to display it here.</div>
                )}
              </div>
            </div>
          )}
        </main>

        <Footer />

        {isLoginOpen ? (
          <div className="modalOverlay" role="dialog" aria-modal="true" aria-label="Admin Login">
            <div className="modal">
              <div className="modalHeader">
                <div className="modalTitle">Admin Login</div>
                <button className="iconBtn" type="button" onClick={onCloseLogin} aria-label="Close">
                  ×
                </button>
              </div>

              <form className="modalBody" onSubmit={onSubmitLogin}>
                <label className="field">
                  <div className="fieldLabel">Admin ID</div>
                  <input
                    className="input"
                    type="email"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    autoFocus
                    placeholder="123103054@nitkkr.ac.in"
                  />
                </label>

                <label className="field">
                  <div className="fieldLabel">Password</div>
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="9499276265"
                  />
                </label>

                {loginError ? <div className="error">{loginError}</div> : null}

                <div className="modalActions">
                  <button className="btn" type="button" onClick={onCloseLogin}>
                    Cancel
                  </button>
                  <button className="btn btnPrimary" type="submit">
                    Login
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </TimetableProvider>
  );
}


