import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
// @ts-ignore
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
// @ts-ignore
import { saveAs } from 'file-saver';
// @ts-ignore
import { jsPDF } from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { AdminLogFilters } from './use-admin-logs';

const EXPORT_ADMIN_LOGS_QUERY = graphql(`
  query ExportAdminLogs($page: Int!, $limit: Int!, $adminEmail: String, $action: String) {
    getAllAdminLogs(page: $page, limit: $limit, adminEmail: $adminEmail, action: $action) {
      data {
        timestamp
        description
        action
        adminEmail
        adminId
        metadata
        oldState
        _id
      }
    }
  }
`);

export type AdminLogExportFormat = 'csv' | 'xlsx' | 'pdf';

const processLog = (log: any) => ({
  timestamp: log.timestamp,
  adminEmail: log.adminEmail,
  action: log.action,
  description: log.description,
  adminId: log.adminId,
});

const exportCsv = (rows: any[], filename: string) => {
  const parser = new Parser({ fields: Object.keys(rows[0] || {}) });
  const csv = parser.parse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

const exportXlsx = (rows: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Admin Logs');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportPdf = (rows: any[], filename: string) => {
  const doc = new jsPDF();
  const columns = Object.keys(rows[0] || {});
  const data = rows.map((row) => columns.map((c) => row[c] ?? ''));
  autoTable(doc, {
    head: [columns],
    body: data,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] },
    margin: { top: 10 },
  });
  doc.save(`${filename}.pdf`);
};

export const useAdminLogsExport = () => {
  return useMutation({
    mutationFn: async ({ filters, format }: { filters: AdminLogFilters; format: AdminLogExportFormat }) => {
      const res = await execute(EXPORT_ADMIN_LOGS_QUERY, {
        page: 1,
        limit: 1_000_000,
        adminEmail: filters.adminEmail || undefined,
        action: filters.action || undefined,
      });

      const raw = res.getAllAdminLogs?.data || [];
      if (!raw.length) throw new Error('No logs available to export');
      const rows = raw.map(processLog);

      switch (format) {
        case 'csv':
          exportCsv(rows, 'admin_logs');
          break;
        case 'xlsx':
          exportXlsx(rows, 'admin_logs');
          break;
        case 'pdf':
          exportPdf(rows, 'admin_logs');
          break;
      }
    },
  });
};
