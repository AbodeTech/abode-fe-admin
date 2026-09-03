'use client';

import { Columns } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { COLUMNS } from '../constants/columns';

export function PaymentPlansColumnChooser({ visibleColumns }: { visibleColumns: string[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const toggle = (colKey: string) => {
    const current = new Set(visibleColumns);
    if (current.has(colKey)) {
      if (current.size <= 1) return;
      current.delete(colKey);
    } else {
      current.add(colKey);
    }
    const next = new URLSearchParams(params.toString());
    next.set('columns', [...current].join(','));
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Columns className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        {COLUMNS.map((col) => (
          <DropdownMenuCheckboxItem
            key={col.key}
            checked={visibleColumns.includes(col.key)}
            onCheckedChange={() => toggle(col.key)}
          >
            {col.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
