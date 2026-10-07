"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";

import type { FieldAssetRef, FieldStaff } from "../schemas/field-staff.schema";
import { ALL, usePerformanceParams } from "../hooks/use-performance-params";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldPeriodFilter } from "./FieldPeriodFilter";
import { InviteFieldStaffDialog } from "./InviteFieldStaffDialog";

const ROLE_TITLES = { site_manager: "Site Manager Performance", surveyor: "Surveyor Performance" } as const;

interface FieldPerformanceHeaderProps {
  /** Everyone in the role, any account state — the person picker. */
  staff: FieldStaff[];
  /** The selected person's sites this month — the site picker. Empty in the combined view. */
  sites: FieldAssetRef[];
  /** Work waiting for review in what's on screen. */
  waiting: number;
  subtitle: string;
}

/** Title, then the pickers: person, site, month — plus the review pill and Invite. The role is the page. */
export function FieldPerformanceHeader({ staff, sites, waiting, subtitle }: FieldPerformanceHeaderProps) {
  const { role, person, site, update } = usePerformanceParams();
  const roleWord = role === "site_manager" ? "site managers" : "surveyors";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{ROLE_TITLES[role]}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
