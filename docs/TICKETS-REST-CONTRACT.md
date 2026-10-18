# Support Tickets — FE port guide

**Status: ✅ real.** The v2 controllers shipped. Source of truth for routes and
shapes is `abode-be-v2/docs/SUPPORT-TICKETS-DESIGN.md` §5–8 — don't duplicate it
here. This file covers only what the FE port needs: the route map it codes
against, and every place the REST surface behaves differently from the GraphQL
one it replaces.

Controllers: `support-ticket-admin.controller.ts`, `issue-admin.controller.ts`,
`support-ticket-ops.controller.ts`. All under `/api/v1`.

---

## Route map (what the hooks call)

| Hook | Method | Path |
|---|---|---|
| `useTickets` | GET | `admin/tickets` |
| `useTicketQueueStats` | GET | `admin/tickets/stats` |
| `useTicketCategories` | GET | `admin/tickets/categories` |
| `useTicket` | GET | `admin/tickets/:id` |
| `useCreateTicket` | POST | `admin/tickets` |
| `useUpdateTicket` | PATCH | `admin/tickets/:id` |
| `useReplyToTicket` | POST | `admin/tickets/:id/reply` |
| `useResolveTicket` | POST | `admin/tickets/:id/resolve` |
| `useClassifyTicket` | POST | `admin/tickets/:id/classify` |
| `useMergeTickets` | POST | `admin/tickets/:loser_id/merge-into/:winner_id` |
| `useAddTicketNote` | POST | `admin/tickets/:id/notes` |
| *(new)* | PATCH / DELETE | `admin/tickets/notes/:note_id` |
| `useAddTicketCollaborator` | POST | `admin/tickets/:id/collaborators` |
| `useRemoveTicketCollaborator` | DELETE | `admin/tickets/:id/collaborators/:admin_id` |
| `useTicketUserSuggestions` | GET | `admin/tickets/:id/suggest-users` |
| `useTicketIssueSuggestions` | GET | `admin/tickets/:id/suggest-issues` |
| `useIssues` | GET | `admin/issues` |
| `useIssue` | GET | `admin/issues/:id` |
| `useCreateIssue` | POST | `admin/issues` |
| `useUpdateIssue` | PATCH | `admin/issues/:id` |
| `useResolveIssue` | POST | `admin/issues/:id/resolve` |
| `useLinkTicketToIssue` | POST | `admin/issues/:id/tickets/:ticket_id` |
| `useUnlinkTicketFromIssue` | DELETE | `admin/issues/tickets/:ticket_id` |
| `useSimilarTickets` | GET | `admin/issues/similar-tickets?search=` |

Unused by the port, available if wanted: `ingestion/status`, `ingestion/runs`,
`ingestion/trigger`, `analytics`, `analytics/classifier`, `export`,
`classify/pending`.

---

## Behaviour changes the components must absorb

These are not shape differences the Zod schemas can hide. Each one changes what
the UI has to do.

**1. Optimistic concurrency.** `PATCH /:id` and `POST /:id/resolve` accept
`expected_updated_at`. A mismatch is **400 with `code: "TICKET_STALE_STATE"`** —
not 409. Branch on `ApiClientError.code`, never the message. There is no fresh
value in the body, so the handler refetches the detail and tells the user
someone else moved it. Sending the field is optional; not sending it means
last-write-wins, which is the wrong default for a shared queue.

**2. Linking is enforced, not advised.** `POST /admin/issues/:id/tickets/:ticket_id`
**rejects** a ticket whose `type !== 'fault'`. GraphQL only printed a hint. The
Link-to-issue control must be disabled for non-fault tickets with a reason,
or the user meets a 400 they can't act on.

**3. `confirm_customers_contacted` is now conditional.** Required only when
`notify_users` is `false`; the default is to notify. Previously it was
unconditional. `ResolveIssueDialog` should ask for the confirmation only when
the operator turns notification off.

**4. Minimum lengths are validated server-side.** Resolution ≥ 20 chars, note
≥ 5. Mirror both client-side so the composer says so before the round trip.

**5. `PATCH` refuses `status: 'resolved'`** with a specific message pointing at
the resolve endpoint. The status dropdown already omits it — keep that.

**6. `:id` accepts a `ticket_ref`.** Deep links can carry `TKT-123456`, which is
what support pastes to each other.

**7. Notes are editable and soft-deletable** — new capability, own notes only
unless super admin. `TicketTimeline` can grow the affordance.

---

## Gating

No route carries a permission key. `@AdminAuth()` answers "are you an admin at
all"; the service decides reach and field privilege per request, against the
row. That is deliberate — a flat `view_tickets` would look like security and
would in fact hand every admin the whole complaint book.

For rendering, `GET auth/admin/me` returns `permissions[]` and
`role.is_super_admin`. The four bespoke flags on the GraphQL `adminSession` go
away:

| UI decision | Permission |
|---|---|
| Routing chips, the two manager filters | `manage_all_tickets` or `route_tickets` |
| Classify, assign, collaborators, link, resolve | `manage_all_tickets`, or an active CS Manager |
| Read, reply, internal notes | any admin who can reach the ticket |

Hidden controls are legibility, not security — every one is re-decided
server-side, and the list itself is scoped.

---

## Wire conventions

- snake_case bodies and responses (`user_affected_id`, `filter_counts`,
  `oldest_open_hours`). The Zod schemas are written to that; no mapping layer.
- Standard envelope, unwrapped by `apiGet`/`apiPost`.
- `forbidNonWhitelisted`: an unknown body field is a hard 400, so send exactly
  the DTO's fields.
- Errors carry a machine-readable `code` alongside the message. Branch on it.
