'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import { companyEventKeys } from './query-keys';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.

/**
 * The confirmation sheet — allocation day when the farm has no network.
 *
 * The pickup team exports once the buses are loaded, shares the file with
 * whoever is on the land, and the ground team ticks people off against the
 * block and plot already assigned to them. The file comes back and is uploaded.
 *
 * The merge is one-way: a tick promotes somebody to confirmed, an untick never
 * takes a confirmation away. A file that has been through a phone, a laptop and
 * possibly Excel is good evidence that somebody WAS given their land, and poor
 * evidence that they were not.
 */

const CONFIRMATION_SHEET = parse(`
  query EventConfirmationSheet($eventId: ID!, $pickupLocationId: ID) {
    eventConfirmationSheet(eventId: $eventId, pickupLocationId: $pickupLocationId) {
      attendance_id
      name
      phone
      email
      pickup_location
      size_reserved
      eligibility_tier
      plots
      boarded
      given
    }
  }
`) as unknown as TypedDocumentNode<
  { eventConfirmationSheet: ConfirmationSheetRow[] },
  { eventId: string; pickupLocationId?: string | null }
>;

export interface ConfirmationSheetRow {
  attendance_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  pickup_location: string | null;
  size_reserved: number;
  eligibility_tier: string | null;
  /** Flattened for a spreadsheet — "C 14", or "C 14, C 15" for two plots. */
  plots: string;
  boarded: boolean;
  given: boolean;
}

const APPLY_SHEET = parse(`
  mutation ApplyEventConfirmationSheet(
    $eventId: ID!
    $rows: [EventConfirmationUploadRow!]!
    $apply: Boolean
  ) {
    applyEventConfirmationSheet(eventId: $eventId, rows: $rows, apply: $apply) {
      rows_received
      ticked
      newly_confirmed
      already_confirmed
      unmatched
      applied
    }
  }
`) as unknown as TypedDocumentNode<
  { applyEventConfirmationSheet: ApplySheetResult },
  { eventId: string; rows: { attendanceId: string; given: boolean }[]; apply?: boolean }
>;

export interface ApplySheetResult {
  rows_received: number;
  ticked: number;
  newly_confirmed: number;
  already_confirmed: number;
  /** Ids not on this event, or not readable as ids at all. Never dropped silently. */
  unmatched: string[];
  applied: boolean;
}

/** Fetched on demand rather than with the page — it is a download, not a view. */
export const fetchConfirmationSheet = (eventId: string, pickupLocationId?: string | null) =>
  execute(CONFIRMATION_SHEET, { eventId, pickupLocationId: pickupLocationId ?? null }).then(
    (d) => d.eventConfirmationSheet
  );

/**
 * Preview, then apply — the same mutation twice.
 *
 * Nothing is written without `apply`, because the counts are the only chance to
 * notice that a column was renamed or a row eaten between the field and here.
 */
export const useApplyConfirmationSheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      rows,
      apply,
    }: {
      eventId: string;
      rows: { attendanceId: string; given: boolean }[];
      apply?: boolean;
    }) => execute(APPLY_SHEET, { eventId, rows, apply }).then((d) => d.applyEventConfirmationSheet),
    onSuccess: (result) => {
      // Only a real apply moves anything; a preview must not blow the cache.
      if (result.applied) {
        queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
      }
    },
  });
};

/** The column the ground team fills in. Accepts what people actually type. */
export const GIVEN_TRUE = ['y', 'yes', 'true', '1', 'given', 'x', '✓'];

/**
 * Read a returned sheet.
 *
 * Deliberately forgiving about everything except the id: the file has been
 * through a phone, a laptop and possibly Excel, so headers arrive re-cased,
 * re-spaced, and occasionally quoted. The id column is the one thing that must
 * survive intact, and an unreadable row is reported rather than guessed at.
 */
export const parseConfirmationCsv = (
  text: string
): { rows: { attendanceId: string; given: boolean }[]; skipped: number } => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { rows: [], skipped: 0 };

  const splitRow = (line: string) => {
    // Enough CSV for a file we generated: quoted fields, doubled quotes inside.
    const out: string[] = [];
    let cur = '';
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };

  const header = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''));
  const idIdx = header.findIndex((h) => h.includes('attendanceid') || h === 'attendanceid');
  const givenIdx = header.findIndex((h) => h.includes('given'));
  if (idIdx === -1 || givenIdx === -1) return { rows: [], skipped: lines.length - 1 };

  const rows: { attendanceId: string; given: boolean }[] = [];
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cells = splitRow(line);
    const attendanceId = (cells[idIdx] ?? '').trim();
    if (!attendanceId) { skipped++; continue; }
    const raw = (cells[givenIdx] ?? '').trim().toLowerCase();
    rows.push({ attendanceId, given: GIVEN_TRUE.includes(raw) });
  }
  return { rows, skipped };
};
