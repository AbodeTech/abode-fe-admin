"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, PencilLine } from "lucide-react";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Pagination } from "@/components/shared/Pagination";

import {
  DEFAULT_FULFILLMENT_LIMIT,
  useFulfillmentCounts,
  usePrizeFulfillment,
  useUpdatePrizeFulfillment,
  type FulfillmentStatus,
  type PrizeFulfillmentRow,
} from "../hooks/use-prize-fulfillment";

const STATUS_STYLES: Record<FulfillmentStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  contacted: { label: "Contacted", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800 hover:bg-green-100" },
};

const STATUS_TABS = [
  { label: "Pending", value: "pending" },
  { label: "Contacted", value: "contacted" },
  { label: "Delivered", value: "delivered" },
  { label: "All", value: "all" },
];

const PRIZE_OPTIONS = [
  { label: "All prizes", value: "all" },
  { label: "Hampers (1 Acre)", value: "hamper" },
  { label: "Trips (8 Acres)", value: "trip" },
  { label: "Cars (25 Acres)", value: "car" },
  { label: "Wheel prizes", value: "wheel" },
];

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

export function PrizeFulfillmentTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "pending";
  const prize = searchParams.get("prize") || "all";
  const search = searchParams.get("q") || "";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && !(key === "status" && value === "pending")) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const { data, isLoading } = usePrizeFulfillment({
    status,
    prize,
    search,
    page,
    limit: DEFAULT_FULFILLMENT_LIMIT,
  });
  const { data: counts, isLoading: countsLoading } = useFulfillmentCounts();

  const [updateRow, setUpdateRow] = useState<PrizeFulfillmentRow | null>(null);

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="min-w-0 space-y-4">
      {/* Stat strip */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {(
          [
            { key: "pending", label: "Pending", tone: "text-orange-600" },
            { key: "contacted", label: "Contacted", tone: "text-blue-600" },
            { key: "delivered", label: "Delivered", tone: "text-green-600" },
          ] as const
        ).map((card) => (
          <Card key={card.key} className="min-w-0 border-none shadow-sm">
            <CardContent className="p-4">
              {countsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${card.tone}`}>
                    {counts?.[card.key] ?? 0}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setParam("status", tab.value)}
            className={status === tab.value ? "pointer-events-none" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2 md:col-span-2">
          <Label className="text-sm text-muted-foreground">Search</Label>
          <Input
            className="min-w-0"
            placeholder="Search by associate name, email, or prize"
            value={search}
            onChange={(event) => setParam("q", event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label className="text-sm text-muted-foreground">Prize</Label>
          <Select value={prize} onValueChange={(value) => setParam("prize", value)}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All prizes" />
            </SelectTrigger>
            <SelectContent>
              {PRIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Queue */}
      {isLoading ? (
        <Card className="min-w-0 border-none shadow-sm">
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="min-w-0 border-none shadow-sm">
          <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
            <AdminMobileStack>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing in this queue.
                </p>
              ) : (
                rows.map((row) => (
                  <AdminMobileCard key={row.id} title={row.associateName} subtitle={row.associateEmail}>
                    <AdminMobileField label="Phone" value={row.associatePhone} />
                    <AdminMobileField
                      label="Prize"
                      value={
                        <span className="flex flex-wrap items-center gap-1.5">
                          {row.prize}
                          <Badge variant="outline" className="font-normal">{row.sourceDetail}</Badge>
                        </span>
                      }
                    />
                    <AdminMobileField label="Earned" value={formatDate(row.earnedAt)} />
                    <AdminMobileField
                      label="Status"
                      value={
                        <Badge variant="secondary" className={STATUS_STYLES[row.status].className}>
                          {STATUS_STYLES[row.status].label}
                        </Badge>
                      }
                    />
                    {row.lastNote && <AdminMobileField label="Last note" value={row.lastNote} />}
                    <div className="border-t border-border pt-2">
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setUpdateRow(row)}>
                        <PencilLine className="h-4 w-4" />
                        Update status
                      </Button>
                    </div>
                  </AdminMobileCard>
                ))
              )}
            </AdminMobileStack>

            <AdminDesktopTableWrap>
              <Table className="w-max min-w-[1200px] table-auto text-sm">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {["Associate", "Prize", "Source", "Earned", "Status", "Last Note", "Action"].map((h) => (
                      <TableHead
                        key={h}
                        className="min-w-32 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground">
                        Nothing in this queue.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                          <span className="block wrap-break-word font-medium">{row.associateName}</span>
                          <span className="block wrap-break-word text-xs text-muted-foreground">{row.associateEmail}</span>
                          <span className="block text-xs text-muted-foreground">{row.associatePhone}</span>
                        </TableCell>
                        <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word font-medium">
                          {row.prize}
                        </TableCell>
                        <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                          <Badge variant="outline" className="font-normal">{row.sourceDetail}</Badge>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap px-4 py-4 leading-relaxed">
                          {formatDate(row.earnedAt)}
                        </TableCell>
                        <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="secondary" className={STATUS_STYLES[row.status].className}>
                              {STATUS_STYLES[row.status].label}
                            </Badge>
                            {row.updatedAt && (
                              <span className="text-xs text-muted-foreground">{formatDate(row.updatedAt)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-48 max-w-64 align-top whitespace-normal px-4 py-4 text-xs leading-relaxed text-muted-foreground wrap-break-word">
                          {row.lastNote ?? "—"}
                        </TableCell>
                        <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setUpdateRow(row)}>
                            <PencilLine className="h-4 w-4" />
                            Update status
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </AdminDesktopTableWrap>
          </CardContent>
        </Card>
      )}

      <Pagination count={count} currentIdx={page} limit={DEFAULT_FULFILLMENT_LIMIT} />

      <UpdateFulfillmentModal
        row={updateRow}
        onOpenChange={(open) => !open && setUpdateRow(null)}
      />
    </div>
  );
}

function UpdateFulfillmentModal({
  row,
  onOpenChange,
}: {
  row: PrizeFulfillmentRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdatePrizeFulfillment();
  const [status, setStatus] = useState<FulfillmentStatus>("contacted");
  const [note, setNote] = useState("");

  // Reset per row (state adjustment during render, not an effect).
  const [prevRowId, setPrevRowId] = useState<string | null>(null);
  if (row && row.id !== prevRowId) {
    setPrevRowId(row.id);
    setStatus(row.status === "pending" ? "contacted" : row.status);
    setNote("");
  }

  if (!row) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({ entryId: row.id, status, note: note.trim() });
      toast.success(`${row.associateName}'s ${row.prize} marked ${STATUS_STYLES[status].label.toLowerCase()}.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update. Try again.");
    }
  };

  return (
    <Dialog open={row !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update prize status</DialogTitle>
          <DialogDescription>
            {row.associateName} · {row.prize} ({row.sourceDetail})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-sm">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as FulfillmentStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fulfillment-note" className="text-sm">
            What happened? (internal note)
          </Label>
          <Textarea
            id="fulfillment-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Delivered via dispatch, waybill 4412."
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending || note.trim().length < 5}>
            {update.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
