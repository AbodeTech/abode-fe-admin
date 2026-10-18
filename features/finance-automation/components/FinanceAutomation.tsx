'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useHasPermission } from '@/hooks/use-admin-permission';
import { WorkflowSchema, workflows } from '../schemas/workflows.schema';
import { ExpenseAutomation } from './ExpenseAutomation';
import { WorkflowPanel } from './WorkflowPanel';

export function FinanceAutomation() {
  const router = useRouter();
  const params = useSearchParams();
  const canView = useHasPermission('view_finance_runs');
  const parsed = WorkflowSchema.safeParse(params.get('workflow'));
  const workflow = parsed.success ? parsed.data : 'expenses';
  if (!canView) return <p className="p-6">You need permission to view finance runs. Contact your administrator for access.</p>;
  return <div><nav aria-label="Finance workflows" className="flex flex-wrap gap-2 border-b py-4">{[['expenses', 'Expenses'], ...Object.entries(workflows).map(([key, value]) => [key, value.label])].map(([key, label]) => <button key={key} aria-current={workflow === key ? 'page' : undefined} className={`rounded-md px-4 py-2 text-sm ${workflow === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`} onClick={() => router.replace(`?workflow=${key}`, { scroll: false })}>{label}</button>)}</nav>{workflow === 'expenses' ? <ExpenseAutomation /> : <WorkflowPanel key={workflow} workflow={workflow} />}</div>;
}
