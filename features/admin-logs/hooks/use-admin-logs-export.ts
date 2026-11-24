import { useMutation } from '@tanstack/react-query';
import { apiGetPaged } from '@/lib/api-client';
// @ts-ignore
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { AdminLogSchema, type AdminLog } from '../schemas/admin-log.schema';
import type { AdminLogFilters } from './use-admin-logs';

export type AdminLogExportFormat = 'csv' | 'xlsx' | 'pdf';

const processLog = (
  log: Pick<AdminLog, 'timestamp' | 'admin_email' | 'action' | 'description' | 'admin_id'>,
) => ({
  timestamp: log.timestamp,
  adminEmail: log.admin_email ?? 'System',
  action: log.action,
  description: log.description,
  adminId: log.admin_id ?? '',
});

const exportCsv = (rows: ReturnType<typeof processLog>[], filename: string) => {
  const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
  const csv = parser.parse(rows);
  saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
};

const exportXlsx = (rows: ReturnType<typeof processLog>[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Admin Logs');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportPdf = (rows: ReturnType<typeof processLog>[], filename: string) => {
  const doc = new jsPDF();
  const columns = Object.keys(rows[0] || {});
  const data = rows.map((row) => columns.map((column) => row[column as keyof typeof row] ?? ''));
  autoTable(doc, {
    head: [columns],
    body: data,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    margin: { top: 10 },
  });
  doc.save(`${filename}.pdf`);
};

// The audit-log endpoint has no export of its own, so this pages through it with the same
// filters the table uses (`admin_id`, `action`) and builds the file in the browser.
async function getAllFilteredLogs(filters: AdminLogFilters) {
  const limit = 500;
  const firstPage = await apiGetPaged('/admin/audit-logs', AdminLogSchema, {
    params: { page: 1, limit, admin_id: filters.adminId || undefined, action: filters.action || undefined },
  });
  const logs = [...firstPage.items];
  const totalPages = firstPage.meta.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await apiGetPaged('/admin/audit-logs', AdminLogSchema, {
      params: { page, limit, admin_id: filters.adminId || undefined, action: filters.action || undefined },
    });
    logs.push(...result.items);
  }
  return logs;
}

export const useAdminLogsExport = () => useMutation({
  mutationFn: async ({ filters, format }: { filters: AdminLogFilters; format: AdminLogExportFormat }) => {
    const raw = await getAllFilteredLogs(filters);
    if (!raw.length) throw new Error('No logs available to export');
    const rows = raw.map(processLog);

    switch (format) {
      case 'csv': exportCsv(rows, 'admin_logs'); break;
      case 'xlsx': exportXlsx(rows, 'admin_logs'); break;
      case 'pdf': exportPdf(rows, 'admin_logs'); break;
    }
  },
});
