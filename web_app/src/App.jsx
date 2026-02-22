import React, { useEffect, useMemo, useState } from 'react';
import Footer from './components/common/Footer.jsx';
import TimeTableGrid from './components/timetable/TimeTableGrid.jsx';
import { useAuth } from './hooks/useAuth.js';
import Dashboard from './pages/Dashboard.jsx';
import TimetableEdit from './pages/TimetableEdit.jsx';
import { TimetableProvider } from './context/TimetableContext.jsx';

// Vite-style env var (same base URL used elsewhere)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://timetable-nitkkr.onrender.com';

export default function App() {
  const { isAuthenticated, user, login, logout, checkSession, getAuthHeader } = useAuth();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [pdfObjectUrl, setPdfObjectUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');

  const [activePage, setActivePage] = useState('viewer'); // 'viewer' | 'dashboard' | 'edit'

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const [timetableByRoom, setTimetableByRoom] = useState({});
  const [isTimetableLoading, setIsTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  const roomOptions = useMemo(() => {
    return Object.keys(timetableByRoom || {}).sort();
  }, [timetableByRoom]);

  const departmentOptions = useMemo(() => {
    const deptSet = new Set();
    Object.values(timetableByRoom || {}).forEach((roomTimetable) => {
      Object.values(roomTimetable || {}).forEach((dayEntries) => {
        Object.values(dayEntries || {}).forEach((entry) => {
          const dept = entry?.allocatedDept ? String(entry.allocatedDept).trim() : '';
          if (dept) deptSet.add(dept);
        });
      });
    });
    return Array.from(deptSet).sort();
  }, [timetableByRoom]);

  const teacherOptions = useMemo(() => {
    const teacherSet = new Set();
    Object.values(timetableByRoom || {}).forEach((roomTimetable) => {
      Object.values(roomTimetable || {}).forEach((dayEntries) => {
        Object.values(dayEntries || {}).forEach((entry) => {
          const teacher = entry?.teacher ? String(entry.teacher).trim() : '';
          if (teacher) teacherSet.add(teacher);
        });
      });
    });
    return Array.from(teacherSet).sort();
  }, [timetableByRoom]);

  const canAdminLogin = true;
  const adminProfile = useMemo(() => {
    if (!user) return null;
    const isInstitute = user.role === 'institute_incharge';
    return {
      id: user.email,
      name: user.name,
      post: isInstitute ? 'Institute Timetable In-charge' : 'Department Timetable In-charge',
      role: isInstitute ? 'Institute Incharge' : 'Department Incharge',
      department: user.department || '-',
    };
  }, [user]);

  useEffect(() => {
    checkSession();
  }, []);

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

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await login(loginId.trim(), password);
      setActivePage('dashboard');
      onCloseLogin();
    } catch (err) {
      setLoginError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const viewerSrc = useMemo(() => {
    return pdfObjectUrl || '';
  }, [pdfObjectUrl]);

  // Automatically load the generated timetable PDF from the backend
  useEffect(() => {
    // Only try to load when on the viewer page
    if (activePage !== 'viewer') return;

    let cancelled = false;

    const loadTimetablePdf = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rooms/timetable/pdf`, {
          method: 'GET',
        });

        if (!res.ok) {
          // Quietly ignore 404 (no data yet), log other errors
          if (res.status !== 404) {
            const errText = await res.text();
            console.error('Failed to auto-load timetable PDF:', errText);
          }
          return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        if (cancelled) {
          window.URL.revokeObjectURL(url);
          return;
        }

        setPdfFileName('Timetable (all rooms)');
        setPdfObjectUrl((prev) => {
          if (prev) window.URL.revokeObjectURL(prev);
          return url;
        });
      } catch (err) {
        console.error('Error auto-loading timetable PDF', err);
      }
    };

    loadTimetablePdf();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'viewer') return;

    let cancelled = false;
    const loadTimetables = async () => {
      setIsTimetableLoading(true);
      setTimetableError('');
      try {
        const roomsRes = await fetch(`${API_BASE_URL}/api/rooms`, { method: 'GET' });
        if (!roomsRes.ok) {
          const errText = await roomsRes.text();
          throw new Error(errText || `Error ${roomsRes.status}`);
        }

        const roomsData = await roomsRes.json();
        const roomIds = (roomsData.rooms || []).filter(Boolean);

        if (!roomIds.length) {
          if (!cancelled) setTimetableByRoom({});
          return;
        }

        const results = await Promise.all(
          roomIds.map(async (roomId) => {
            try {
              const res = await fetch(
                `${API_BASE_URL}/api/rooms/${encodeURIComponent(roomId)}/timetable`,
                { method: 'GET' }
              );
              if (!res.ok) return [roomId, {}];
              const data = await res.json();
              return [roomId, data.timetable || {}];
            } catch (err) {
              console.error('Failed to fetch timetable for room', roomId, err);
              return [roomId, {}];
            }
          })
        );

        if (!cancelled) {
          const nextMap = {};
          results.forEach(([roomId, timetable]) => {
            nextMap[roomId] = timetable || {};
          });
          setTimetableByRoom(nextMap);
        }
      } catch (err) {
        if (!cancelled) {
          setTimetableError(err?.message || 'Failed to load timetables.');
        }
      } finally {
        if (!cancelled) setIsTimetableLoading(false);
      }
    };

    loadTimetables();

    return () => {
      cancelled = true;
    };
  }, [activePage]);

  const onDownloadAllTimetablesPdf = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/timetable/pdf`, {
        method: 'GET',
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Backend error (${res.status}): ${errText}`);
      }

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
      console.error('Failed to download all timetables PDF', err);
      alert(
        `Failed to download all timetables PDF: ${err?.message || 'Unknown error'}`
      );
    }
  };

  const onDownloadTeacherSchedulePdf = async () => {
    const teacher = (selectedTeacher || '').trim();
    if (!teacher) {
      alert('Please select a teacher from the filter to download their schedule.');
      return;
    }
    try {
      const url = `${API_BASE_URL}/api/teachers/timetable/pdf?teacher=${encodeURIComponent(teacher)}`;
      const res = await fetch(url, { method: 'GET' });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Error ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `schedule_${teacher.replace(/[^a-zA-Z0-9\s.-]/g, '_').replace(/\s+/g, '_').slice(0, 40)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download teacher schedule PDF', err);
      alert(`Failed to download teacher schedule: ${err?.message || 'Unknown error'}`);
    }
  };

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
                <div className="headerAuthId" title={user?.email}>
                  {user?.name} ({user?.role === 'institute_incharge' ? 'Institute' : user?.department})
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
              <TimetableEdit getAuthHeader={getAuthHeader} user={user} />
            </div>
          ) : activePage === 'dashboard' && isAuthenticated ? (
            <Dashboard
              adminProfile={adminProfile}
              onEditTimetable={() => setActivePage('edit')}
              onBackToViewer={() => setActivePage('viewer')}
            />
          ) : (
            <>
              <div className="pdfCard">
              <div className="pdfCardHeader">
                <div className="pdfMeta">
                  <div className="pdfTitle">Displayed PDF</div>
                  <div className="pdfSubtitle">{pdfFileName || 'No PDF selected yet.'}</div>
                </div>

                <div className="pdfHeaderControls">
                  <div className="filterRow" aria-label="Timetable filters">
                    <label className="filterField">
                      <div className="filterLabel">Department</div>
                      <select
                        className="select"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="">All</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
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
                        {roomOptions.map((room) => (
                          <option key={room} value={room}>
                            {room}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filterField">
                      <div className="filterLabel">Teacher</div>
                      <select
                        className="select"
                        value={selectedTeacher}
                        onChange={(e) => setSelectedTeacher(e.target.value)}
                      >
                        <option value="">All</option>
                        {teacherOptions.map((teacher) => (
                          <option key={teacher} value={teacher}>
                            {teacher}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="pdfHeaderButtons">
                    {isAuthenticated && (
                      <label className="btn btnGhost">
                        Choose PDF
                        <input
                          className="visuallyHidden"
                          type="file"
                          accept="application/pdf"
                          onChange={onPickPdf}
                        />
                      </label>
                    )}
                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={onDownloadAllTimetablesPdf}
                    >
                      Download All Timetables (PDF)
                    </button>
                    <button
                      className="btn btnGhost"
                      type="button"
                      onClick={onDownloadTeacherSchedulePdf}
                      disabled={!selectedTeacher}
                      title={selectedTeacher ? `Download timetable for ${selectedTeacher}` : 'Select a teacher first'}
                    >
                      Download Teacher Schedule (PDF)
                    </button>
                  </div>
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

              <div className="editCard" style={{ marginTop: 16 }}>
              <div className="previewHeader">
                <div className="previewMeta">
                  <div className="previewTitle">Timetable Browser</div>
                  <div className="previewSubtitle">
                    Filter by department, room, or teacher. Non-matching entries are hidden.
                  </div>
                </div>
              </div>

              <TimeTableGrid
                timetableByRoom={timetableByRoom}
                selectedRoom={selectedRoom}
                selectedDepartment={selectedDepartment}
                selectedTeacher={selectedTeacher}
                loading={isTimetableLoading}
                error={timetableError}
              />
              </div>
            </>
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
                  <button className="btn" type="button" onClick={onCloseLogin} disabled={isLoggingIn}>
                    Cancel
                  </button>
                  <button className="btn btnPrimary" type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? 'Logging in…' : 'Login'}
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


