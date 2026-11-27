"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonthPeriodFilter } from "@/components/shared/MonthPeriodFilter";
import { ManageFinancialOfficersMenu } from "./ManageFinancialOfficersMenu";
import { adminMinName, type FinancialOfficerSummary } from "../schemas/financial-officer.schema";

/** `?officer=all` — the team view. */
export const ALL_OFFICERS = "all";

interface Props {
  /**
   * `team`: may pick any officer or the whole team (the backend's
   * view_financial_officer_tracker); `officer`: sees only their own book.
   */
  viewAs: "team" | "officer";
  /** Promoting and removing officers is super-admin only on the backend. */
  canManageOfficers: boolean;
  officers: FinancialOfficerSummary[];
  /** An officer id, or ALL_OFFICERS. */
  activeOfficerId: string;
}

export function FOPerformanceHeader({ viewAs, canManageOfficers, officers, activeOfficerId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTeam = viewAs === "team";

  const activeOfficer = officers.find((o) => o.officer?.id === activeOfficerId) ?? null;

  const handleOfficerChange = (officerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("officer", officerId);
    // A different book — the old filter, search and page don't carry over.
    params.delete("filter");
    params.delete("search");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const subtitle = !isTeam
    ? "Your approval speed and the debt you've recovered this month."
    : activeOfficer
      ? `${adminMinName(activeOfficer.officer)} — ${activeOfficer.open_plans_count} plan${activeOfficer.open_plans_count === 1 ? "" : "s"} in their recovery book.`
      : "How fast payments get approved, and how much debt is recovered before plans are suspended.";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Officer Performance</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isTeam && (
          <Select value={activeOfficerId} onValueChange={handleOfficerChange}>
            <SelectTrigger className="w-fit min-w-55 bg-white" aria-label="Officer">
              <SelectValue placeholder="Select officer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_OFFICERS}>All officers</SelectItem>
              {officers.length > 0 && <SelectSeparator />}
              {officers.map((o) => (
                <SelectItem key={o.id} value={o.officer?.id ?? o.id}>
                  {adminMinName(o.officer)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <MonthPeriodFilter />

        {canManageOfficers && <ManageFinancialOfficersMenu activeOfficer={activeOfficer} />}
      </div>
    </div>
  );
}
