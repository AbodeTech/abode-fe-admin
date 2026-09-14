# Company Events — Offline Ground-Confirmation Scanner (Design Doc)

> Status: **planning reference only** — no code exists for this yet. Written to give
> the team enough of the flow to sequence and estimate the build, per
> `docs/COMPANY-EVENTS-ALLOCATION-PLAN.md` §3.6/§6.7/§6.8 and the finalized
> decisions doc (items #7 and #8). Supersedes the two-paragraph sketch in the
> original plan with the actual architecture.

## 1. Why this exists, and why it's a second scanner

Company Events' allocation flow has two physical checkpoints on event day, and they
are **not the same scan**:

| | Bus boarding (§3.5, already scoped — near-verbatim port of the Academy kiosk) | Ground confirmation (this doc) |
|---|---|---|
| When | Getting on the bus to the site | After the physical land-allocation process completes, on-site |
| Confirms | "This person is present and headed to the site" | "This person actually received their plot today" |
| Device | Bus-side volunteer's phone, PIN-gated kiosk page | Staff phone/tablet, PWA |
| Network | Assumed online (kiosk page, live API calls) | **Assumed unreliable-to-absent** — the whole reason this doc exists |
| Timestamp written | `checked_in_at` | `confirmed_at` |
| Failure signal | No-show: never boarded | Boarded but never ground-confirmed — "started but didn't finish" |

A boarding scan without a later ground-confirm is a real, distinct ops signal (bus
showed up, allocation didn't happen for that person — could be a capacity
shortfall, a paperwork problem, or the person leaving early). Collapsing the two
into one scan would erase that signal, which is why the original plan treats them
as separate endpoints and separate timestamps.

The ground scan is architecturally harder than boarding because **the site itself
may have no reliable connectivity** — this is new land, often without built-out
infrastructure. Nothing else in this repo or `abode-v2` has an offline-first
requirement; this is genuinely new ground (no pun intended) for both apps.

## 2. The three phases of one scan session

```
┌──────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│  1. PRE-SYNC      │ --> │  2. OFFLINE SCANNING  │ --> │  3. RECONNECT SYNC    │
│  (must be online) │     │  (assumes no network) │     │  (best-effort online) │
└──────────────────┘     └──────────────────────┘     └───────────────────────┘
```

A staff member cannot skip phase 1 — see §4's blocking rule. Phases 2 and 3 can
interleave in practice (a device that regains signal mid-event syncs opportunistically,
then goes offline again), but the state machine only has these three phases; there's
no fourth "partially synced" phase the UI needs to represent.

## 3. Data model

No new persistent collections on the backend beyond what
`COMPANY-EVENTS-ALLOCATION-PLAN.md` §2 already defines (`EventAllocation` with its
`checked_in_at` / `confirmed_at` fields). This doc is about the **client-side**
offline store and the **sync** contract, not new server-side schema.

### 3.1 IndexedDB (device-local, per staff device)

No offline/IndexedDB code exists anywhere in either repo today (confirmed in the
original plan, §3.6) — this is the first. Proposed object stores, one database per
event (`company-event-{event_id}`, so switching events on the same device doesn't
mix rosters or queues):

```ts
// Store: "roster" — one row per person valid to ground-confirm at this event.
// Populated in phase 1, read-only during phase 2.
interface RosterEntry {
  token_hash: string;        // primary key — same comparability as the BE's stored hash, see §5.1
  name: string;
  size_reserved: number;
  eligibility_tier: 'land' | 'land_and_dev_levy';
  status: 'boarded' | 'confirmed'; // confirmed = already ground-confirmed as of last sync
}

// Store: "scan_queue" — one row per scan performed offline, in commit order.
// Append-only until synced; entries are removed only after a server ack.
interface QueuedScan {
  id: string;                // client-generated (crypto.randomUUID()), NOT the token — see §5.2
  token: string;              // the raw scanned token (not the hash — hashing happens server-side)
  scanned_at: string;         // ISO, device clock — see §7.3 for the clock-skew caveat
  device_id: string;          // stable per-install id, see §3.2
  action: 'confirm';
  sync_state: 'pending' | 'synced' | 'failed';
  server_outcome?: 'confirmed' | 'already' | 'duplicate' | 'invalid'; // filled in after sync
}

// Store: "meta" — single-row device/session bookkeeping.
interface ScannerMeta {
  event_id: string;
  device_id: string;
  roster_fetched_at: string;  // drives the staleness gate in §4
  last_sync_at: string | null;
}
```

### 3.2 Device identity

`device_id` is a `crypto.randomUUID()` generated on first load and persisted in
`localStorage` (not IndexedDB — it must survive an IndexedDB wipe, and it's tiny).
It identifies **the device**, not the logged-in staff member — the kiosk PIN model
from the boarding scanner (`x-checkin-pin`, a shared per-event PIN, not per-user
login) carries over here for the same reason: this runs on a shared staff device,
not a personal account.

## 4. Phase 1 — pre-sync (must be online)

Per decision #7 ("Ground scanners must download the full attendee roster to the
device *before* going offline... recommend blocking offline/scan mode if the
roster hasn't been refreshed within a set time window"):

1. Staff opens the scanner PWA, selects the event (`GET /checkin/events` — reused
   from the boarding scanner's endpoint list, filtered to events with a boarding
   phase already underway).
2. App calls `GET /checkin/events/:event_id/roster` (already named in the original
   plan's endpoint table, §4) — returns every `EventAllocation` at
   `checked_in_at`-set-or-later status for that event, with just the fields
   `RosterEntry` needs (§3.1). This is intentionally a **flat, denormalized**
   payload — no joins the device would need to resolve offline.
3. Roster is written into IndexedDB, `roster_fetched_at` stamped in `meta`.
4. **Freshness gate**: `roster_fetched_at` must be within **N hours** (open
   question — see §9) of "now" before the Scan tab unlocks. A stale or missing
   roster shows a full-screen blocking state: *"Roster out of date — reconnect to
   refresh before scanning."* with a manual "Refresh roster" action. This is a hard
   block, not a dismissible warning — decision #7 explicitly calls out the failure
   mode (staff forgetting to pre-sync) as the thing to design against, and a
   dismissible warning gets dismissed.
5. Re-running phase 1 (a manual refresh, or the app noticing it's back online) is
   **non-destructive to the scan queue** — it replaces the `roster` store but never
   touches `scan_queue`. A staff member who refreshes the roster mid-event doesn't
   lose scans they've already taken.

## 5. Phase 2 — offline scanning

Reuses the `@zxing/browser` scan UI from the boarding kiosk (`CheckinKioskPage`
pattern per `CHECKIN-KIOSK-MIGRATION.md` §4) — same camera-scan / manual-paste /
search-fallback triad, wrapped with local-only validation instead of a network
call.

### 5.1 Local validation

A scan produces a raw token string (from the QR payload or manual paste, same
`https://abodeflex.ng/checkin?token=...&purpose=confirm`-shaped URL the plan
already establishes in §3.3, with `purpose=confirm` distinguishing it from the
boarding QR's `purpose=boarding`). The device cannot verify the token's signature
offline (no server, no secret) — instead:

1. Hash the token client-side with the **same hash function and comparability
   the roster entries were keyed by** (`token_hash` in `RosterEntry`) — this
   requires the roster endpoint to return a hash comparable client-side (e.g. a
   keyed HMAC using a per-event public salt handed out with the roster, *not*
   the server's private signing secret) rather than the raw token, so a stolen
   roster snapshot can't be used to forge tokens. This needs backend design work
   before it can be built — flagged as an open question in §9, not resolved here.
2. Look up the hash in the local `roster` store:
   - **Not found** → "Not on this event's roster" — could be a boarding-scanner
     token used by mistake (different `purpose`), a stale roster, or an invalid
     scan. Shown distinctly from "already confirmed" so staff can tell which one
     it is without guessing.
   - **Found, `status: 'boarded'`** → optimistic local success: show name + size,
     write a `QueuedScan` row, flip the local roster entry's status to
     `'confirmed'` immediately (so a second scan of the same person on the *same*
     device shows "already confirmed" without waiting for sync).
   - **Found, `status: 'confirmed'`** → "Already confirmed" shown immediately,
     still logs a `QueuedScan` row (see §5.2 on why duplicates aren't dropped
     client-side).
3. Every outcome is optimistic and local — there is no network round-trip in this
   phase. The `sync_state: 'pending'` scans are the durable record until phase 3.

### 5.2 Why duplicates aren't deduplicated on the device

Decision #8 ("If two staff devices scan the same person while both offline, the
system merges results on reconnect and must **surface the overlap to staff**...
rather than silently absorbing it") means the *server* needs to see every scan
that happened, even ones the device already knows are locally redundant — a
device dropping its own duplicate scan would also drop the evidence that a
cross-device duplicate occurred. So: **every scan is queued**, even a same-device
re-scan of someone already flipped to `'confirmed'` locally. The dedup and the
"surface it" behavior both happen server-side, in phase 3.

This is also why `QueuedScan.id` is a client-generated UUID rather than being
keyed by token — multiple scans of the same person, from the same or different
devices, are multiple distinct queue rows, not one row overwritten.

## 6. Phase 3 — reconnect sync

### 6.1 Trigger

Per the original plan's already-noted caveat: "a background sync (service worker
`sync` event, or a simple 'online' listener + manual 'Sync now' button as a
fallback since background sync isn't universally supported)." Concretely:

- `window.addEventListener('online', ...)` fires an automatic sync attempt.
- A visible "Sync now" button is always available (not just on reconnect) — staff
  on a flaky connection shouldn't have to wait for the browser's online event to
  fire correctly.
- A persistent badge shows the pending-scan count (`scan_queue` rows with
  `sync_state: 'pending'`) so staff always know whether they're carrying
  unsynced work.

### 6.2 Request

```ts
POST /checkin/events/:event_id/confirm-sync
// body
{
  scans: [
    { token: string, scanned_at: string, device_id: string }
    // batched — every currently-pending QueuedScan row, id not sent (server
    // doesn't need the client's local row id, only enough to identify and
    // order the scan)
  ]
}
```

Batch size: cap at **200 scans per request** (a single device is very unlikely to
queue more than this in one offline stretch, and it keeps a single sync request
from being an all-or-nothing multi-minute transaction). A device with more than
200 pending scans sends multiple sequential batches.

### 6.3 Server-side idempotent merge

Already specified in the original plan (§3.6 step 4) and restated here for
completeness against decision #8:

- First `confirmed_at` write for a given `EventAllocation` wins.
- Every subsequent write for the same allocation — same device replaying after a
  failed ack, or a genuinely different device — comes back tagged, never as an
  error:

```ts
// response
{
  results: [
    { token: string, outcome: 'confirmed' | 'already' | 'duplicate' | 'invalid' }
  ]
}
```

  - `confirmed` — this was the first successful write for this token in the batch/DB.
  - `already` — this token was already `confirmed_at`-set before this sync ran at
    all (e.g. another device synced first, or this token was in a prior partial
    sync from this same device).
  - `duplicate` — this token was confirmed **by an earlier scan in this same
    batch** (server-side dedup within one request, for a device that queued the
    same token twice offline).
  - `invalid` — token doesn't resolve to an allocation on this event at all
    (expired, tampered with, or wrong event).

### 6.4 Client-side reconciliation

For each result: mark the matching `QueuedScan` row `sync_state: 'synced'` with
`server_outcome` set, remove it from the "pending" count. `outcome: 'already'` or
`'duplicate'` rows are **not** treated as failures — they're removed from pending
just the same, but surfaced (§6.5) rather than silently discarded, per decision #8.

A request that fails entirely (no network mid-request, 5xx) leaves every scan in
that batch at `sync_state: 'pending'` — safe to retry the whole batch, since the
server-side merge is idempotent per §6.3.

### 6.5 Surfacing duplicates to staff

Decision #8 is explicit that silent absorption is the failure mode to avoid. After
a sync completes, if any result came back `already` or `duplicate`:

- A toast/banner: *"Sync complete — N confirmed, **M duplicate scans resolved**."*
- Tapping it opens a small list: name, which device(s) scanned them, at what
  local times — enough for a supervisor to decide whether the duplicate is
  explainable (two staff covering the same crowd) or worth flagging as a possible
  double-allocation attempt.
- This list is client-side only (built from the synced `QueuedScan` rows' outcomes
  + roster names) — no new backend read endpoint is strictly required for it,
  though a `GET .../confirm-sync/history` for a supervisor's cross-device view is
  a reasonable follow-up (see §9).

## 7. UI states

```
┌─ Not pre-synced ──────────┐   ┌─ Ready to scan ───────────┐   ┌─ Pending sync ─────────────┐
│ Blocking screen.          │   │ Camera/manual/search, per │   │ Badge: "N pending".        │
│ "Refresh roster" CTA.     │──>│ the boarding kiosk's UI.  │──>│ "Sync now" always visible. │
│ (§4)                      │   │ Optimistic local results. │   │ Auto-fires on 'online'.    │
└────────────────────────────┘   └────────────────────────────┘   └────────────┬───────────────┘
                                                                                  │
                              ┌─ Sync result ──────────────────────────────────┐│
                              │ "N confirmed, M duplicates resolved" —         │
                              │ never silent (decision #8). Tap for detail.    │<┘
                              └──────────────────────────────────────────────────┘
```

Additional always-visible chrome: an online/offline indicator (staff need to know
whether "Sync now" will actually do anything), and the roster's age ("Roster
synced 2h ago") so staff can self-assess whether a manual refresh is worth doing
even before hitting the hard block in §4.

## 8. Edge cases

1. **Device clock skew.** `scanned_at` is the device's local clock, which may be
   wrong (no network = no time sync). This only matters for ordering *within* a
   sync batch and for the staff-facing "at what time" display in §6.5 — the
   idempotent-merge logic in §6.3 doesn't depend on `scanned_at` being accurate,
   only on token identity. Don't build anything that trusts `scanned_at` for
   business logic (e.g. "first scan wins" should mean first *server-processed*
   write, not earliest client timestamp, precisely because client timestamps
   aren't trustworthy offline).
2. **Roster grows mid-event.** If more people board after a device's last roster
   fetch, that device can't validate their tokens until it refreshes — they'd hit
   "Not on this event's roster" incorrectly. Mitigated by the always-visible
   manual refresh, not solved outright; a hard real-time push isn't in scope
   given the whole premise is unreliable connectivity.
3. **Partial batch failure.** Network drops mid-request after the server
   processed some scans but before the response reaches the device. The device
   retries the whole batch; §6.3's idempotency means the already-processed scans
   come back `already` rather than double-confirming anyone. No data loss, just
   a few extra `already` results the staff didn't need to see twice — acceptable.
4. **Same person scanned by two devices while both fully offline.** Both show
   local `'confirmed'` optimistically (correct from each device's own
   information). Reconciled at sync time per §6.3/§6.5 — this is the exact
   scenario decision #8 is about, and it is **not** an error state, just a
   reported one.
5. **Staff clears the browser/PWA storage mid-event.** Roster and queue are both
   gone. This is indistinguishable from a fresh install — the app re-enters phase
   1 and blocks scanning until re-synced. Any scans queued but not yet synced
   before the clear are **lost** — this is a real gap with no client-side fix;
   worth a one-line warning in the PWA's install/update UX, not a technical
   mitigation.
6. **Capacity is not enforced here.** Unlike the allocation-save endpoint
   (`POST .../allocations`), ground confirmation doesn't consume or check
   capacity — the person was already allocated (and counted) at save time. This
   endpoint only ever flips a status and timestamp on an existing allocation; it
   can't create a new one or exceed anything.

## 9. Open questions (not resolved by this doc)

1. **Token-hash scheme for offline comparability (§5.1).** Needs a real backend
   design: a per-event public salt handed out with the roster, HMAC'd token
   hashes that are comparable client-side without exposing the server's signing
   secret. This is the one piece of this doc that's a genuine unknown rather than
   a design choice — flagging it rather than guessing at a scheme.
2. **Roster staleness window (§4).** "N hours" needs a real number — probably
   driven by how long a single event day runs (an event starting at 9am and
   running to 4pm needs the roster to stay valid all day without forcing a
   refresh staff won't remember to do). Suggest starting at **8 hours** and
   revisiting after the first real event.
3. **Offline queue capacity / storage limits.** IndexedDB has no hard cap in
   practice for this data volume (a few hundred scans is trivially small), so
   this is likely a non-issue — noted only so it's not silently assumed away.
4. **PWA installability requirements.** Does this need to be an installable PWA
   (manifest, service worker precaching the app shell so it loads with zero
   network) or is "already-loaded tab kept open all day" an acceptable v1? The
   offline **data** story (§3–§6) is the same either way; only the **app-shell**
   loading story changes. Recommend deferring a full installable PWA to a v2 and
   shipping with "keep the tab open, roster/queue survive a reload" for v1 — the
   app-shell problem is orthogonal to the actual offline-scan problem this doc
   solves.
5. **Supervisor-facing duplicate history endpoint** (§6.5) — worth having, not
   designed here.

## 10. Suggested build sequence

Per the original plan's overall sequencing (§7), this was already flagged as
"sequence last — highest engineering risk, net-new offline architecture, needs
the roster/token model stable first." Within this scanner specifically:

1. Backend: the token-hash scheme (§9.1) — blocks everything else.
2. Backend: `GET .../roster` and `POST .../confirm-sync` per §6.2/§6.3.
3. Frontend: IndexedDB stores (§3.1) + phase 1 pre-sync flow + the staleness gate,
   buildable and testable against the real roster endpoint before any offline
   logic exists.
4. Frontend: phase 2 scan UI, reusing the boarding kiosk's camera/manual/search
   components, swapped to local-only validation.
5. Frontend: phase 3 sync + reconciliation UI, including the duplicate-surfacing
   list (§6.5).
6. Manual E2E: put a device in airplane mode mid-event, scan a batch, reconnect,
   confirm the sync result and duplicate surfacing — this whole feature only
   proves itself under a real offline/online transition, not just unit tests
   against a mocked API.
