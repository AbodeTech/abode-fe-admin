"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyableText } from "@/components/shared/CopyableText";
import { useAuthStore } from "@/store/auth-store";
import { useHasPermission } from "@/hooks/use-admin-permission";

import { useReactivateAgency } from "../hooks/use-agency-actions";
import { agencyOwnerName, type AgencyDetail } from "../schemas/agency.schema";
import { getErrorMessage } from "../utils/error-message";
import { AgencyChangeOwnerDialog } from "./AgencyChangeOwnerDialog";
import { AgencyDeleteDialog } from "./AgencyDeleteDialog";
import { AgencyEditDialog } from "./AgencyEditDialog";
import { AgencyStatusBadge } from "./AgencyListTable";
import { AgencySuspendDialog } from "./AgencySuspendDialog";

/**
 * Agency detail — header, owner, totals, and the roster / ledger tabs.
 *
 * The two tab bodies are passed in rather than fetched here so this component
 * stays presentational and each tab's query lives with its own page state
 * (search, paging, date range).
 */
interface AgencyDetailViewProps {
  agency: AgencyDetail;
  membersSlot: React.ReactNode;
  commissionsSlot: React.ReactNode;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="wrap-break-word text-sm font-medium">{value}</div>
    </div>
  );
}

export function AgencyDetailView({
  agency,
  membersSlot,
  commissionsSlot,
}: AgencyDetailViewProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [changeOwnerOpen, setChangeOwnerOpen] = useState(false);

  const canManage = useHasPermission("manage_agencies");
  const isSuperAdmin = useAuthStore((state) => state.user?.role?.is_super_admin ?? false);

  const { mutateAsync: reactivateAgency, isPending: reactivating } = useReactivateAgency();

  const ownerName = agencyOwnerName(agency.owner);

  const handleReactivate = async () => {
    try {
      await reactivateAgency(agency.id);
      toast.success(`${agency.name} reactivated`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to reactivate agency"));
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <Button
          variant="ghost"
          asChild
          className="mb-1 h-auto min-h-9 w-full justify-start px-0 py-2 hover:bg-transparent sm:w-fit"
        >
          <Link href="/agency/lists">
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            Back to Agencies
          </Link>
        </Button>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{agency.name}</h1>
              <AgencyStatusBadge status={agency.status} />
            </div>
            <CopyableText text={agency.code} className="font-mono text-sm" />
          </div>

          {canManage && (
            <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditOpen(true)}>
                Edit
              </Button>

              {agency.is_suspended ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleReactivate}
                  disabled={reactivating}
                >
                  {reactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reactivate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setSuspendOpen(true)}
                >
                  Suspend
                </Button>
              )}

              {isSuperAdmin && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setChangeOwnerOpen(true)}
                >
                  Change owner
                </Button>
              )}

              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {agency.is_suspended && agency.suspension_reason && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">Suspended</p>
          <p className="mt-1 text-sm text-amber-700">{agency.suspension_reason}</p>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="min-w-0 border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission rate
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">
            {agency.commission_percentage}%
          </CardContent>
        </Card>
        <Card className="min-w-0 border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">
            {agency.member_count}
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission to date
            </CardTitle>
          </CardHeader>
          <CardContent className="wrap-break-word text-lg font-semibold tabular-nums sm:text-xl">
            {formatCurrency(agency.total_commission_to_date)}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 border border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Owner &amp; contact</CardTitle>
        </CardHeader>
        <CardContent className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailField label="Owner" value={ownerName} />
          <DetailField label="Owner email" value={agency.owner?.email || "—"} />
          <DetailField label="Owner phone" value={agency.owner?.phone_number || "—"} />
          <DetailField label="Owner username" value={agency.owner?.user_name || "—"} />
          <DetailField label="Contact email" value={agency.contact_email || "—"} />
          <DetailField label="Contact phone" value={agency.contact_phone || "—"} />
          <DetailField label="Created" value={formatDate(agency.created_at)} />
          <DetailField label="Last updated" value={formatDate(agency.updated_at)} />
        </CardContent>
      </Card>

      <Tabs defaultValue="members" className="w-full min-w-0">
        <TabsList>
          <TabsTrigger value="members">Members ({agency.member_count})</TabsTrigger>
          <TabsTrigger value="commissions">Commission ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-4 min-w-0">
          {membersSlot}
        </TabsContent>
        <TabsContent value="commissions" className="mt-4 min-w-0">
          {commissionsSlot}
        </TabsContent>
      </Tabs>

      {canManage && (
        <>
          <AgencyEditDialog agency={agency} open={editOpen} onOpenChange={setEditOpen} />
          <AgencySuspendDialog
            agencyId={agency.id}
            agencyName={agency.name}
            open={suspendOpen}
            onOpenChange={setSuspendOpen}
          />
          <AgencyDeleteDialog
            agencyId={agency.id}
            agencyName={agency.name}
            memberCount={agency.member_count}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
          {isSuperAdmin && (
            <AgencyChangeOwnerDialog
              agencyId={agency.id}
              currentOwnerName={ownerName}
              open={changeOwnerOpen}
              onOpenChange={setChangeOwnerOpen}
            />
          )}
        </>
      )}
    </div>
  );
}
