import React from 'react';

const DepartmentFilter = () => {
  return (
    <div className="department-filter">
      <label>Department:</label>
      <select>
        <option value="">All</option>
        {/* Department options */}
      </select>
    </div>
  );
};

export default DepartmentFilter;
