module.exports = (sequelize, DataTypes) => {
  return sequelize.define("Timetable", {
    room_id: DataTypes.INTEGER,
    day: DataTypes.STRING,
    lecture_no: DataTypes.INTEGER,
    department: DataTypes.STRING,
    section: DataTypes.STRING,
    subject: DataTypes.STRING,
    teacher: DataTypes.STRING
  });
};
