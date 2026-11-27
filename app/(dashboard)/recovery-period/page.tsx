"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import {
  DEFAULT_RECOVERY_LIMIT,
  RECOVERY_TABS,
  RecoveryStatsStrip,
  RecoveryWindowsTable,
  recoveryErrorText,
  useRecoveryStats,
  useRecoveryWindows,
  useSendRecoveryReminder,
  type RecoveryRow,
  type RecoveryTab,
} from "@/features/recovery-windows";

const TAB_LABEL: Record<RecoveryTab, string> = {
  window: "In the window",
  ending: "Ending soon",
  choices: "Requests to answer",
  payment: "Payment to approve",
  refund: "Refund to approve",
  moved: "Moved",
  ended: "Ended",
  cancelled: "No longer suspended",
};

function RecoveryPeriodContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const permissions = useAdminPermissions();

  const page = Number(searchParams.get("page")) || 1;
  const tabParam = searchParams.get("tab") as RecoveryTab | null;
  const tab: RecoveryTab = tabParam && RECOVERY_TABS.includes(tabParam) ? tabParam : "window";
  const search = searchParams.get("q") || "";
  const [draft, setDraft] = useState(search);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && !(key === "tab" && value === "window")) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if (draft !== search) setParam("q", draft.trim());
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const { data, isLoading, error } = useRecoveryWindows({ tab, search, page, limit: DEFAULT_RECOVERY_LIMIT });
  const stats = useRecoveryStats();
  const remind = useSendRecoveryReminder();
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const onRemind = async (row: RecoveryRow) => {
    setRemindingId(row.id);
    try {
      await remind.mutateAsync({ id: row.id });
      toast.success(`Reminder sent to ${row.customer_name ?? "the customer"}`);
    } catch (err) {
      toast.error(
        recoveryErrorText(
          err,
          { RECOVERY_REMINDER_SENT_RECENTLY: "A reminder already went out in the last 24 hours." },
          "Couldn't send the reminder"
        )
      );
    } finally {
      setRemindingId(null);
    }
  };

  if (!permissions.has("view_recovery_windows")) {
    return (
      <div className="mx-auto mt-6 max-w-xl rounded-md border p-6 text-sm text-muted-foreground">
        You don’t have access to the Recovery period. Ask a super admin for the “view_recovery_windows” permission.
      </div>
    );
  }

  const counts = stats.data?.tabs as Partial<Record<RecoveryTab, number>> | undefined;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Finance</p>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Recovery period</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Plans suspended in the last three months. Each customer can move what they’ve paid to another Flex or Full
          Ownership product until their window ends. After that the plan ends, with a refund paid to their bank (from
          Transactions › Refunds) if they paid more than 30%.
        </p>
      </div>

      <RecoveryStatsStrip />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {RECOVERY_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setParam("tab", t)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                t === tab ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {TAB_LABEL[t]}
              {counts?.[t] ? (
                <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">{counts[t]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name, email, phone or estate"
            className="pl-9"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          <h3 className="font-bold">Couldn’t load the recovery period</h3>
          <p>{(error as Error).message}</p>
        </div>
      ) : (
        <div className="min-w-0 space-y-4">
          <RecoveryWindowsTable
            rows={data?.rows ?? []}
            isLoading={isLoading}
            recordHref={(row) => `/recovery-period/${row.id}`}
            onRemind={onRemind}
            remindingId={remindingId}
            canRemind={permissions.has("remind_recovery_customers")}
          />
          <Pagination count={data?.count ?? 0} currentIdx={page} limit={DEFAULT_RECOVERY_LIMIT} />
        </div>
      )}
    </div>
  );
}

export default function RecoveryPeriodPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <RecoveryPeriodContent />
    </Suspense>
  );
}
