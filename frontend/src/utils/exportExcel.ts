import * as XLSX from 'xlsx';
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
) {
  // Build header
  const headers = columns.map(col => col.title);

  // Build rows
  const rows = data.map((record, index) =>
    columns.map(col => {
      if (col.render) return col.render(record[col.dataIndex], record);
      if (col.dataIndex === 'index') return index + 1; // STT
      return record[col.dataIndex] ?? '';
    }),
  );

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto column width
  ws['!cols'] = columns.map((col, i) => {
    const maxLen = Math.max(
      col.title.length,
      ...rows.map(row => String(row[i] ?? '').length),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  // Create workbook and save
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}
