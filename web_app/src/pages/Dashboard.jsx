import React from 'react';

const Dashboard = ({ adminProfile, onEditTimetable, onBackToViewer }) => {
  return (
    <div className="dashboard">
      <div className="dashboardHeader">
        <div>
          <div className="dashboardTitle">Admin Dashboard</div>
          <div className="dashboardSubtitle">Manage timetable and view your profile</div>
        </div>

        <div className="dashboardHeaderActions">
          <button className="btn" type="button" onClick={onBackToViewer}>
            Back to PDF Viewer
          </button>
          <button className="btn btnPrimary" type="button" onClick={onEditTimetable}>
            Edit Timetable
          </button>
        </div>
      </div>

      <div className="dashboardGrid">
        <div className="dashCard">
          <div className="dashCardTitle">Admin Profile</div>

          <div className="profileGrid">
            <div className="profileField">
              <div className="profileLabel">Name</div>
              <div className="profileValue">{adminProfile?.name || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel">Role</div>
              <div className="profileValue">{adminProfile?.role || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel">Post</div>
              <div className="profileValue">{adminProfile?.post || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel">Department</div>
              <div className="profileValue">{adminProfile?.department || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel">Admin ID</div>
              <div className="profileValue mono">{adminProfile?.id || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
