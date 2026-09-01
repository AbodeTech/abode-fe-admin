# Campaign Engine — FE Design (v2 admin + user)

> **Version**: 1.0
> **Date**: 2026-08-20
> **Status**: Locked shape doc. Companion to `CAMPAIGN-ENGINE-DESIGN.md` (BE).
> **Repos**: `abode-admin-fe` (admin surface) + `abode-fe-v2` (user "My Rewards" page — BE endpoint ready, FE component can add when scheduled)
> **What this doc is**: page composition + component structure + campaign-create form UX + reward invalidation flow + PDF download + user "My Rewards" shape.

**Out of scope**:
- The BE endpoint shapes themselves — see companion BE design doc §4-§5
- Lottery draw execution UI (picking winners) — deferred (CE-Q4)
- Naira / pro-upgrade trigger UI — deferred (CE-Q1 + CE-Q2)

---

## 1. What this covers

Two surfaces:

**Admin (abode-admin-fe)**:
- `/campaigns` — list of all campaigns with status pills + basic stats
- `/campaigns/new` — create-campaign form (multi-step wizard covering period + trigger + reward + eligibility + target)
- `/campaigns/:id` — dashboard for one campaign with 5 sections + Rewards tab + Edit + Transition actions
- `/campaigns/:id/rewards` — paginated rewards table with search + filter + CSV export + per-ticket PDF download + manual invalidation flow

**User (abode-fe-v2)**:
- `/my-rewards` — user sees their own earned tickets + hampers, grouped by campaign, with per-ticket PDF download

**Reworks**:
- Existing v2 admin `/campaigns/hampercampaign` + `/campaigns/1000plotsproject` routes redirect to their seeded legacy campaign detail pages
- `/campaigns/2000associateprocampaign` is untouched (that's the separate Associate Pro Yearly Tracker, different domain)

---

## 2. Design decisions

Numbered `FE-CE-N`.

| # | Decision | Reasoning |
|---|---|---|
| FE-CE-1 | **Admin route structure**: `/campaigns` (list) → `/campaigns/:id` (dashboard) → `/campaigns/:id/rewards` (rewards table). Plus `/campaigns/new` (create wizard). No sub-routes per campaign type — the same page handles hamper and ticket. | Reflects the unified engine — one UI, not one-per-type. |
| FE-CE-2 | **Create-campaign form is a multi-step wizard** (4 steps: Basics → Trigger → Reward + Recipients → Eligibility + Target). Each step validates before advancing. Final review step shows summary + "Create as Draft" button. | Guided flow — reduces the risk of publishing a misconfigured campaign. Draft-first prevents accidental live launches. |
| FE-CE-3 | **Draft campaigns fully editable via same wizard** (loaded pre-populated). Active/paused campaigns show read-only view + limited edit (description + target only per CE-30). | Matches BE lockdown rules; UX reinforces the invariant. |
| FE-CE-4 | **Status pills** with distinct colors: draft (gray), active (green), paused (amber), completed (blue). Displayed on list + detail. | At-a-glance status recognition. |
| FE-CE-5 | **Transition action** exposed as a dropdown menu on the detail page — "Publish" (draft → active), "Pause" / "Resume" (active ↔ paused), "End Campaign" (any → completed). Each triggers a confirmation dialog explaining the consequence. | Prevents accidental status changes. Ending a campaign is permanent (no un-completing) — confirmation modal spells this out. |
| FE-CE-6 | **Dashboard tabs**: Overview (5-section dashboard) + Rewards (paginated table) + Config (read-only view of campaign settings). Three tabs, single detail page. | Consolidates all per-campaign work in one place. |
| FE-CE-7 | **Rewards table** paginated + searchable (by recipient name/email/ticket_id) + filterable (role: buyer/referrer, is_active). Row actions: "Download Ticket PDF" (ticket rewards only) + "Invalidate" (with reason input). | Standard admin data-table pattern + reward-specific row actions. |
| FE-CE-8 | **Ticket PDF download** opens in new tab (browser handles the PDF). Filename set server-side via `Content-Disposition`. Hamper rewards show a disabled/hidden download button ("PDF not applicable for hampers"). | Simple browser flow; PDF library on BE. |
| FE-CE-9 | **CSV export button** in the Rewards tab header — same filter state applies. Streaming download; button shows "Exporting..." spinner during. | Consistent with SALES/PC/CSM export pattern. |
| FE-CE-10 | **Invalidate flow**: click row action → modal with reason textarea (min 20 chars) → confirm → mutation → toast + row updates in place. | Enforces the reason discipline BE requires. |
| FE-CE-11 | **List page filters**: `status` filter chips + `search` (campaign name). Default view: all `status: 'active'` first, then draft, then paused, then completed. | Active campaigns are the daily-attention surface; sort brings them up. |
| FE-CE-12 | **List page card layout** for each campaign: name + status pill + period + reward type badge + reward count + participant count + progress bar (if target set). Click → dashboard. | Scannable — ops can spot underperforming campaigns without opening each. |
| FE-CE-13 | **Legacy campaign redirect**: `/campaigns/hampercampaign` → `/campaigns/{hamper_legacy_id}` (looked up by name at redirect time via a small helper hook). Same for `/campaigns/1000plotsproject` if that becomes a legacy campaign. `/campaigns/2000associateprocampaign` untouched (separate tracker). | Preserves existing bookmarks + reveals legacy data via the new unified UI. |
| FE-CE-14 | **Sidebar**: rename "Hamper Campaign" + "1000 Plots Project" nav items → single "Campaigns" nav item pointing at `/campaigns`. "2000 Associate Pro Campaign" nav item becomes "Associate Pro Tracker" per the sibling tracker doc. | Simplifies nav to one entry per surface. |
| FE-CE-15 | **User "My Rewards" page** (`abode-fe-v2/app/(user)/my-rewards/page.tsx`): grouped by campaign card, each showing campaign name + reward count + list of individual rewards. Each ticket row has a "Download PDF" button linking to the admin PDF endpoint (but with user-auth JWT — BE endpoint gates per role). | User visibility into their own rewards. |
| FE-CE-16 | **User "My Rewards" — hamper rendering**: hampers aren't tickets, no PDF. Row shows campaign name + earning context ("Earned for referring John Doe's 1500 sqm purchase at Adiva Plains") + issued date + "Contact support" link for redemption questions. | Hampers are physical goods; user needs to know they earned one but redemption is a support-driven flow (not this engine's concern). |
| FE-CE-17 | **Permissions**: List/detail/dashboard visible with `view_campaigns`. Create/edit/transition/invalidate hidden without `manage_campaigns`. Export button hidden without `export_campaigns`. FE checks + BE re-checks. | Belt + braces. |
| FE-CE-18 | **Zod schemas** for all response DTOs. Derived types replace GraphQL codegen types (admin) or ad-hoc types (user side). | Standard REST pattern per admin CLAUDE.md. |
| FE-CE-19 | **snake_case rename pass** across ~30 field references in existing v2 campaign components (that get reworked). New user FE writes snake_case natively. | v2 REST convention. |
| FE-CE-20 | **Loading states**: skeleton loaders per section on dashboard; skeleton rows on tables. Error boundary per section — one endpoint failure doesn't take down the whole page. | Standard admin pattern from sibling tracker. |

---

## 3. Admin FE component structure

```
features/campaigns/
├── components/
│   ├── CampaignsListPage.tsx                  # /campaigns entry
│   ├── CampaignsListCard.tsx                  # Per-campaign card in list
│   ├── CampaignsListFilters.tsx               # Status chips + search
│   ├── CampaignCreateWizard.tsx               # /campaigns/new — 4-step wizard
│   ├── steps/
│   │   ├── BasicsStep.tsx                     # Name + description + period
│   │   ├── TriggerStep.tsx                    # threshold + rewards_per_threshold (unit/event/mode locked to MVP values)
│   │   ├── RewardStep.tsx                     # reward_type + recipient toggles + ticket_id_prefix (when ticket)
│   │   ├── EligibilityStep.tsx                # buyer/referrer eligible statuses (multi-select checkboxes from tier list)
│   │   ├── TargetStep.tsx                     # total_sqm_target (optional)
│   │   └── ReviewStep.tsx                     # Summary + Create as Draft button
│   ├── CampaignDetailPage.tsx                 # /campaigns/:id — wraps Overview/Rewards/Config tabs
│   ├── CampaignDetailHeader.tsx               # Name + status pill + transition menu + edit button
│   ├── CampaignOverviewTab.tsx                # 5-section dashboard
│   ├── sections/
│   │   ├── CampaignPeriodSection.tsx
│   │   ├── CampaignProgressSection.tsx        # sqm target + rewards issued + buyer/referrer split
│   │   ├── CampaignParticipantsSection.tsx
│   │   ├── CampaignIssuanceTimelineChart.tsx  # Line/bar chart
│   │   └── CampaignTopEarnersSection.tsx
│   ├── CampaignRewardsTab.tsx                 # Paginated rewards table
│   ├── RewardsTableFilters.tsx                # role + is_active + search
│   ├── RewardsTable.tsx                       # Table rows with actions
│   ├── DownloadTicketPdfButton.tsx            # Ticket PDF download
│   ├── InvalidateRewardDialog.tsx             # Reason input + confirm
│   ├── CampaignConfigTab.tsx                  # Read-only settings view (Trigger + Reward + Eligibility summary)
│   ├── CampaignEditDialog.tsx                 # Limited edit for active campaigns (description + target only)
│   ├── TransitionDialog.tsx                   # Confirmation for status changes
│   └── SectionErrorBoundary.tsx
├── hooks/
│   ├── query-keys.ts
│   ├── use-campaigns-list.ts                  # GET /admin/campaigns
│   ├── use-campaign-detail.ts                 # GET /admin/campaigns/:id
│   ├── use-campaign-dashboard.ts              # GET /admin/campaigns/:id/dashboard
│   ├── use-campaign-rewards.ts                # GET /admin/campaigns/:id/rewards
│   ├── use-create-campaign.ts                 # POST /admin/campaigns
│   ├── use-update-campaign.ts                 # PATCH /admin/campaigns/:id
│   ├── use-transition-campaign.ts             # POST /admin/campaigns/:id/transition
│   ├── use-invalidate-reward.ts               # POST /admin/campaigns/rewards/:id/invalidate
│   ├── use-export-rewards.ts                  # GET /admin/campaigns/:id/rewards/export
│   └── use-download-ticket-pdf.ts             # GET /admin/campaigns/rewards/:id/ticket.pdf
├── schemas/
│   ├── campaign.schema.ts
│   ├── reward.schema.ts
│   ├── dashboard-response.schema.ts
│   ├── create-campaign.schema.ts              # Wizard form validation
│   └── invalidate-reward.schema.ts
├── utils/
│   ├── status-color.ts                        # status → tailwind color
│   ├── format-period.ts
│   └── build-legacy-redirect.ts               # For /hampercampaign → /campaigns/:legacy_id
└── index.ts
```

---

## 4. Key admin components

### 4.1 `CampaignsListPage.tsx`

```tsx
export default function CampaignsListPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') as CampaignStatus | null;
  const search = searchParams.get('search');
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading } = useCampaignsList({ status, search, page });
  const canManage = useAdminPermissions().has('manage_campaigns');

  return (
    <PageShell>
      <Header title="Campaigns">
        {canManage && (
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus /> New Campaign
            </Link>
          </Button>
        )}
      </Header>

      <CampaignsListFilters currentStatus={status} currentSearch={search ?? ''} />

      {isLoading ? (
        <ListSkeleton />
      ) : (
        <div className="grid gap-4">
          {data?.data.map(campaign => (
            <CampaignsListCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      <Pagination current={page} total={data?.meta?.total} />
    </PageShell>
  );
}
```

### 4.2 `CampaignCreateWizard.tsx`

```tsx
export default function CampaignCreateWizard() {
  const [step, setStep] = useState<'basics'|'trigger'|'reward'|'eligibility'|'target'|'review'>('basics');
  const form = useForm<CreateCampaignDto>({
    resolver: zodResolver(CreateCampaignSchema),
    defaultValues: {
      trigger_event: 'asset_purchase',
      trigger_unit: 'sqm',
      trigger_mode: 'divisor',
      rewards_per_threshold: 1,
      recipient_buyer: true,
      recipient_referrer: true,
      referrer_eligible_statuses: [],
      buyer_eligible_statuses: [],
    },
  });
  const { mutateAsync: createCampaign, isPending } = useCreateCampaign();

  const stepOrder = ['basics','trigger','reward','eligibility','target','review'] as const;
  const stepIndex = stepOrder.indexOf(step);

  const advance = async () => {
    const fieldsForStep = STEP_FIELDS[step];
    const isValid = await form.trigger(fieldsForStep);
    if (isValid && stepIndex < stepOrder.length - 1) {
      setStep(stepOrder[stepIndex + 1]);
    }
  };

  const submit = async () => {
    const campaign = await createCampaign(form.getValues());
    toast.success('Campaign created as draft');
    router.push(`/campaigns/${campaign.id}`);
  };

  return (
    <PageShell>
      <WizardHeader steps={stepOrder} currentIndex={stepIndex} />

      <FormProvider {...form}>
        {step === 'basics' && <BasicsStep />}
        {step === 'trigger' && <TriggerStep />}
        {step === 'reward' && <RewardStep />}
        {step === 'eligibility' && <EligibilityStep />}
        {step === 'target' && <TargetStep />}
        {step === 'review' && <ReviewStep />}
      </FormProvider>

      <WizardFooter>
        {stepIndex > 0 && <Button variant="ghost" onClick={() => setStep(stepOrder[stepIndex-1])}>Back</Button>}
        {stepIndex < stepOrder.length - 1 && <Button onClick={advance}>Next</Button>}
        {step === 'review' && <Button onClick={submit} disabled={isPending}>Create as Draft</Button>}
      </WizardFooter>
    </PageShell>
  );
}
```

### 4.3 `TransitionDialog.tsx` — spelling out consequences

```tsx
const TRANSITION_COPY: Record<CampaignStatus, { title: string; description: string; buttonText: string; destructive?: boolean }> = {
  active: {
    title: 'Publish this campaign?',
    description: 'Once published, the engine starts issuing rewards on eligible purchases. Rules become read-only (except description + target).',
    buttonText: 'Publish',
  },
  paused: {
    title: 'Pause this campaign?',
    description: 'Reward issuance stops until you resume. Existing rewards are unaffected. Dashboard remains readable.',
    buttonText: 'Pause',
  },
  completed: {
    title: 'End this campaign?',
    description: 'This is PERMANENT. No more rewards will be issued for this campaign, and it cannot be un-ended. Are you sure?',
    buttonText: 'End Campaign',
    destructive: true,
  },
  draft: {
    // Not a valid transition target; not reached
    title: '', description: '', buttonText: '',
  },
};

export function TransitionDialog({ campaign, newStatus, onClose }: Props) {
  const copy = TRANSITION_COPY[newStatus];
  const { mutateAsync: transition, isPending } = useTransitionCampaign(campaign.id);

  const handleConfirm = async () => {
    await transition({ new_status: newStatus });
    toast.success(`Campaign ${newStatus}`);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{copy.title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={copy.destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {copy.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.4 `InvalidateRewardDialog.tsx`

```tsx
export function InvalidateRewardDialog({ reward, onClose }: Props) {
  const form = useForm<{ reason: string }>({
    resolver: zodResolver(z.object({ reason: z.string().min(20).max(2000) })),
    defaultValues: { reason: '' },
  });
  const { mutateAsync: invalidate, isPending } = useInvalidateReward(reward.id);

  const onSubmit = async ({ reason }) => {
    await invalidate({ reason });
    toast.success('Reward invalidated');
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invalidate this reward?</DialogTitle>
          <DialogDescription>
            Reward will be marked inactive. Ticket ID stays reserved (no re-issuance). Include a reason so support/audit
            can find this later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <FormField name="reason" label="Reason (min 20 chars)" as={Textarea} />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" type="submit" disabled={isPending}>Invalidate</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.5 `RewardsTable.tsx` — with row actions

```tsx
export function RewardsTable({ rewards, isLoading }: Props) {
  const canManage = useAdminPermissions().has('manage_campaigns');
  const canExport = useAdminPermissions().has('export_campaigns');
  const [invalidating, setInvalidating] = useState<CampaignReward | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Sqm</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map(r => (
            <TableRow key={r.id} className={cn(!r.is_active && 'opacity-50')}>
              <TableCell>{r.recipient.first_name} {r.recipient.last_name}</TableCell>
              <TableCell><RoleBadge role={r.role} /></TableCell>
              <TableCell><Code>{r.ticket_id ?? '—'}</Code></TableCell>
              <TableCell>{r.asset.name}</TableCell>
              <TableCell>{r.sqm_purchased}</TableCell>
              <TableCell>{formatDate(r.createdAt)}</TableCell>
              <TableCell><StatusBadge active={r.is_active} /></TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {r.ticket_id && canExport && <DownloadTicketPdfButton rewardId={r.id} />}
                  {r.is_active && canManage && (
                    <Button variant="ghost" size="sm" onClick={() => setInvalidating(r)}>Invalidate</Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invalidating && (
        <InvalidateRewardDialog reward={invalidating} onClose={() => setInvalidating(null)} />
      )}
    </>
  );
}
```

---

## 5. User "My Rewards" page (abode-fe-v2)

### 5.1 Route + component

```
abode-fe-v2/
├── app/(user)/my-rewards/page.tsx           # Route entry
└── features/shared/my-rewards/
    ├── components/
    │   ├── MyRewardsPage.tsx
    │   ├── CampaignGroupCard.tsx            # One card per campaign
    │   ├── TicketReward.tsx                 # Row with PDF button
    │   ├── HamperReward.tsx                 # Row with support-contact link
    │   └── EmptyState.tsx                   # "You haven't earned rewards yet"
    ├── hooks/
    │   ├── use-my-rewards.ts                # GET /user/my-rewards
    │   └── use-download-my-ticket-pdf.ts    # GET /admin/campaigns/rewards/:id/ticket.pdf (JWT-scoped)
    └── schemas/
        └── my-rewards.schema.ts
```

### 5.2 `MyRewardsPage.tsx`

```tsx
'use client';

export default function MyRewardsPage() {
  const { data, isLoading, error } = useMyRewards();

  if (isLoading) return <MyRewardsSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.data.length) return <EmptyState />;

  return (
    <PageShell>
      <PageHeader
        title="My Rewards"
        subtitle={`${data.count} reward${data.count === 1 ? '' : 's'} across ${data.data.length} campaign${data.data.length === 1 ? '' : 's'}`}
      />

      <div className="flex flex-col gap-4">
        {data.data.map(group => (
          <CampaignGroupCard key={group.campaign.id} group={group} />
        ))}
      </div>
    </PageShell>
  );
}
```

### 5.3 `CampaignGroupCard.tsx`

```tsx
export function CampaignGroupCard({ group }: { group: MyRewardsGroup }) {
  const { campaign, rewards } = group;

  return (
    <section className="rounded-xl border p-4">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold">{campaign.name}</h2>
          <p className="text-sm text-muted-foreground">
            {rewards.length} {campaign.reward_type}{rewards.length === 1 ? '' : 's'} earned
          </p>
        </div>
        <RewardTypeBadge type={campaign.reward_type} />
      </header>

      <div className="mt-3 divide-y">
        {rewards.map(r =>
          r.reward_type === 'ticket'
            ? <TicketReward key={r.id} reward={r} />
            : <HamperReward key={r.id} reward={r} />
        )}
      </div>
    </section>
  );
}
```

### 5.4 `TicketReward.tsx` + `HamperReward.tsx`

```tsx
export function TicketReward({ reward }: { reward: CampaignReward }) {
  const { mutateAsync: download } = useDownloadMyTicketPdf();

  return (
    <div className="py-3 flex items-center justify-between">
      <div>
        <p className="font-mono text-sm">{reward.ticket_id}</p>
        <p className="text-xs text-muted-foreground">
          Earned {reward.role === 'buyer' ? 'by purchasing' : `via ${reward.source_buyer.first_name}'s purchase of`}{' '}
          {reward.sqm_purchased} sqm at {reward.asset.name}
          {' · '}{formatDate(reward.createdAt)}
        </p>
      </div>
      <Button size="sm" onClick={() => download(reward.id)}>
        <Download size={14} /> PDF
      </Button>
    </div>
  );
}

export function HamperReward({ reward }: { reward: CampaignReward }) {
  return (
    <div className="py-3">
      <p className="font-medium">Hamper earned</p>
      <p className="text-xs text-muted-foreground">
        Earned {reward.role === 'buyer' ? 'by purchasing' : `via ${reward.source_buyer.first_name}'s purchase of`}{' '}
        {reward.sqm_purchased} sqm at {reward.asset.name}
        {' · '}{formatDate(reward.createdAt)}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        For redemption questions, <a href="/support" className="underline">contact support</a>.
      </p>
    </div>
  );
}
```

---

## 6. Empty + edge states

| State | Trigger | Render |
|---|---|---|
| Admin campaigns list empty | No campaigns at all | Empty state with "Create your first campaign" CTA (visible if `manage_campaigns`) |
| Admin dashboard for campaign with 0 rewards | Active campaign, no eligible purchases yet | Progress section shows "0 rewards issued so far"; participants show 0; timeline chart empty; top earners empty |
| Admin dashboard for campaign with no target | `total_sqm_target: null` | Progress section hides target progress bar; shows "sqm sold so far" as a running count only |
| Rewards table empty | Campaign has no rewards | Empty state row: "No rewards issued yet" |
| Admin lacks `manage_campaigns` | View perm only | "New Campaign" + Edit + Transition + Invalidate buttons hidden |
| Admin lacks `export_campaigns` | View + manage only | Export + Download PDF buttons hidden |
| User has no rewards | `data.data.length === 0` | Friendly empty state: "You haven't earned any rewards yet. Rewards are issued when eligible campaigns are active and you buy or refer eligible purchases." |
| User's ticket PDF download fails | Network / permission error | Toast error "Couldn't download ticket. Please try again or contact support." |
| Reward invalidated after user landed on page | `is_active: false` in response | Row rendered dimmed with strikethrough + "invalidated" badge; PDF button hidden |

---

## 7. Sidebar + routing

**Admin sidebar changes**:
- Remove: "Hamper Campaign", "1000 Plots Project"
- Rename: "2000 Associate Pro Campaign" → "Associate Pro Tracker" (per Associate Pro Yearly Tracker doc, not this doc)
- Add: single "Campaigns" nav item → `/campaigns`

**Legacy route redirects** in `next.config.js`:
```
/campaigns/hampercampaign → /campaigns/{hamper_legacy_id_resolved_at_build}
/campaigns/1000plotsproject → /campaigns/{plots_legacy_id}
```

(Or resolve dynamically via a `LegacyRedirect` component that looks up the ID by known legacy name via the campaigns list on first render.)

**User FE sidebar** — add "My Rewards" nav item (if there's a nav; otherwise link from user dashboard).

---

## 8. Effort estimate

**Admin FE**: ~5 days
- Rework existing `features/campaigns/*` bundle → new component structure: 1 day
- Wizard form (5 steps + validation): 1.5 days
- Detail page with 3 tabs + dashboard sections: 1.5 days
- Rewards table with row actions (PDF + invalidate): 0.5 day
- Transition + invalidate dialogs: 0.5 day
- Sidebar + legacy redirects: 0.25 day
- Testing (visual + interaction): 0.75 day

**User FE (`abode-fe-v2`)**: ~1.5 days
- `MyRewardsPage` + 3 components (CampaignGroupCard, TicketReward, HamperReward): 0.75 day
- Hooks + Zod schemas: 0.25 day
- Empty state + edge states: 0.25 day
- Testing: 0.25 day

**Total FE**: ~6.5 days (admin ~5 + user ~1.5).

---

## 9. Sign-off

FE-CE-1 through FE-CE-20 approved. Ships in coordinated PR window with BE.

**Depends on**:
- BE endpoints per `CAMPAIGN-ENGINE-DESIGN.md` §4
- BE legacy migration completed (so legacy campaign IDs resolve for the redirects)
- `useAdminPermissions()` hook (admin FE — already exists)
- User FE auth context (abode-fe-v2 — existing JWT integration)

**Not blocked by** — nothing beyond BE endpoint availability. User FE component can be added at leisure; BE endpoint `/user/my-rewards` doesn't need to wait for the page.
