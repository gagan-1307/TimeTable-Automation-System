const XLSX = require("xlsx");

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // data[0] = ["Day", "1", "2", "3"...]
  const result = [];

  for (let r = 1; r < data.length; r++) {
    const day = data[r][0];

    for (let c = 1; c < data[r].length; c++) {
      const cell = data[r][c];
      if (!cell) continue;

      const [deptSec, subject, teacher] = cell.split("|");
      const [department, section] = deptSec.split("-");

      result.push({
        day,
        lecture_no: c,
        department,
        section,
        subject,
        teacher
      });
    }
  }
  return result;
}

module.exports = parseExcel;
