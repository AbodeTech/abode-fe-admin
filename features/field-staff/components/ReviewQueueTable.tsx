"use client";

import { useState } from "react";
import { Clock, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { FIELD_STAFF_TYPE_LABELS, assetName, staffName } from "../schemas/field-staff.schema";
import type { FieldSubmission } from "../schemas/submission.schema";
import { daysSince, formatDate, formatDateTime, formatNaira, formatQuantity, waitingFor } from "../lib/format";
import { workAmount } from "../lib/payload";
import { STALE_AFTER_DAYS } from "../hooks/use-field-performance";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";

function Work({ sub }: { sub: FieldSubmission }) {
  return (
    <div className="min-w-0">
      <p className="font-medium">{sub.summary}</p>
      <p className="text-xs text-muted-foreground">
        {sub.metric_label} · work on {formatDate(sub.work_date)}
      </p>
    </div>
  );
}

/** The amount of work done; repairs and rework are flagged because they don't add to the score. */
function Quantity({ sub }: { sub: FieldSubmission }) {
  const { value, unit } = workAmount(sub);
  return (
    <div className="tabular-nums">
      <p className="font-medium">{formatQuantity(value, unit)}</p>
      {!sub.counts_towards_target && <p className="text-xs text-muted-foreground">doesn&apos;t score</p>}
    </div>
  );
}

function Evidence({ sub }: { sub: FieldSubmission }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Paperclip className="h-3.5 w-3.5" aria-hidden />
      {sub.evidence.length + (sub.receipt_url ? 1 : 0)}
      {sub.amount_spent !== null && !sub.receipt_url && <span className="text-amber-700">· no receipt</span>}
    </span>
  );
}

/** When it was sent, and how long it's waited — flagged in red once it's past the stale line. */
function Submitted({ sub }: { sub: FieldSubmission }) {
  const old = daysSince(sub.submitted_at) >= STALE_AFTER_DAYS;
  return (
    <div className="whitespace-nowrap">
      <p className="text-sm">{formatDateTime(sub.submitted_at)}</p>
      <p className={old ? "inline-flex items-center gap-1 text-xs font-medium text-[#AD1F2A]" : "text-xs text-muted-foreground"}>
        {old && <Clock className="h-3 w-3" aria-hidden />}
        {waitingFor(sub.submitted_at)}
      </p>
    </div>
  );
}

interface ReviewQueueTableProps {
  rows: FieldSubmission[];
  emptyState?: React.ReactNode;
}

/** Submissions waiting on a decision. Review opens the full record. */
export function ReviewQueueTable({ rows, emptyState }: ReviewQueueTableProps) {
  const [reviewing, setReviewing] = useState<string | null>(null);

  if (rows.length === 0) return <>{emptyState}</>;

  const reviewButton = (sub: FieldSubmission, className?: string) => (
    <Button size="sm" variant="outline" className={className} onClick={() => setReviewing(sub.id)}>
      Review
    </Button>
  );

  return (
    <>
      <SubmissionReviewDialog submissionId={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />

      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Work</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Submitted by</TableHead>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="max-w-[20rem]">
                  <Work sub={sub} />
                </TableCell>
                <TableCell>
                  <Quantity sub={sub} />
                </TableCell>
                <TableCell>
                  <p className="text-sm">{staffName(sub.field_staff)}</p>
                  <p className="text-xs text-muted-foreground">{FIELD_STAFF_TYPE_LABELS[sub.staff_type]}</p>
                </TableCell>
                <TableCell className="text-sm">{assetName(sub.asset)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {sub.amount_spent !== null ? formatNaira(sub.amount_spent) : "—"}
                </TableCell>
                <TableCell>
                  <Evidence sub={sub} />
                </TableCell>
                <TableCell>
                  <Submitted sub={sub} />
                </TableCell>
                <TableCell className="text-right">{reviewButton(sub)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((sub) => (
          <AdminMobileCard key={sub.id} title={<Work sub={sub} />}>
            <AdminMobileField label="Quantity" value={<Quantity sub={sub} />} />
            <AdminMobileField
              label="Submitted by"
              value={
                <>
                  {staffName(sub.field_staff)} <Badge variant="secondary">{FIELD_STAFF_TYPE_LABELS[sub.staff_type]}</Badge>
                </>
              }
            />
            <AdminMobileField label="Site" value={assetName(sub.asset)} />
            <AdminMobileField label="Spent" value={sub.amount_spent !== null ? formatNaira(sub.amount_spent) : "—"} />
            <AdminMobileField label="Evidence" value={<Evidence sub={sub} />} />
            <AdminMobileField label="Submitted" value={<Submitted sub={sub} />} />
            {reviewButton(sub, "mt-2 w-full")}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
