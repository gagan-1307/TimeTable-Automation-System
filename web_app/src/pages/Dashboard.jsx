import React from 'react';
import { ArrowLeft, Edit, User, Shield, Award, BookOpen, Mail } from 'lucide-react';

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
            <ArrowLeft size={16} />
            Back to PDF Viewer
          </button>
          <button className="btn btnPrimary" type="button" onClick={onEditTimetable}>
            <Edit size={16} />
            Edit Timetable
          </button>
        </div>
      </div>

      <div className="dashboardGrid">
        <div className="dashCard">
          <div className="dashCardTitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} style={{ color: '#a81f1f' }} />
            Admin Profile
          </div>

          <div className="profileGrid">
            <div className="profileField">
              <div className="profileLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} style={{ color: '#64748b' }} />
                Name
              </div>
              <div className="profileValue">{adminProfile?.name || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={12} style={{ color: '#64748b' }} />
                Role
              </div>
              <div className="profileValue">{adminProfile?.role || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={12} style={{ color: '#64748b' }} />
                Post
              </div>
              <div className="profileValue">{adminProfile?.post || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={12} style={{ color: '#64748b' }} />
                Department
              </div>
              <div className="profileValue">{adminProfile?.department || '-'}</div>
            </div>
            <div className="profileField">
              <div className="profileLabel" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={12} style={{ color: '#64748b' }} />
                Admin ID
              </div>
              <div className="profileValue mono">{adminProfile?.id || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
