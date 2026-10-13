import React, { useState, useEffect } from 'react';

const CellEditor = ({ 
  cellData, 
  isEditable, 
  allocatedDept, 
  userDept, 
  userRole,
  onSave, 
  onClose 
}) => {
  const canEditAllocation = isEditable && userRole === 'institute_incharge';
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    branch: '',
    section: '',
    teacher: '',
    allocatedDept: '',
  });

  useEffect(() => {
    if (cellData) {
      setFormData({
        subjectCode: cellData.subjectCode || '',
        subjectName: cellData.subjectName || '',
        branch: cellData.branch || '',
        section: cellData.section || '',
        teacher: cellData.teacher || '',
        allocatedDept: cellData.allocatedDept || allocatedDept || '',
      });
    }
  }, [cellData, allocatedDept]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="cellEditorModal">
      <div className="cellEditorContent">
        <div className="cellEditorHeader">
          <h3>Edit Time Slot</h3>
          <button className="iconBtn" onClick={onClose}>×</button>
        </div>
        
        {!isEditable && (
          <div className="error" style={{ margin: '10px 16px' }}>
            You can only edit time slots allocated to {userDept || 'your department'}.
            {allocatedDept && allocatedDept !== userDept && (
              <div>This slot is allocated to: <strong>{allocatedDept}</strong></div>
            )}
          </div>
        )}

        <form className="cellEditorForm" onSubmit={handleSubmit}>
          <div className="formGrid">
            <label className="field">
              <div className="fieldLabel">Department Allocation</div>
              <input
                className="input"
                type="text"
                value={formData.allocatedDept}
                onChange={(e) => handleChange('allocatedDept', e.target.value)}
                placeholder="e.g., CSE"
                disabled={!canEditAllocation}
              />
              <div className="fieldHint">Only institute incharge can change this</div>
            </label>

            <label className="field">
              <div className="fieldLabel">Subject Code</div>
              <input
                className="input"
                type="text"
                value={formData.subjectCode}
                onChange={(e) => handleChange('subjectCode', e.target.value)}
                placeholder="e.g., CSPC 302"
                disabled={!isEditable}
              />
            </label>

            <label className="field">
              <div className="fieldLabel">Subject Name</div>
              <input
                className="input"
                type="text"
                value={formData.subjectName}
                onChange={(e) => handleChange('subjectName', e.target.value)}
                placeholder="e.g., Big Data Analytics"
                disabled={!isEditable}
              />
            </label>

            <label className="field">
              <div className="fieldLabel">Branch</div>
              <input
                className="input"
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                placeholder="e.g., CSE"
                disabled={!isEditable}
              />
            </label>

            <label className="field">
              <div className="fieldLabel">Section</div>
              <input
                className="input"
                type="text"
                value={formData.section}
                onChange={(e) => handleChange('section', e.target.value)}
                placeholder="e.g., A1"
                disabled={!isEditable}
              />
            </label>

            <label className="field">
              <div className="fieldLabel">Teacher</div>
              <input
                className="input"
                type="text"
                value={formData.teacher}
                onChange={(e) => handleChange('teacher', e.target.value)}
                placeholder="e.g., Ms. Ruby Chauhan"
                disabled={!isEditable}
              />
            </label>
          </div>

          <div className="cellEditorActions">
            <button className="btn" type="button" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btnPrimary" 
              type="submit"
              disabled={!isEditable}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CellEditor;
