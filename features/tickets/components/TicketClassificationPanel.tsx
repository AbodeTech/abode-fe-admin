"use client";

import { AlertTriangle, Bot, Loader2, RefreshCw, Sparkles, User2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FieldSource,
  TicketType,
  type GetTicketQuery,
} from "@/lib/gql/graphql";
import { useTicketCategories } from "../hooks/use-tickets";
import {
  useClassifyTicket,
  useUpdateTicket,
} from "../hooks/use-ticket-mutations";
import {
  AUTO_WRITE_CONFIDENCE,
  TYPE_LABELS,
  TYPE_OPTIONS,
  categoryLabel,
  formatConfidence,
} from "../lib/ticket-display";

type Ticket = GetTicketQuery["getTicket"]["ticket"];

interface Props {
  ticket: Ticket;
}

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * What this ticket is about, what kind of thing it is, and who decided.
 *
 * The provenance markers are the point. The BE stores what the classifier
 * proposed next to what a human ended up choosing precisely so the override
 * rate is measurable — that only works if a person can see, at a glance,
 * whether they are looking at a machine guess or a colleague's decision.
 *
 * Editing either field stamps it `human` BE-side, which also protects it from
 * being overwritten by a later re-classify.
 */
export function TicketClassificationPanel({ ticket }: Props) {
  const { data: categories = [] } = useTicketCategories();
  const update = useUpdateTicket();
  const classify = useClassifyTicket();

  const ai = ticket.ai;
  const confidence = ai?.confidence ?? null;
  // Below the BE's threshold nothing is written — the value is a suggestion only.
  const wasConfident = confidence != null && confidence >= AUTO_WRITE_CONFIDENCE;

  const handleCategory = async (value: string) => {
    try {
      await update.mutateAsync({ ticketId: ticket._id, category: value || null });
      toast.success("Category updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const handleType = async (value: string) => {
    try {
      await update.mutateAsync({
        ticketId: ticket._id,
        type: (value || null) as TicketType | null,
      });
      toast.success("Type updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update type");
    }
  };

  const handleReclassify = async () => {
    try {
      await classify.mutateAsync(ticket._id);
      toast.success("Classification re-run");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to re-classify");
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
          Classification
        </h3>
        <button
          type="button"
          onClick={handleReclassify}
          disabled={classify.isPending}
          className="inline-flex items-center gap-1 text-[11px] text-[#00695C] hover:text-[#004D40] font-medium disabled:opacity-50"
        >
          {classify.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          Re-run
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Type" source={ticket.type_source}>
          <select
            value={ticket.type ?? ""}
            onChange={(e) => handleType(e.target.value)}
            disabled={update.isPending}
            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
          >
            <option value="">Unclassified</option>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category" source={ticket.category_source}>
          <select
            value={ticket.category ?? ""}
            onChange={(e) => handleCategory(e.target.value)}
            disabled={update.isPending}
            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
          >
            <option value="">Unclassified</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Only faults are meant to group under a root-cause Issue. The BE
          documents this but doesn't enforce it, so this advises. */}
      {ticket.type === TicketType.Fault && !ticket.issue && (
        <p className="text-[11px] text-gray-500">
          Faults can be grouped under a root-cause issue — link one if this is
          part of something wider.
        </p>
      )}

      {ai?.error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-700 mt-0.5 shrink-0" />
          <div className="text-[11px] text-amber-900">
            <p className="font-medium">Classification didn&apos;t run</p>
            <p>{ai.error} — classify by hand above, or re-run.</p>
          </div>
        </div>
      ) : ai?.classified_at ? (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <span className="font-medium">The model proposed</span>
            {confidence != null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-medium",
                  wasConfident
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {formatConfidence(confidence)} confident
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-700">
            {ai.suggested_type ? TYPE_LABELS[ai.suggested_type] : "no type"}
            {" · "}
            {categoryLabel(ai.suggested_category) ?? "no category"}
            {!wasConfident && (
              <span className="text-amber-700">
                {" "}
                — below the auto-apply threshold, so suggested only
              </span>
            )}
          </p>
          {ai.affected_hints.length > 0 && (
            <div className="pt-0.5">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                Identifiers found in the body — never auto-linked
              </p>
              <ul className="flex flex-wrap gap-1">
                {ai.affected_hints.map((h, i) => (
                  <li
                    key={`${h.value}-${i}`}
                    title={h.note ?? undefined}
                    className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-700"
                  >
                    <span className="text-gray-400">{h.kind}:</span> {h.value}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-gray-400">
            {ai.model} · {formatWhen(ai.classified_at)}
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">
          Not classified — logged by hand, or ingested before classification.
        </p>
      )}
    </section>
  );
}

/** Labelled control with a provenance marker. Human-set values carry no badge:
 *  the machine is what warrants one, and badging everything is just noise. */
function Field({
  label,
  source,
  children,
}: {
  label: string;
  source?: FieldSource | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-500">
          {label}
        </span>
        {source === FieldSource.Ai && (
          <span
            title="Set by the classifier — change it to override"
            className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 text-violet-700 px-1 py-0.5 text-[9px] font-medium"
          >
            <Bot className="h-2.5 w-2.5" />
            AI
          </span>
        )}
        {source === FieldSource.Human && (
          <span
            title="Set by a person"
            className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 text-gray-600 px-1 py-0.5 text-[9px] font-medium"
          >
            <User2 className="h-2.5 w-2.5" />
            Human
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
