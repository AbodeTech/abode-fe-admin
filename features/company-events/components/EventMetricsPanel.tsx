"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useRemindUnregistered } from "../hooks/use-attendee-actions";
import { useEventAnalytics } from "../hooks/use-event-analytics";

const formatNumber = (value?: number | null) => new Intl.NumberFormat("en-NG").format(value ?? 0);

/** One labelled figure, large, with an optional line of explanation. */
function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

interface EventMetricsPanelProps {
  eventId: string;
  /** Reminders go out only while the event is published. */
  eventStatus: string;
  availableSize: number | null;
  reservedSize: number;
  sizeUnit: string | null;
  /** `meta.total` from the eligible-clients query: paid-up buyers not yet invited. */
  eligibleRemainingCount: number;
}

/**
 * The questions an admin has before an allocation day, answered in numbers: who was invited and
 * who has replied, who else is coming, how much land is left, where people are picked up, and,
 * from the day itself, who turned up. Every figure counts the whole event.
 */
export function EventMetricsPanel({
  eventId,
  eventStatus,
  availableSize,
  reservedSize,
  sizeUnit,
  eligibleRemainingCount,
}: EventMetricsPanelProps) {
  const { data: analytics, isLoading } = useEventAnalytics(eventId);
  const remind = useRemindUnregistered();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const unit = sizeUnit || "sqm";

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (!analytics) return null;

  const s = analytics.summary;
  const waiting = s?.invited_not_registered ?? 0;
  const usedPct = availableSize ? Math.min(100, Math.round((reservedSize / availableSize) * 100)) : null;

  const sendReminders = () =>
    remind.mutate(
      { eventId },
      {
        onSuccess: (r) => {
          setConfirmOpen(false);
          const parts = [`${formatNumber(r.sent)} reminded`];
          if (r.skipped_recent) parts.push(`${formatNumber(r.skipped_recent)} skipped (reminded in the last 24 hours)`);
          if (r.failed) parts.push(`${formatNumber(r.failed)} could not be sent`);
          toast.success(parts.join(" · "));
        },
        onError: (error) => toast.error(error.message || "Failed to send reminders"),
      }
    );

  return (
    <div className="space-y-6">
      <Section title="Who did we invite?">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Figure label="Invited" value={formatNumber(s?.invited)} hint="Buyers in this event's batch" />
          <Figure label="Registered" value={formatNumber(s?.invited_registered)} hint="Filled the form and have their pass" />
          <Figure label="Haven't registered" value={formatNumber(waiting)} hint="Invited but not replied yet" />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">
            {waiting > 0
              ? `${formatNumber(waiting)} invited ${waiting === 1 ? "buyer has" : "buyers have"} not registered yet.`
              : "Everyone invited has registered."}
          </p>
          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={waiting === 0 || eventStatus !== "published" || remind.isPending}
          >
            {remind.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Remind all who haven&apos;t registered ({formatNumber(waiting)})
          </Button>
        </div>
      </Section>

      <Section title="Who else is coming?">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Figure label="Visitors" value={formatNumber(s?.visitors)} hint="Signed up through the public link" />
          <Figure
            label="Expected on the day"
            value={formatNumber(s?.expected)}
            hint={`${formatNumber(s?.invited_registered)} registered buyers + ${formatNumber(s?.visitors)} visitors`}
          />
        </div>
      </Section>

      <Section title="How much land is left?">
        {availableSize != null ? (
          <>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#2a78d6]" style={{ width: `${usedPct ?? 0}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-700">
              {formatNumber(reservedSize)} of {formatNumber(availableSize)} {unit} reserved ({usedPct}%) ·{" "}
              {formatNumber(Math.max(0, availableSize - reservedSize))} {unit} free
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-700">
            {formatNumber(reservedSize)} {unit} reserved · no capacity set for this event
          </p>
        )}
        <p className="mt-1 text-sm text-slate-500">
          {formatNumber(eligibleRemainingCount)} more paid-up {eligibleRemainingCount === 1 ? "buyer" : "buyers"} could still be invited.
        </p>
      </Section>

      <Section title="Where are they being picked up?">
        {analytics.pickup_load.length === 0 ? (
          <p className="text-sm text-slate-500">This event has no pickup points.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...analytics.pickup_load]
              .sort((a, b) => b.registered - a.registered)
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">{p.name}</span>
                  <span className="font-semibold text-slate-900">
                    {formatNumber(p.registered)}
                    {p.seat_limit != null && <span className="font-normal text-slate-500"> / {formatNumber(p.seat_limit)} seats</span>}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Section>

      <Section title="On the day">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Figure
            label="Checked in at pickup"
            value={`${formatNumber(s?.checked_in)} of ${formatNumber(s?.expected)}`}
          />
          <Figure label="Confirmed at the estate" value={formatNumber(s?.confirmed)} />
          <Figure
            label="Didn't turn up"
            value={s?.no_show == null ? "—" : formatNumber(s.no_show)}
            hint={s?.no_show == null ? "Shown after the event" : "Registered but never checked in"}
          />
        </div>
      </Section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Remind ${formatNumber(waiting)} ${waiting === 1 ? "buyer" : "buyers"}?`}
        description="Each invited buyer who hasn't registered gets the invitation email again, with a fresh form link. Anyone reminded in the last 24 hours is skipped."
        confirmLabel="Send reminders"
        onConfirm={sendReminders}
        destructive={false}
      />
    </div>
  );
}
