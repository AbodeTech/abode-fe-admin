// @ts-expect-error - json2csv does not ship complete ESM typings in this setup.
import { Parser } from 'json2csv';
import { saveAs } from 'file-saver';

/** Client-side CSV download — mirrors features/company-events/lib/csv.ts's pattern. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  const parser = new Parser();
  const csv = parser.parse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}
