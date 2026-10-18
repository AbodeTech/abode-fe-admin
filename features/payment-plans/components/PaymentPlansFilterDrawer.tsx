'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { ASSET_TYPE_LABELS } from '../constants/asset-type-labels';
import {
  PRESETS,
  matchesPreset,
  upcomingDueBefore,
  type Preset,
  type PresetFilter,
} from '../constants/presets';
import { STATUS_LABELS } from '../constants/status-colors';
import { FilterFormSchema, type FilterFormValues } from '../schemas/payment-plans-filter.schema';
import {
  PAYMENT_PLAN_ASSET_TYPES,
  PAYMENT_PLAN_STATUSES,
} from '../schemas/payment-plan-row.schema';
import { countActiveFilters, serializeFilterToParams } from '../lib/url-state';

const STATUS_OPTIONS = PAYMENT_PLAN_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

const ASSET_TYPE_OPTIONS = PAYMENT_PLAN_ASSET_TYPES.map((value) => ({
  value,
  label: ASSET_TYPE_LABELS[value],
}));

export function PaymentPlansFilterDrawer({ filter }: { filter: FilterFormValues }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const form = useForm<FilterFormValues>({
    defaultValues: filter,
    resolver: zodResolver(FilterFormSchema) as never,
  });

  const activeCount = countActiveFilters(filter);

  /**
   * Sync from the URL only as the sheet opens. Syncing on every change of the
   * `filter` prop instead would re-`reset()` mid-edit — `parseFilter` returns a
   * fresh object each render, so any parent re-render (a React Query refetch on
   * window focus, say) discarded whatever the user had picked but not applied.
   */
  const onOpenChange = (next: boolean) => {
    if (next) form.reset(filter);
    setOpen(next);
  };

  const apply = form.handleSubmit((values) => {
    const params = serializeFilterToParams(values, {
      columns: searchParams.get('columns'),
      sort: searchParams.get('sort'),
    });
    router.replace(`?${params.toString()}`, { scroll: false });
    setOpen(false);
  });

  const clear = () => {
    const params = new URLSearchParams();
    // Column choice and sort are view preferences, not filters — keep them.
    const columns = searchParams.get('columns');
    const sort = searchParams.get('sort');
    if (columns) params.set('columns', columns);
    if (sort) params.set('sort', sort);
    router.replace(params.size ? `?${params.toString()}` : window.location.pathname, {
      scroll: false,
    });
    setOpen(false);
  };

  /**
   * Presets write into the form rather than straight to the URL, so they read
   * as a shortcut for filling this panel in and still need Apply. Clicking the
   * active preset clears it.
   */
  const values = form.watch();
  const applyPreset = (preset: Preset) => {
    const next: PresetFilter = matchesPreset(values, preset.filter)
      ? {}
      : preset.key === 'upcoming'
        ? { status: ['active'], next_payment_due_before: upcomingDueBefore() }
        : preset.filter;

    form.setValue('status', next.status ?? []);
    form.setValue('has_defaults', next.has_defaults);
    form.setValue('next_payment_due_before', next.next_payment_due_before);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Payment Plans</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4 px-4" onSubmit={apply}>
            <div className="flex flex-col gap-2">
              <FormLabel>Quick presets</FormLabel>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm',
                      matchesPreset(values, preset.filter)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={STATUS_OPTIONS}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Any status"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="asset_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset type</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={ASSET_TYPE_OPTIONS}
                      selected={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Any asset type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="has_defaults"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                    />
                  </FormControl>
                  <FormLabel>Has defaults</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default condition</FormLabel>
                  <Select
                    disabled={!form.watch('has_defaults')}
                    value={field.value ?? 'currently_owing'}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="currently_owing">Currently owing</SelectItem>
                      <SelectItem value="any">Ever missed a payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="has_referrer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true ? true : undefined)}
                    />
                  </FormControl>
                  <FormLabel>Has referrer</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="search"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search user</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name or email"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan created from</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan created to</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ?? ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="next_payment_due_before"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next payment due before</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={toDatetimeLocal(field.value)}
                      onChange={(e) =>
                        field.onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="min_outstanding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min outstanding (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_outstanding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max outstanding (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SheetFooter className="px-0">
              <Button type="button" variant="outline" onClick={clear}>
                Clear all
              </Button>
              <Button type="submit">Apply</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

function toDatetimeLocal(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
