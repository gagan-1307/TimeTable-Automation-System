import { useState } from "react";
import * as XLSX from "xlsx";

function App() {
  const [data, setData] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const binaryData = evt.target.result;
      const workbook = XLSX.read(binaryData, { type: "binary" });

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setData(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Excel File Reader</h2>

      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />

      {data.length > 0 && (
        <table border="1" cellPadding="8" style={{ marginTop: "20px" }}>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
