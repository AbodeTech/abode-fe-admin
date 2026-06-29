import { saveAs } from "file-saver";

type Column<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
};

export function exportToCsv<T>(rows: T[], columns: Column<T>[], filename: string) {
  if (!rows || rows.length === 0) return;

  const escape = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const headerLine = columns.map((col) => escape(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escape(col.accessor(row))).join(",")
  );

  const csv = [headerLine, ...dataLines].join("\n");
  // Prepend a UTF-8 BOM so Excel reliably detects the encoding (important for symbols like the naira sign).
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([`${BOM}${csv}`], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
}
