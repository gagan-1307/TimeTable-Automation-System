import React from 'react';

const RoomFilter = () => {
  return (
    <div className="room-filter">
      <label>Room:</label>
      <select>
        <option value="">All</option>
        {/* Room options */}
      </select>
    </div>
  );
};

export default RoomFilter;
