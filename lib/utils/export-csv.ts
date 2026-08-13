import { saveAs } from 'file-saver';

/* ============================================================
 * CSV writer.
 *
 * The shared home for this. Three features carry a byte-identical private copy
 * (`features/users/utils/export-csv.ts` and the two in
 * `features/associate-managers/utils/`); new code should import from here, and
 * those should collapse into it when something else touches them.
 * ============================================================ */

export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
};

export function exportToCsv<T>(rows: T[], columns: CsvColumn<T>[], filename: string) {
  if (!rows || rows.length === 0) return;

  const escape = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headerLine = columns.map((col) => escape(col.header)).join(',');
  const dataLines = rows.map((row) => columns.map((col) => escape(col.accessor(row))).join(','));

  const csv = [headerLine, ...dataLines].join('\n');
  // Prepend a UTF-8 BOM so Excel detects the encoding — matters for ₦.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}
