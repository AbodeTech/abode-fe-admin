export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
  sortable?: boolean;
  sortKey?: string;
}

export const COLUMNS: ColumnDef[] = [
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'referrer', label: 'Referrer', defaultVisible: false },
  { key: 'asset', label: 'Asset', defaultVisible: true },
  { key: 'asset_type', label: 'Asset type', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'no_of_units', label: 'Units', defaultVisible: false },
  { key: 'size', label: 'Size (sqm)', defaultVisible: false },
  { key: 'amount_payable', label: 'Plan value', defaultVisible: false, sortable: true, sortKey: 'amount_payable' },
  { key: 'amount_paid', label: 'Amount paid', defaultVisible: true, sortable: true, sortKey: 'amount_paid' },
  { key: 'outstanding', label: 'Outstanding', defaultVisible: true, sortable: true, sortKey: 'balance' },
  { key: 'default_amount', label: 'Default amount', defaultVisible: false, sortable: true, sortKey: 'default_amount' },
  { key: 'default_count', label: 'Default count', defaultVisible: false },
  { key: 'months_overdue', label: 'Months overdue', defaultVisible: false, sortable: true, sortKey: 'months_overdue' },
  {
    key: 'next_payment',
    label: 'Next payment',
    defaultVisible: true,
    sortable: true,
    sortKey: 'next_date_of_payment',
  },
  { key: 'start_date', label: 'Start date', defaultVisible: false },
  { key: 'completed_at', label: 'Completed at', defaultVisible: false },
  { key: 'suspended_at', label: 'Suspended at', defaultVisible: false },
  { key: 'cancelled_at', label: 'Cancelled at', defaultVisible: false },
  { key: 'closed_at', label: 'Closed at', defaultVisible: false },
  { key: 'suspension_reason', label: 'Suspension reason', defaultVisible: false },
  { key: 'cancellation_reason', label: 'Cancellation reason', defaultVisible: false },
  { key: 'closure_reason', label: 'Closure reason', defaultVisible: false },
  { key: 'contract_signed', label: 'Contract signed', defaultVisible: false },
  { key: 'created', label: 'Created', defaultVisible: true, sortable: true, sortKey: 'createdAt' },
];

export const DEFAULT_VISIBLE_COLUMNS = COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);

export const DEFAULT_SORT = '-createdAt';
