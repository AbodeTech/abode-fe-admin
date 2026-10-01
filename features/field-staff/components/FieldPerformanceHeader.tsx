"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

import { FIELD_STAFF_TYPES, type FieldStaff } from "../schemas/field-staff.schema";
import type { FieldAssetRef } from "../schemas/field-staff.schema";
import { ALL, usePerformanceParams } from "../hooks/use-performance-params";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldPeriodFilter } from "./FieldPeriodFilter";
import { InviteFieldStaffDialog } from "./InviteFieldStaffDialog";

const ROLE_TABS = { site_manager: "Site Managers", surveyor: "Surveyors" } as const;

interface FieldPerformanceHeaderProps {
  /** Everyone in the role, any account state — the person picker. */
  staff: FieldStaff[];
  /** The selected person's sites this month — the site picker. Empty in the combined view. */
  sites: FieldAssetRef[];
  /** Work waiting for review in what's on screen. */
  waiting: number;
  subtitle: string;
}

/** Title, then the pickers: role, person, site, month — plus the review pill and Invite. */
export function FieldPerformanceHeader({ staff, sites, waiting, subtitle }: FieldPerformanceHeaderProps) {
  const { role, person, site, update } = usePerformanceParams();
  const roleWord = role === "site_manager" ? "site managers" : "surveyors";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Field Performance</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="Role">
          {FIELD_STAFF_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={role === t}
              onClick={() => update({ role: t })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                role === t ? "bg-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {ROLE_TABS[t]}
            </button>
          ))}
        </div>

        <Select value={person} onValueChange={(v) => update({ person: v })}>
          <SelectTrigger className="w-fit min-w-56 bg-white" aria-label="Person">
            <SelectValue placeholder="Select person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All {roleWord} (combined)</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name}
                {s.status !== "active" && <span className="ml-1.5 text-xs text-muted-foreground">· {s.status}</span>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {sites.length > 1 && (
          <Select value={site} onValueChange={(v) => update({ site: v })}>
            <SelectTrigger className="w-fit min-w-44 bg-white" aria-label="Site">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All {sites.length} sites</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name ?? "Removed site"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <FieldPeriodFilter />

        {waiting > 0 && (
          <Link
            href="/field-performance/review-queue"
            className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            <Inbox className="h-3.5 w-3.5" />
            {waiting} to review
          </Link>
        )}

        <InviteFieldStaffDialog staffType={role} />
      </div>
    </div>
  );
}
