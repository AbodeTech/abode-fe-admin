"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadCsv } from "../lib/csv";
import {
  fetchConfirmationSheet,
  parseConfirmationCsv,
  useApplyConfirmationSheet,
  type ApplySheetResult,
} from "../hooks/use-confirmation-sheet";

interface Props {
  eventId: string;
  eventTitle: string;
  /** Offered so the team meeting one bus can take only their own list. */
  pickupLocations?: { id: string; name: string }[];
}

const fileStem = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Allocation day when the farm has no network.
 *
 * Export once the buses are loaded, share the file with whoever is on the land,
 * tick people off against the block and plot already assigned to them, then
 * upload it when there is signal again. It exists because the plot scan needs a
 * network the site does not have, and a day cannot wait for one.
 *
 * The upload previews before it writes, and the merge only ever promotes
 * somebody to given — an untick never takes a confirmation away.
 */
export function ConfirmationSheetPanel({ eventId, eventTitle, pickupLocations = [] }: Props) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [preview, setPreview] = useState<ApplySheetResult | null>(null);
  const [pending, setPending] = useState<{ attendanceId: string; given: boolean }[]>([]);
  const [skipped, setSkipped] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const apply = useApplyConfirmationSheet();

  const handleDownload = async (pickupId?: string, pickupName?: string) => {
    setDownloading(pickupId ?? "all");
    try {
      const rows = await fetchConfirmationSheet(eventId, pickupId);
      if (rows.length === 0) {
        toast.error("Nobody on this event is being given land yet.");
        return;
      }
      // Column order is the field order: who, where to find them, which plot,
      // then the one column they fill in. attendance_id leads because it is the
      // key, and the header says not to touch it.
      downloadCsv(
        rows.map((r) => ({
          attendance_id: r.attendance_id,
          name: r.name ?? "",
          phone: r.phone ?? "",
          pickup: r.pickup_location ?? "",
          block_and_plot: r.plots,
          size_sqm: r.size_reserved,
          boarded: r.boarded ? "yes" : "no",
          // Pre-filled for anyone already confirmed, so a second sheet does not
          // ask the field to re-tick work that is already recorded.
          given: r.given ? "yes" : "",
        })),
        `${fileStem(eventTitle)}-confirmations${pickupName ? `-${fileStem(pickupName)}` : ""}.csv`
      );
      const missingPlots = rows.filter((r) => !r.plots).length;
      if (missingPlots > 0) {
        // Said out loud rather than discovered at the plot: a blank here means
        // somebody is going to the field with no plot assigned to show them.
        toast.warning(
          `${missingPlots} of ${rows.length} have no block or plot assigned yet.`
        );
      } else {
        toast.success(`${rows.length} people exported.`);
      }
    } catch (error) {
      toast.error((error as Error).message || "Could not build the sheet");
    } finally {
      setDownloading(null);
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { rows, skipped: bad } = parseConfirmationCsv(text);
    if (rows.length === 0) {
      toast.error(
        "No rows I can read — the file needs its attendance_id and given columns."
      );
      return;
    }
    setPending(rows);
    setSkipped(bad);
    try {
      // Preview first. Nothing is written until the dialog is confirmed.
      const result = await apply.mutateAsync({ eventId, rows });
      setPreview(result);
    } catch (error) {
      toast.error((error as Error).message || "Could not read that sheet");
    }
  };

  const handleApply = async () => {
    try {
      const result = await apply.mutateAsync({ eventId, rows: pending, apply: true });
      toast.success(
        result.newly_confirmed === 0
          ? "Nothing new — everyone ticked was already recorded."
          : `${result.newly_confirmed} recorded as given their land.`
      );
      setPreview(null);
      setPending([]);
    } catch (error) {
      toast.error((error as Error).message || "Could not apply the sheet");
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Allocation day sheet</h3>
      <p className="mt-1 text-xs text-slate-500">
        For a site with no network. Export once the buses are loaded, tick people off
        on the land, then upload the file when you are back in signal. Ticking someone
        records them as having been shown their plot; an untick never removes one.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload()}
          disabled={downloading !== null}
        >
          {downloading === "all" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Whole event
        </Button>

        {pickupLocations.map((p) => (
          <Button
            key={p.id}
            variant="outline"
            size="sm"
            onClick={() => handleDownload(p.id, p.name)}
            disabled={downloading !== null}
          >
            {downloading === p.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {p.name}
          </Button>
        ))}

        <div className="ml-auto">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Cleared so the same file can be picked twice — a corrected
              // re-upload of the same filename is the normal case.
              e.target.value = "";
              if (file) void handleFile(file);
            }}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={apply.isPending}>
            {apply.isPending && !preview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload filled sheet
          </Button>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply this sheet?</DialogTitle>
            <DialogDescription>
              Nothing has been written yet. This is what the file would do.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-2 text-sm">
              <Row label="Rows read" value={preview.rows_received} />
              <Row label="Ticked as given" value={preview.ticked} />
              <Row
                label="Newly recorded"
                value={preview.newly_confirmed}
                tone="text-emerald-700"
              />
              <Row label="Already recorded" value={preview.already_confirmed} />
              {preview.unmatched.length > 0 && (
                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-medium">
                    {preview.unmatched.length} row
                    {preview.unmatched.length === 1 ? "" : "s"} I cannot match
                  </p>
                  <p className="mt-1">
                    Not on this event, or the id column was edited. They will be left
                    alone — nothing is dropped silently.
                  </p>
                </div>
              )}
              {skipped > 0 && (
                <p className="text-xs text-slate-500">
                  {skipped} row{skipped === 1 ? "" : "s"} had no id and were ignored.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)} disabled={apply.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={apply.isPending || (preview?.newly_confirmed ?? 0) === 0}
            >
              {apply.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record {preview?.newly_confirmed ?? 0} as given
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold tabular-nums ${tone ?? "text-slate-900"}`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
