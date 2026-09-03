'use client';

import { useFormContext } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

import { ADMIN_REASON_MIN } from '../../schemas/user-actions.schema';

export function AdminReasonFields({
  reasonPlaceholder = 'Reason for this action…',
  notifyLabel = 'Notify the user by email',
}: {
  reasonPlaceholder?: string;
  notifyLabel?: string;
}) {
  const { control } = useFormContext<{ reason: string; notify_user?: boolean }>();

  return (
    <>
      <FormField
        control={control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reason</FormLabel>
            <FormControl>
              <Textarea placeholder={reasonPlaceholder} {...field} />
            </FormControl>
            <FormDescription>At least {ADMIN_REASON_MIN} characters. This is stored on the audit log.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="notify_user"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start gap-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal">{notifyLabel}</FormLabel>
            </div>
          </FormItem>
        )}
      />
    </>
  );
}
