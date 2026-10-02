import { Suspense } from 'react';
import { FinanceAutomation } from '@/features/finance-automation/components/FinanceAutomation';

export default function FinanceAutomationPage() {
  return <Suspense fallback={<p className="p-6">Loading finance automation…</p>}><FinanceAutomation /></Suspense>;
}
