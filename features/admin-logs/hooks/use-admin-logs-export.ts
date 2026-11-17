import { useMutation } from '@tanstack/react-query';
// @ts-ignore
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

import { apiGetPaged } from '@/lib/api-client';

import {
  AdminLogRowSchema,
  adminLogActor,
  normalizeAdminLog,
  type AdminLog,
} from '../schemas/admin-log.schema';
import { buildAdminLogParams, type AdminLogFilters } from './use-admin-logs';

export type AdminLogExportFormat = 'csv' | 'xlsx' | 'pdf';

/**
 * abode-be-v2 has no audit-log export route, so the export walks the list.
 * The list has no upper `limit`, but asking it for everything in one request
 * is how v1 timed out — page through instead, and stop at a cap.
 */
const EXPORT_PAGE_SIZE = 100;
export const MAX_EXPORT_ROWS = 5_000;

type ExportRow = Record<string, string>;

const toExportRow = (log: AdminLog): ExportRow => ({
  timestamp: log.timestamp,
  admin: adminLogActor(log),
  admin_id: log.adminId ?? '',
  action: log.action,
  description: log.description,
  reason: log.reason ?? '',
  entity: log.entity ?? '',
  entity_id: log.entityId ?? '',
});

const exportCsv = (rows: ExportRow[], filename: string) => {
  const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
  const csv = parser.parse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

const exportXlsx = (rows: ExportRow[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Admin Logs');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportPdf = (rows: ExportRow[], filename: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const columns = Object.keys(rows[0] || {});
  const data = rows.map((row) => columns.map((c) => row[c] ?? ''));
  autoTable(doc, {
    head: [columns],
    body: data,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [15, 23, 42] },
    margin: { top: 10 },
  });
  doc.save(`${filename}.pdf`);
};

export interface AdminLogExportResult {
  exported: number;
  total: number;
  truncated: boolean;
}

export const useAdminLogsExport = () => {
  return useMutation({
    mutationFn: async ({
      filters,
      format,
    }: {
      filters: AdminLogFilters;
      format: AdminLogExportFormat;
    }): Promise<AdminLogExportResult> => {
      const logs: AdminLog[] = [];
      let total = 0;

      for (let page = 1; logs.length < MAX_EXPORT_ROWS; page += 1) {
        const params = buildAdminLogParams({ ...filters, page, limit: EXPORT_PAGE_SIZE });
        const { items, meta } = await apiGetPaged('/admin/audit-logs', AdminLogRowSchema, { params });
        total = meta.total ?? total;
        logs.push(...items.map(normalizeAdminLog));
        if (items.length < EXPORT_PAGE_SIZE || logs.length >= total) break;
      }

      if (!logs.length) throw new Error('No logs match these filters');

      const rows = logs.slice(0, MAX_EXPORT_ROWS).map(toExportRow);
      const filename = `admin_logs_${new Date().toISOString().slice(0, 10)}`;

      switch (format) {
        case 'csv':
          exportCsv(rows, filename);
          break;
        case 'xlsx':
          exportXlsx(rows, filename);
          break;
        case 'pdf':
          exportPdf(rows, filename);
          break;
      }

      return { exported: rows.length, total, truncated: total > rows.length };
    },
  });
};
