import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

interface ExcelColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string | number;
}

/**
 * Export data ra file Excel.
 * @param columns - Dinh nghia cot { title, dataIndex, render? }
 * @param data - Mang du lieu
 * @param fileName - Ten file (khong can .xlsx)
 * @param sheetName - Ten sheet (mac dinh: 'Data')
 */
export function exportToExcel(
  columns: ExcelColumn[],
  data: any[],
  fileName: string,
  sheetName = 'Data',
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[]
) {
  const headers = columns.map(col => col.title);

  const rows = data.map((record, index) =>
    columns.map(col => {
      if (col.render) return col.render(record[col.dataIndex], record);
      if (col.dataIndex === 'index') return index + 1;
      return record[col.dataIndex] ?? '';
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  if (merges && merges.length > 0) {
    ws['!merges'] = merges;
  }

  const headerStyle = {
    fill: { fgColor: { rgb: '729fcf' } },
    font: { bold: true, color: { rgb: '000000' }, sz: 14 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };

  headers.forEach((title, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: title ?? '' };
    ws[cellRef].s = headerStyle;
  });

  const bodyFont = { sz: 14, color: { rgb: '000000' } };
  const bodyStyle = {
    font: bodyFont,
    alignment: { vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };
  const firstColStyle = {
    font: bodyFont,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  };
  for (let r = 1; r <= rows.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!ws[cellRef]) continue;
      ws[cellRef].s = c === 0 ? firstColStyle : bodyStyle;
    }
  }

  ws['!rows'] = [{ hpt: 24 }];

  ws['!cols'] = columns.map((col, i) => {
    const maxLen = Math.max(col.title.length, ...rows.map(row => String(row[i] ?? '').length));
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}
