"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useHasPermission } from "@/hooks/use-admin-permission";

import { useAdjustUserStreak, useUserStreak } from "../../hooks/use-user-streak";
import {
  streakAdjustFormSchema,
  type StreakAdjustFormValues,
  type UserStreak,
} from "../../schemas/user-streak.schema";
import { STREAK_REASON_MAX } from "../../schemas/user-streak.schema";
import { ADMIN_REASON_MIN } from "../../schemas/user-actions.schema";
import { getErrorMessage } from "../../utils/error-message";

/* ============================================================
 * Streaks & Points — a card in the user-details Summary (D22).
 *
 * Shows the active streak and points balance. “Adjust streak” is for admins
 * holding `adjust_streak` and needs a reason, which is stored on an audit record.
 * Points only change when the admin enters a points correction (backend
 * decision #4); otherwise they are left alone.
 *
 * A customer with no streak-enabled plan has no streak to show, so the streak
 * reads “—” and Best streak is hidden — the backend reports 0 for both in that
 * case, which would be a made-up figure for a customer who may have a real best
 * streak. Their points are real and still shown.
 * ============================================================ */

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return month;
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-NG", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function Stat({ label, value, hint, icon }: { label: string; value: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#667085]">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold text-[#101828]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#667085]">{hint}</p> : null}
    </div>
  );
}

function AdjustStreakDialog({ userId, streak, onClose }: { userId: string; streak: UserStreak; onClose: () => void }) {
  const adjust = useAdjustUserStreak(userId);
  const form = useForm<StreakAdjustFormValues>({
    resolver: zodResolver(streakAdjustFormSchema),
    defaultValues: { current_streak: streak.current_streak, points_change: undefined, reason: "" },
  });

  const submit = form.handleSubmit((values) => {
    const pointsChange = values.points_change ?? 0;

    // Mirror the backend's two refusals so the admin hears it before the round trip.
    if (values.current_streak === streak.current_streak && pointsChange === 0) {
      form.setError("current_streak", { message: "Change the streak or enter a points correction" });
      return;
    }
    if (streak.points_balance + pointsChange < 0) {
      form.setError("points_change", {
        message: `This would take the balance below zero (it is ${streak.points_balance.toLocaleString()})`,
      });
      return;
    }

    adjust.mutate(
      {
        current_streak: values.current_streak,
        reason: values.reason,
        // Sent only when there is a correction, so a plain streak adjustment is exactly what it always was.
        ...(pointsChange !== 0 ? { points_change: pointsChange } : {}),
      },
      {
        onSuccess: ({ before, after }) => {
          const parts: string[] = [];
          if (before.current_streak !== after.current_streak) {
            parts.push(`Streak adjusted from ${before.current_streak} to ${after.current_streak}`);
          }
          if (before.points_balance !== after.points_balance) {
            parts.push(`points ${before.points_balance.toLocaleString()} → ${after.points_balance.toLocaleString()}`);
          }
          toast.success(parts.length ? parts.join(" · ") : "Adjustment recorded");
          onClose();
        },
        onError: (error) => toast.error(getErrorMessage(error, "Couldn't adjust the streak")),
      }
    );
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust streak</DialogTitle>
          <DialogDescription>
            Sets this customer&apos;s current streak. Their points stay as they are unless you enter a correction below. The reason is
            stored on an audit record.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="current_streak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current streak (months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Currently {streak.current_streak}. Their best streak never goes down, and rises if you set the streak above it.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="points_change"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points correction (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step={1}
                      placeholder="e.g. 100 or -100"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Add or remove points. Leave empty to leave points alone. Balance is {streak.points_balance.toLocaleString()}; it can&apos;t go
                    below zero.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Why is the streak being adjusted?" {...field} />
                  </FormControl>
                  <FormDescription>
                    {ADMIN_REASON_MIN} to {STREAK_REASON_MAX} characters. This is stored on the audit log.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={adjust.isPending}>
            {adjust.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Adjust streak"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UserStreakCard({ userId }: { userId: string }) {
  const { data: streak, isLoading, isError } = useUserStreak(userId);
  const canAdjust = useHasPermission("adjust_streak");
  const [adjusting, setAdjusting] = useState(false);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-lg" />;

  if (isError || !streak) {
    return (
      <Card className="border-none bg-[#F9FAFB] shadow-sm">
        <CardContent className="py-6 text-sm text-[#667085]">Streaks &amp; points couldn&apos;t be loaded.</CardContent>
      </Card>
    );
  }

  const hasStreak = streak.streak_enabled_plans > 0;
  const month = streak.current_month;

  return (
    <Card className="min-w-0 overflow-hidden border-none bg-[#F9FAFB] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-medium text-[#667085]">Streaks &amp; Points</CardTitle>
          {!hasStreak ? <p className="mt-1 text-xs text-[#667085]">No streak-enabled plan, so there is no active streak.</p> : null}
        </div>
        {canAdjust ? (
          <Button type="button" variant="outline" size="sm" disabled={!hasStreak} onClick={() => setAdjusting(true)}>
            Adjust streak
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <div className={hasStreak ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
          <Stat
            label="Active streak"
            value={hasStreak ? `${streak.current_streak} ${streak.current_streak === 1 ? "month" : "months"}` : "—"}
            hint={hasStreak && streak.covered_through ? `Protected through ${monthLabel(streak.covered_through)}` : undefined}
            icon={<Flame className="h-4 w-4 text-[#667085]" />}
          />
          {/* Hidden, not zero, when there is no streak-enabled plan: the backend reports 0 there. */}
          {hasStreak ? (
            <Stat label="Best streak" value={`${streak.best_streak} ${streak.best_streak === 1 ? "month" : "months"}`} />
          ) : null}
          <Stat label="Points balance" value={streak.points_balance.toLocaleString()} icon={<Star className="h-4 w-4 text-[#667085]" />} />
          <Stat
            label={month ? monthLabel(month.month) : "This month"}
            value={month ? (month.qualified ? "Qualified" : "Not yet") : "—"}
            hint={month?.qualified && month.awarded_at ? `100 points awarded ${formatWhen(month.awarded_at)}` : undefined}
          />
        </div>

        {streak.last_adjustment ? (
          <p className="mt-3 text-xs text-[#667085]">
            Last adjusted by {streak.last_adjustment.by} on {formatWhen(streak.last_adjustment.at)} — {streak.last_adjustment.reason}
          </p>
        ) : null}
      </CardContent>

      {adjusting ? <AdjustStreakDialog userId={userId} streak={streak} onClose={() => setAdjusting(false)} /> : null}
    </Card>
  );
}
