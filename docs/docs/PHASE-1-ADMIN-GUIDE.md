# Phase 1 Admin Guide — Land, Field Operations, Costs and Profitability

What an Abode admin can do with the Phase 1 features, and what the numbers on screen mean. Written from the admin's side of the screen: no endpoints, no request bodies.

Field workers (Site Managers and Surveyors) use a separate mobile app to record their work. This guide covers only what happens in the admin dashboard, and mentions the field app only where it affects what an admin sees.

---

## Contents

1. [The whole flow on one page](#1-the-whole-flow-on-one-page)
2. [Where this lives in the dashboard today](#2-where-this-lives-in-the-dashboard-today)
3. [Setting up an estate's land](#3-setting-up-an-estates-land)
4. [Field staff](#4-field-staff)
5. [Monthly targets](#5-monthly-targets)
6. [Reviewing field work](#6-reviewing-field-work)
7. [Reading performance](#7-reading-performance)
8. [Site setup and plots](#8-site-setup-and-plots)
9. [Allocation events](#9-allocation-events)
10. [Estate costs](#10-estate-costs)
11. [Profitability](#11-profitability)
12. [Selling charges](#12-selling-charges)
13. [Who can do what](#13-who-can-do-what)
14. [Messages you may see](#14-messages-you-may-see)
15. [Glossary](#15-glossary)

---

## 1. The whole flow on one page

```
Set up the estate          Set up the people           Set up the month
─────────────────          ─────────────────           ────────────────
Land configuration   ──▶   Invite a worker      ──▶   Set targets and weights
Approved boundary          They activate               Publish them
Switch to sqm stock        Assign them to the estate

Work happens               You review it               Everything updates once
────────────               ─────────────               ───────────────────────
Worker records work  ──▶   Verify or reject     ──▶   Score, site setup, plot
with photos and cost       (one decision)              history, cost and timeline

Finance                    The result
───────                    ──────────
Accept the cost claim ──▶  Profitability for the estate
```

Nothing a worker records changes a score, the estate's progress or its costs until an admin verifies it. When an admin does, all of those change together, and verifying the same work twice never counts it twice.

---

## 2. Where this lives in the dashboard today

| Area | In the dashboard | Notes |
|---|---|---|
| Field staff: invite, resend invitation, disable, re-enable | ✅ Field Performance → Performance (Invite in the header; the rest under Manage on a person) | |
| Assignments: assign a site, end one | ✅ Performance, with a person picked | Assigning also sets the month's targets |
| Monthly targets: set, publish, revise, finalise, restate, history | ✅ Performance, with a person and site picked | |
| Review queue: verify, reject, reverse | ✅ Field Performance → Review Queue, and "Needs review" on a person | Filter by kind of work |
| Performance: team tiles and table, one person's tiles, sites and recent work | ✅ Field Performance → Performance | One page; pick the role, person, site and month at the top |
| Correct, link plots to unmapped clearing | ❌ Not yet | |
| Blockers, trend, metric league table | ❌ Not yet | |
| Land configuration, sqm inventory | ❌ Not yet | Belongs on the asset pages |
| Site setup, plot inventory, field history | ❌ Not yet | Belongs on the asset pages |
| Allocation event ownership | ❌ Not yet | |
| Costs, profitability, selling charges | ❌ Not yet | Belongs on the asset pages |

The rest of this guide describes how every area works, whether or not it is on screen yet.

---

## 3. Setting up an estate's land

### Land configuration

This is where you say how the estate's land is divided:

- **Total land** in square metres. Nothing else can be set until this is.
- **Products** (Flex, Full Ownership, Commercial, Developer Plot): how much land each may sell, and the plot sizes and planned number of plots for each.
- **Land not for sale**: roads, service plots such as a transformer, recreation and public-use land.

You always save the whole picture at once, with a short reason. Things to know:

- Products plus land not for sale can't add up to more than the total.
- A product's plot sizes can't need more land than the product has.
- **Unclassified land** is land you haven't accounted for yet. That's allowed. It just means the estate isn't fully planned.
- "Planned plots" is a plan, not live stock.
- **If someone else saved while you were editing**, your save is refused rather than overwriting theirs. Reload, then make your change again.

Every save is kept. The history shows who changed what, when and why, with a before-and-after view of each version.

### Approved boundary

The four sides of the estate (front, right, back, left) in metres, from the approved survey. Each save becomes a new version, and fencing progress is always measured against the current one. A Surveyor can propose a new boundary while submitting work, but it only becomes the approved boundary if an admin accepts it while verifying (see §6).

### Switching an estate to square-metre stock

Older estates count stock in "units". Phase 1 counts real square metres. Before an estate switches, a readiness check tells you whether it can:

- **Ready**: you can switch it. Every live payment plan is written into the new stock ledger, so the opening position is right.
- **Not ready**: you get a list of what's blocking it, for example "the estate has no total land size yet", and a per-product and per-plan breakdown of what doesn't fit.

Switching twice is harmless.

### Reading the sqm stock position

| Figure | Meaning |
|---|---|
| Capacity | Land the product may sell |
| Selling | Reserved but not yet settled |
| Sold | Settled |
| Available | What is left to sell |
| Released | Returned to stock |
| Defaulted / Suspended | **Still held**, not available. Shown for information, never added to anything |
| Allocated / Ground-confirmed | Where customers are in the physical process. **Never part of the sales totals** |
| Legacy units | The old unit counters. These are not square metres |

---

## 4. Field staff

### Inviting someone

Invite a person as either a **Site Manager** or a **Surveyor** with their name, email, and optionally a phone number and employee reference.

- They get an email with an **activation link that lasts 72 hours**. They open it, choose a password, and they're in the field app.
- They can't sign up on their own. Only an admin invite creates an account.
- If the link expires or the email is lost, **resend the invitation**. The old link can't be recovered.
- An email that's already used by another field account is refused.
- Field workers only ever get the field app. They can't reach the admin dashboard, and admins don't use the field app.

### Account states

| State | Meaning |
|---|---|
| **Invited** | Invitation sent, not activated yet |
| **Active** | Signed up and working |
| **Disabled** | Access removed by an admin |

**Disabling** someone (with a reason) signs them out of every device straight away. Their assignments, work, targets and scores all stay on record.

**Re-enabling** returns them to Active, or to Invited if they never activated.

### Assigning people to estates

An assignment puts one person on one estate from a start date, with a role on that estate:

| Role | Meaning |
|---|---|
| **Primary** | The main person responsible |
| **Support** | Helping the primary |
| **Relief** | Covering for someone |

- **In the admin dashboard, a site is only assigned together with its targets.** Assigning is two steps: the site details, then the targets for the month the assignment starts, with weights totalling 100%. Both are saved and the targets published in one go, so the worker sees what's expected as soon as they're assigned. If the targets can't be saved, the assignment is undone automatically.
- One person can cover several estates, but only have **one open assignment per estate**. To move someone, end their current assignment first.
- **Ending** an assignment takes a last day and a reason. After that day they can't record new work for that estate. Everything before it stays on record, and work already waiting for review can still be verified.
- A worker can only record work, and only be given targets, for estates they were assigned to on those dates.

---

## 5. Monthly targets

A **scorecard** is one person's targets for one estate in one month.

### What can be targeted

| Metric | Unit | For |
|---|---|---|
| New fencing | metres | Site Managers |
| Customers allocated (confirmed on the ground at an allocation event) | customers | Site Managers |
| Plots parcelled | plots | Surveyors |
| Land cleared | sqm | Surveyors |
| Boundary established | metres | Surveyors |

Each included metric gets a **target** and a **weight**. The weights must total exactly **100%** before the scorecard can be published.

### The lifecycle

```
Draft ──publish──▶ Published ──finalise──▶ Finalised
  ▲                    │                        │
  └──── revise ────────┘                    restate
       (new version)                            │
                                                ▼
                                            Restated ──publish──▶ Published
```

- **Draft**: work in progress. The worker can't see it yet. Weights don't have to add up.
- **Publish**: makes it live for the worker. Needs at least one target and weights of exactly 100%.
- **Revise**: to change published targets, give a reason. This opens a new draft version with the targets copied; publish it when ready. The earlier version stays in the history.
- **Finalise**: closes the month and freezes its score. Only possible once the month has ended.
- **Restate**: reopens a finalised month as a new version, with a reason, when something needs correcting.

Only drafts and restated versions can be edited.

A scorecard can't be created for someone who wasn't assigned to that estate during that month, and there can only be one per person, estate and month.

---

## 6. Reviewing field work

### How work reaches you

A worker records a piece of work in the field app: what they did, where, when, photos, and what it cost (amount, vendor, payment reference, receipt). They send it for review. It then appears in the **review queue**.

- Work has to have at least one photo or document before it can be sent.
- The worker can withdraw it while it's still waiting.
- Some work is recorded but **scores nothing**, and the worker is told so up front:
  - **Fencing repairs** count toward cost and history, not the fencing target.
  - **Re-pegging plots that were already parcelled** (rework) needs a reason and doesn't score again.

### What you see when you open one

- The worker, estate, work date and a one-line summary ("120 m new fencing on the front side")
- The photos, receipt and notes
- The measurements, and the named plots where plots were chosen
- **Warnings**, for example "Fencing on the front side would reach 450 m, which is 50 m more than the approved 400 m"
- What has already been written for it, if anything

### Verify

One decision covers the work **and** its cost. There is no separate finance step at this point.

When you verify:

- **Warnings need an acknowledgement.** If there are any, you're asked for a short note explaining why it's fine before it goes through.
- **If the work changed while you were looking at it**, verifying is refused so you don't approve something you didn't read. Reload and look again.
- **Boundary work with a proposed new boundary** has a separate choice: accept the work only (default), or also accept the proposed sides as the new approved boundary.
- **Verifying twice is safe.** The second time just says it's already verified and changes nothing.

Verifying updates, all at once: the person's score, the estate's site setup, plot history, a **cost claim** for finance (see §10), and the estate's timeline.

### Reject

Give a reason. The worker sees it and can correct and resend the work.

### After verification

| Action | When to use it | What happens |
|---|---|---|
| **Correct** | A verified record had a wrong figure (e.g. 600 m typed instead of 60 m) | The old effects are reversed and the corrected ones written, with a reason |
| **Reverse** | The work was never done, or shouldn't count | It comes out of the score, site setup and costs in one step, with a reason |
| **Link plots** | Land was cleared before plots existed ("unmapped" clearing) | Attach the plots later. The work and cost are **not** counted again |

---

## 7. Reading performance

### How a score is worked out

For each target on a published scorecard:

```
achievement  = verified work ÷ target
points       = achievement (capped at 100%) × weight
score        = the sum of the points
```

| What you see | Meaning |
|---|---|
| **Verified score** | The real score, from reviewed and verified work only |
| **Projected score** | What the score would be if everything waiting for review were verified. Always labelled; never added to the verified score |
| **Achievement** | Capped at 100% for scoring. The uncapped figure shows over-delivery, e.g. 112% |
| **No targets set** | The person covered this estate but has no scorecard. This is shown as "no targets", **not** a zero score |

### Scorecard states on performance screens

| State | Meaning |
|---|---|
| Missing | No scorecard for that month |
| Draft | Targets not published yet, so nothing is scored |
| Invalid | Published, but weights don't total 100%. The score isn't comparable with others |
| Published / Finalised / Restated | Scored normally |

### Other views

- **Team summary** for a role and month, including how many scores are actually comparable. Check this before treating the list as a league table.
- **One person's month**: each estate's scorecard, metric by metric, with weekly movement.
- **One estate's month**: everyone working on it.
- **Metric league table**: everyone on one metric this month, best first.
- **Trend**: a person's score month by month, with an average over months that actually had targets.
- **Blockers**: work waiting too long for review, workers with no targets, and unpublished scorecards.
- **Source records**: every piece of work behind a score.

---

## 8. Site setup and plots

### Site setup

A progress view for the estate, built only from verified work:

- **Fencing** per side: approved length, fenced, repaired, remaining, over-run and percent complete, plus the total against the whole perimeter.
- **Clearing**: square metres cleared and the share of the estate.
- **Parcelation**: plots parcelled and plots re-pegged.
- **Boundary established** by Surveyors.
- **Readiness**: whether each of these has started.

If no boundary has been approved yet, every length, remaining and percent shows **"not set"**, not zero.

### Plot inventory

Every plot with its size, product, sales status and field state. Search and filter by block, size, product, sales status (available / allocated), allocation readiness, and field state (parcelled or not, cleared or not).

- Totals are shown for the whole estate **and** for your filter, so a filtered view never looks like the whole estate.
- **Cleared sqm** never goes above the plot's size, however many times it's re-cleared.
- **Allocation-ready** means the plot is both parcelled and fully cleared.
- **Field work never changes a plot's sales status.** Clearing or parcelling a plot doesn't sell or allocate it.
- The panel also shows the next allocation event. If none is scheduled it says so rather than showing a capacity of zero.

### Field history and field costs

- **Field history**: verified, corrected and reversed work on the estate, newest first.
- **Field costs**: verified field spending by category, each entry linking back to the work it came from.

---

## 9. Allocation events

A **Site Manager** can be made accountable for an official allocation event on an estate they cover on the event date.

For each event you see:

| Figure | Meaning |
|---|---|
| **Expected** | Customers, plans, plots and sqm due to be allocated, taken from the event's own allocation records |
| **Confirmed** | Only customers confirmed by a **ground scan** at the estate |
| **Outstanding** | Expected minus confirmed |

- Boarding the bus doesn't count as confirmation. Only the ground scan does.
- Scanning the same customer twice still counts once.
- Confirmed customers feed that Site Manager's **Customers allocated** target for the estate.

---

## 10. Estate costs

### Three layers

| Layer | Example |
|---|---|
| **Cost item**: a line on the finance sheet, with the rules for who pays | "Perimeter fencing", "Head office" |
| **Cost record**: one thing being paid for | "Fencing phase 1 with Ade Fence Ltd" |
| **Cost entry**: one financial stage on that record | Budgeted, committed, claimed, incurred, paid |

All the stages of one spend sit on **one** record, so the same money is never counted five times. **Only incurred cost that has been approved** reaches profit (after any reversals and adjustments).

### Day to day

- **Unknown amounts stay blank.** They show up as gaps in coverage and are never treated as zero.
- New entries start as **draft**. Once **approved** they can't be edited. To undo one, reverse it: a matching reversal is written and both stay visible.

### Shared costs and split rules

A shared cost such as head office has to be split across products. Choose how, from a date, with a reason:

- by land (total, saleable, per product, or sold), by revenue, by units, equally, or
- **manually** by percentages that total 100, or by fixed amounts.

You can leave products out of a split. Every change is a new version with its date and reason. Profitability always uses the rule that was in force on the date you ask about.

Use **preview** before saving a split rule: it shows the before, after and change per product, and any new warnings, without saving anything.

### Costs from field work

When an admin verifies field work that had a cost, it arrives here automatically as a **claim**: what the worker says they spent. **A claim doesn't affect profit until finance accepts it.**

- Accept the whole claim, or a lower amount with a note, e.g. "Invoice checked against the receipt".
- Accepting part of a claim leaves the rest open. Accepting it again only takes what's left.
- A claim that's already been fully accepted can't be accepted again.

### Coverage

Coverage answers "how much of this estate's cost do we actually know?". For every cost item it lists gaps such as:

- "Nothing has been recorded against this item yet"
- "It is shared but has no split rule, so profit cannot use it"

It also shows totals: complete and incomplete items, recognised cost, entries awaiting approval, and entries without an amount.

---

## 11. Profitability

```
gross profit          = revenue − direct cost
net profit            = gross profit − shared operating costs
margin                = net profit ÷ revenue
cost per total sqm    = (direct cost + shared operating costs) ÷ total estate sqm
cost per saleable sqm = (direct cost + shared operating costs) ÷ saleable sqm
```

Revenue and received cash are shown side by side, with commission settled and awaiting settlement.

- **"Not complete"** is the most important flag. It means at least one cost is unknown or can't be split, so **profit is overstated** (the unknown cost isn't counted). The warnings say which, and the figure shouldn't be treated as final until they're resolved.
- **Margin shows "—"** when nothing has sold yet, never 0%.
- **Choose a date** to see profitability as it stood then, using the split rules in force at the time.
- The **matrix** shows one row per product, size and plan length: sold value, received, balance, collection efficiency, forecast profit and margin.
- The **drill-down** answers "how was this calculated?": every revenue and cost line, which products shared each cost and how much, whether it counted, and why not if it didn't.

---

## 12. Selling charges

What the **customer** pays: land price, development levy, documentation, survey fee and other charges. These are kept separate from what the estate **costs**.

- Each charge is per sqm, per plot or a flat amount, and can apply to one product or all of them.
- Saving a new price list takes an effective date and a reason, and creates a new version. The previous version is kept.
- Every payment plan remembers which price list it was sold under.
- If no price list has been approved yet, the screen says so.

---

## 13. Who can do what

Super admins can do everything. Other admins need the matching permission; without it the action is refused.

| Permission | Lets an admin |
|---|---|
| View / manage assets | See and change land configuration, and switch an estate to sqm stock |
| View field staff | See field workers and their assignments |
| Manage field staff | Invite, disable and re-enable workers |
| Assign field staff | Put workers on estates, and make a Site Manager accountable for an allocation event |
| View / manage field scorecards | See and set monthly targets |
| View field submissions | See the review queue |
| Verify field submissions | Verify, reject, correct, reverse and link plots |
| View field performance | See scores, site setup, plots and field costs |
| Manage asset boundary | Set the approved boundary |
| View / manage asset costs | See and record cost items, records, split rules and selling charges |
| Approve asset costs | Approve entries, accept claims and reverse entries |
| View asset profitability | See profit, the matrix and the drill-down |
| Keep inventory on close | Close a payment plan while its land stays committed |

---

## 14. Messages you may see

| What happened | What to do |
|---|---|
| Someone else saved the land configuration first | Reload, then make your change again |
| The estate isn't ready to switch to sqm stock | Fix the listed blockers, then try again |
| That email already has a field account | Use a different email, or find the existing person |
| They already have an open assignment on that estate | End the current one first |
| The end date is before the start date | Pick a later date |
| The worker wasn't assigned to that estate that month | Assign them first, or pick a month they covered |
| A scorecard already exists for that month | Open the existing one instead |
| Targets are invalid | Read the listed issues, e.g. a metric the role doesn't do, a duplicate metric, or a zero weight |
| Weights don't total 100% | Adjust them before publishing |
| The month hasn't ended | Finalise it once the month is over |
| Only a closed month can be restated | Finalise it first |
| The submission changed while you were reviewing | Reload and review again |
| The warnings need a note | Add a note explaining why it's fine |
| It's already been reviewed | Someone else decided first; reload to see their decision |
| Only verified work can be corrected or reversed | — |
| Only unmapped clearing can have plots linked | — |
| The claim has already been accepted | Nothing more to accept |
| Only a draft cost entry can be changed | Reverse an approved entry instead |

---

## 15. Glossary

| Term | Meaning |
|---|---|
| **Estate / site / asset** | The same thing: one piece of land Abode is selling |
| **Field worker** | A Site Manager or Surveyor, using the field app |
| **Assignment** | A worker's responsibility for an estate, from a start date to an optional last day |
| **Scorecard** | One worker's targets for one estate and month |
| **Weight** | How much a target contributes to the score. Weights total 100% |
| **Submission** | One piece of recorded field work, with evidence and cost |
| **Verified** | Reviewed and accepted by an admin. The only work that scores |
| **Projected** | What the score would be if pending work were verified. Never the real score |
| **Rework** | Re-pegging plots already parcelled. Recorded, not scored |
| **Unmapped clearing** | Land cleared before plots existed; plots can be linked later |
| **Approved boundary** | The official four sides of the estate that fencing is measured against |
| **Claim** | A cost reported by a field worker, waiting for finance to accept it |
| **Incurred** | A cost actually owed. Once approved, it reaches profit |
| **Coverage** | How much of an estate's cost is actually known |
| **Complete** | Every cost is known and splittable, so profit can be trusted |
| **Split rule** | How a shared cost is divided between products, from a date |
