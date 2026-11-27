'use client';

import { useId } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import s from './recruitment-analytics.module.css';

export function AnalyticsSelect({ label, value, onChange, options, disabled, hideLabel = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  const id = useId();
  return <div className={s.field}>
    <label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>{label}</label>
    <Select value={`value:${value}`} onValueChange={next => onChange(next.slice(6))} disabled={disabled}>
      <SelectTrigger id={id} className={s.selectTrigger}><SelectValue /></SelectTrigger>
      <SelectContent position="popper" align="start" className={s.selectContent}>
        {options.map(option => <SelectItem key={option.value} value={`value:${option.value}`} disabled={option.disabled} className={s.selectItem}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}
