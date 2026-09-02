'use client';

import { useEffect } from 'react';
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

import { STATUS_LABELS } from '../constants/status-colors';
import { FilterFormSchema, type FilterFormValues } from '../schemas/payment-plans-filter.schema';
import {
  PAYMENT_PLAN_ASSET_TYPES,
  PAYMENT_PLAN_STATUSES,
} from '../schemas/payment-plan-row.schema';
import { serializeFilterToParams } from '../lib/url-state';

const STATUS_OPTIONS = PAYMENT_PLAN_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));

const ASSET_TYPE_OPTIONS = PAYMENT_PLAN_ASSET_TYPES.map((value) => ({
  value,
  label: value.replace(/_/g, ' '),
}));

export function PaymentPlansFilterDrawer({ filter }: { filter: FilterFormValues }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<FilterFormValues>({
    defaultValues: filter,
    resolver: zodResolver(FilterFormSchema) as never,
  });

  useEffect(() => {
    form.reset(filter);
  }, [filter, form]);

  const apply = form.handleSubmit((values) => {
    const params = serializeFilterToParams(values, {
      columns: searchParams.get('columns'),
      sort: searchParams.get('sort'),
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  });

  const clear = () => router.replace(window.location.pathname, { scroll: false });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Filter Payment Plans</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4 px-4" onSubmit={apply}>
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
