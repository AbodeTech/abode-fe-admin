"use client";

import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CopyableText } from "@/components/shared/CopyableText";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { OFFER_TYPE_LABELS } from "../../schemas/commission.schema";
import {
  OVERRIDE_TYPE_LABELS,
  assetRefName,
  overrideStatus,
  personRefName,
  refId,
  type NormalisedOverride,
} from "../../schemas/override.schema";
import { OverrideStatusBadge } from "../shared/OverrideStatusBadge";
import { OverrideRates } from "./OverrideRates";

/** `665f1c0a9b2e4d0012a3b456` → `665f1c0a…a3b456`, still copyable in full. */
function shortId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-6)}` : id;
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * The subject an override applies to.
 *
 * ⛔ ticket 9a — `listOverrides` has no `.populate()`, so names are null today
 * and the id is shown instead. Once the backend populates, names appear with
 * no change here.
 */
function Subject({ override }: { override: NormalisedOverride }) {
  const assetName = assetRefName(override.asset);
  const assetId = refId(override.asset);
  const userName = personRefName(override.user);
  const userId = refId(override.user);

  const parts: { label: string; name: string | null; id: string | null }[] = [];
  if (assetId) parts.push({ label: "Asset", name: assetName, id: assetId });
  if (userId) parts.push({ label: "Referrer", name: userName, id: userId });

  if (parts.length === 0) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="min-w-0 space-y-0.5">
      {parts.map((part) => (
        <div key={part.label} className="min-w-0 text-sm">
          {part.name ? (
            <span className="font-medium wrap-break-word">{part.name}</span>
          ) : (
            <CopyableText
              text={shortId(part.id!)}
              value={part.id!}
              className="font-mono text-xs text-muted-foreground"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function GrantedBy({ override }: { override: NormalisedOverride }) {
  const name = personRefName(override.grantedBy);
  const id = refId(override.grantedBy);

  if (name) return <span className="text-sm">{name}</span>;
  if (id) {
    return (
      <CopyableText text={shortId(id)} value={id} className="font-mono text-xs text-muted-foreground" />
    );
  }
  return <span className="text-sm text-muted-foreground">—</span>;
}

interface OverridesTableProps {
  rows: NormalisedOverride[];
  isLoading?: boolean;
  /** Rendered when there are no rows — differs for "none yet" vs "none match". */
  emptyState?: React.ReactNode;
  onEdit?: (override: NormalisedOverride) => void;
  onRevoke?: (override: NormalisedOverride) => void;
  /**
   * Which rows are editable. Lets the page enable types as their dialogs land
   * without the table knowing anything about backend tickets.
   */
  canEdit?: (override: NormalisedOverride) => boolean;
}

/** Row actions, following the app's `⋮` dropdown pattern. */
function RowActions({
  override,
  onEdit,
  onRevoke,
  canEdit,
}: {
  override: NormalisedOverride;
  onEdit?: (override: NormalisedOverride) => void;
  onRevoke?: (override: NormalisedOverride) => void;
  canEdit?: (override: NormalisedOverride) => boolean;
}) {
  const showEdit = Boolean(onEdit) && (canEdit?.(override) ?? true);
  // Already revoked — the only way back is re-creating it, which is Edit.
  const showRevoke = Boolean(onRevoke) && !override.revokedAt;

  if (!showEdit && !showRevoke) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Override actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showEdit ? (
          <DropdownMenuItem onClick={() => onEdit?.(override)}>Edit</DropdownMenuItem>
        ) : null}
        {showRevoke ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onRevoke?.(override)}
          >
            Revoke
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OverridesTable({
  rows,
  isLoading,
  emptyState,
  onEdit,
  onRevoke,
  canEdit,
}: OverridesTableProps) {
  const hasActions = Boolean(onEdit || onRevoke);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Offer type</TableHead>
              <TableHead>Rates</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Granted by</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              {hasActions ? <TableHead className="w-px" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.type}-${row.id}`}>
                <TableCell>
                  <Badge variant="secondary">{OVERRIDE_TYPE_LABELS[row.type]}</Badge>
                </TableCell>
                <TableCell className="max-w-[16rem]">
                  <Subject override={row} />
                </TableCell>
                <TableCell className="text-sm">{OFFER_TYPE_LABELS[row.offerType]}</TableCell>
                <TableCell className="max-w-[18rem]">
                  <OverrideRates rates={row.rates} />
                </TableCell>
                <TableCell className="max-w-[14rem]">
                  <span className="line-clamp-2 text-sm text-muted-foreground">
                    {row.reason || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <GrantedBy override={row} />
                </TableCell>
                <TableCell className="text-sm tabular-nums">{formatDate(row.expiresAt)}</TableCell>
                <TableCell>
                  <OverrideStatusBadge status={overrideStatus(row)} />
                </TableCell>
                {hasActions ? (
                  <TableCell className="text-right">
                    <RowActions
                      override={row}
                      onEdit={onEdit}
                      onRevoke={onRevoke}
                      canEdit={canEdit}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => (
          <AdminMobileCard
            key={`${row.type}-${row.id}`}
            title={<Subject override={row} />}
            subtitle={
              <span className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{OVERRIDE_TYPE_LABELS[row.type]}</Badge>
                <span>{OFFER_TYPE_LABELS[row.offerType]}</span>
              </span>
            }
          >
            <AdminMobileField label="Rates" value={<OverrideRates rates={row.rates} />} />
            <AdminMobileField label="Status" value={<OverrideStatusBadge status={overrideStatus(row)} />} />
            <AdminMobileField label="Expires" value={formatDate(row.expiresAt)} />
            <AdminMobileField label="Granted by" value={<GrantedBy override={row} />} />
            {row.reason ? <AdminMobileField label="Reason" value={row.reason} /> : null}
            {hasActions ? (
              <div className="flex justify-end pt-1">
                <RowActions
                  override={row}
                  onEdit={onEdit}
                  onRevoke={onRevoke}
                  canEdit={canEdit}
                />
              </div>
            ) : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
