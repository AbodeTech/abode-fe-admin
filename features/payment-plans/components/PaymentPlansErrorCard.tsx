'use client';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ApiClientError } from '@/lib/api-client';

import { paymentPlansKeys } from '../hooks/query-keys';

export function PaymentPlansErrorCard({ error }: { error: unknown }) {
  const queryClient = useQueryClient();
  const message =
    error instanceof ApiClientError
      ? error.messages.join(' ')
      : error instanceof Error
        ? error.message
        : 'Unable to load payment plans.';

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-red-700">Error loading payment plans</h3>
          <p className="text-sm text-red-600">{message}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: paymentPlansKeys.all })}
        >
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
