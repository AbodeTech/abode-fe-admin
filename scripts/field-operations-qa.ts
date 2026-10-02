/**
 * Site Setup's field operations — the review queue, field costs, the field
 * team, allocation-event ownership — plus the smaller endpoints wired in the
 * same pass (pitch pack, cost catalogue, single plot). Each response is
 * parsed with the schema the screen uses, and each write is followed through
 * to the figures it should move.
 * Run: npx tsx scripts/field-operations-qa.ts
 */
import { z } from 'zod';

import { MockHttpError, dispatchMockRoute, registerRoutes } from '../lib/mocks/router';
import { assetCostRoutes } from '../lib/mocks/routes/asset-costs';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { companyEventsRoutes } from '../lib/mocks/routes/company-events';
import { fieldOperationsRoutes } from '../lib/mocks/routes/field-operations';
import { siteSetupRoutes } from '../lib/mocks/routes/site-setup';
import { CostCatalogueSchema } from '../features/assets/hooks/use-cost-items';
import { AssetDetailSchema, PitchPackSchema } from '../features/assets/schemas/asset-detail.schema';
import {
  AssetFieldAllocationSchema,
  AssetFieldPerformanceSchema,
  AssignEventOwnerResultSchema,
  EventAllocationFiguresSchema,
  FieldAssignmentSchema,
  FieldCostsSchema,
  FieldSubmissionDetailSchema,
  FieldSubmissionSchema,
  VerifySubmissionResultSchema,
  averageScore,
  buildCorrection,
  correctionDefaults,
  eligibleEventOwners,
  proposedSides,
  submissionActions,
  workDetails,
  workerScore,
  type FieldSubmission,
} from '../features/assets/schemas/field-operations.schema';
import { PlotInventoryResponseSchema } from '../features/assets/schemas/plot-inventory.schema';
import { BoundaryVersionSchema, SiteSetupSchema } from '../features/assets/schemas/site-setup.schema';

registerRoutes(assetRoutes);
registerRoutes(assetCostRoutes);
registerRoutes(companyEventsRoutes);
registerRoutes(siteSetupRoutes);
registerRoutes(fieldOperationsRoutes);

const A1 = '665faaaa00000000000000a1';
const A2 = '665faaaa00000000000000a2';

type Result = { id: string; ok: boolean };

async function run(id: string, fn: () => Promise<void> | void): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${(e as Error).message}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const get = (path: string, query: Record<string, unknown> = {}) => dispatchMockRoute({ method: 'GET', path, query, body: undefined });
const send = (method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => dispatchMockRoute({ method, path, query: {}, body });

/** The error code a request is refused with, or `null` if it went through. */
async function refusal(request: () => Promise<unknown>): Promise<string | null> {
  try {
    await request();
    return null;
  } catch (e) {
    if (e instanceof MockHttpError) return e.code ?? String(e.statusCode);
    throw e;
  }
}

const siteSetup = async () => SiteSetupSchema.parse(await get(`/admin/assets/${A1}/site-setup`));
const fieldCosts = async () => FieldCostsSchema.parse(await get(`/admin/assets/${A1}/field-costs`));
const queue = async (status?: string) =>
  z.object({ data: z.array(FieldSubmissionSchema) }).parse(await get('/admin/field-submissions', { asset_id: A1, status, limit: 50 })).data;
const detail = async (id: string) => FieldSubmissionDetailSchema.parse(await get(`/admin/field-submissions/${id}`));
const side = (setup: Awaited<ReturnType<typeof siteSetup>>, name: string) => setup.fencing.sides.find((row) => row.side === name)!;

async function main() {
  const results: Result[] = [];

  results.push(
    await run('FO-only-verified-work-counts-towards-site-progress-and-cost', async () => {
      const setup = await siteSetup();
      const costs = await fieldCosts();
      assert(side(setup, 'front').fenced_metres === 180, `front should be 180 m fenced, got ${side(setup, 'front').fenced_metres}`);
      assert(side(setup, 'right').fenced_metres === 0, 'the 95 m on the right is still awaiting review and must not count');
      assert(side(setup, 'front').percent_complete === null, 'with no approved boundary there is no percentage, not 0%');
      assert(setup.clearing.cleared_sqm === 5000, `cleared should be 5,000 sqm, got ${setup.clearing.cleared_sqm}`);
      assert(costs.total_amount === 3_150_000, `field costs should total 3,150,000, got ${costs.total_amount}`);
      assert(costs.by_category.map((row) => row.category).sort().join() === 'clearing,fencing', 'costs should split into fencing and clearing');
    })
  );

  results.push(
    await run('FO-the-actions-offered-match-what-the-backend-accepts', async () => {
      const base = { metric_key: 'fencing_new_metres', payload: {} };
      assert(submissionActions({ ...base, status: 'submitted' }).join() === 'verify,reject', 'submitted → verify, reject');
      assert(submissionActions({ ...base, status: 'verified' }).join() === 'correct,reverse', 'verified → correct, reverse');
      for (const status of ['draft', 'rejected', 'withdrawn', 'reversed'] as const) {
        assert(submissionActions({ ...base, status }).length === 0, `${status} should offer nothing`);
      }
      const unmapped = { metric_key: 'clearing_sqm', payload: { mapping: 'unmapped' } };
      assert(submissionActions({ ...unmapped, status: 'verified' }).includes('link_plots'), 'unmapped clearing can have plots linked');
      assert(!submissionActions({ metric_key: 'clearing_sqm', payload: { mapping: 'mapped' }, status: 'verified' }).includes('link_plots'), 'mapped clearing cannot');
    })
  );

  results.push(
    await run('FO-a-warning-must-be-acknowledged-and-a-stale-review-is-refused', async () => {
      const pending = (await queue('submitted')).find((row) => row.payload.side === 'right');
      assert(pending, 'the right-side fencing should be awaiting review');
      const before = await detail(pending.id);
      assert(before.warnings.some((w) => w.includes('add up to 640000')), 'the receipt mismatch should be warned about');
      assert(before.warnings.some((w) => w.includes('no approved boundary')), 'fencing with no boundary should be warned about');

      const path = `/admin/field-submissions/${pending.id}/verify`;
      assert((await refusal(() => send('POST', path, { revision: 1 }))) === 'SUBMISSION_WARNING_UNACKNOWLEDGED', 'verifying without an acknowledgement must be refused');
      assert((await refusal(() => send('POST', path, { revision: 7, acknowledgement: 'ok' }))) === 'SUBMISSION_STALE', 'a different revision must be refused');

      const result = VerifySubmissionResultSchema.parse(await send('POST', path, { revision: 1, acknowledgement: 'Balance paid in cash, receipt to follow' }));
      assert('effects_written' in result && result.effects_written.includes('asset_cost'), 'verifying should write a cost effect');
      assert(side(await siteSetup(), 'right').fenced_metres === 95, 'the right side should now show 95 m');
      assert((await fieldCosts()).total_amount === 3_850_000, 'field costs should rise by the 700,000 spent');
    })
  );

  results.push(
    await run('FO-accepting-a-proposed-boundary-approves-a-new-version', async () => {
      const pending = (await queue('submitted')).find((row) => row.metric_key === 'boundary_metres');
      assert(pending, 'the boundary submission should be awaiting review');
      assert(proposedSides(pending)?.front === 420.5, 'the proposed sides should be readable from the payload');

      const result = VerifySubmissionResultSchema.parse(
        await send('POST', `/admin/field-submissions/${pending.id}/verify`, { revision: 1, accept_proposed_boundary: true })
      );
      assert('boundary_accepted' in result && result.boundary_accepted, 'the boundary should be reported as accepted');

      const versions = z.array(BoundaryVersionSchema).parse(await get(`/admin/assets/${A1}/boundary`));
      assert(versions[0].source === 'surveyor_submission' && versions[0].submission_id === pending.id, 'the new version should point at the submission');
      const setup = await siteSetup();
      assert(setup.boundary?.perimeter_metres === 1441, `perimeter should be 1,441 m, got ${setup.boundary?.perimeter_metres}`);
      assert(setup.boundary_established_metres === 640, 'the 640 m established should count');
      assert(side(setup, 'front').percent_complete === 42.81, `front should now be 42.81% fenced, got ${side(setup, 'front').percent_complete}`);
    })
  );

  results.push(
    await run('FO-a-correction-replaces-the-figures-and-keeps-the-old-ones-as-reversed', async () => {
      const verified = (await queue('verified')).find((row) => row.payload.side === 'front') as FieldSubmission;
      const defaults = correctionDefaults(verified);
      assert(defaults.metres === 180 && defaults.amount_spent === 1_350_000, 'the form should start from the current figures');

      const unchanged = buildCorrection(verified, { ...defaults, reason: 'no change' });
      assert('error' in unchanged, 'a correction that changes nothing must be refused before it is sent');

      const dto = buildCorrection(verified, { ...defaults, reason: ' Measured again ', metres: 160 });
      assert(!('error' in dto), 'a real change should build a request');
      assert(dto.reason === 'Measured again' && dto.amount_spent === undefined, 'only what changed is sent, and the reason is trimmed');
      assert(dto.payload?.metres === 160 && dto.payload?.side === 'front', 'the corrected field is laid over the existing payload');

      const corrected = FieldSubmissionSchema.parse(await send('POST', `/admin/field-submissions/${verified.id}/correct`, dto));
      assert(corrected.revision === 2 && corrected.status === 'verified', 'a correction is a new revision of a still-verified submission');
      assert(side(await siteSetup(), 'front').fenced_metres === 160, 'the front should now show 160 m, not 180 or 340');
      const after = await detail(verified.id);
      assert(after.effects.some((e) => e.revision === 1 && e.is_reversed) && after.effects.some((e) => e.revision === 2 && !e.is_reversed), 'revision 1 reversed, revision 2 live');
    })
  );

  results.push(
    await run('FO-linking-plots-maps-unmapped-clearing-without-recounting-it', async () => {
      const clearing = (await queue('verified')).find((row) => row.metric_key === 'clearing_sqm') as FieldSubmission;
      const plots = z.object({ data: PlotInventoryResponseSchema }).parse(await get(`/admin/assets/${A1}/plots`, { limit: 200 })).data.plots;
      assert(plots.length >= 2, 'the mock estate needs plots to link');
      const path = `/admin/field-submissions/${clearing.id}/link-plots`;

      assert((await refusal(() => send('POST', path, { plot_ids: ['not-a-plot'] }))) === 'SUBMISSION_PLOTS_INVALID', 'a plot from elsewhere must be refused');
      const linked = FieldSubmissionSchema.parse(await send('POST', path, { plot_ids: [plots[0].id, plots[1].id], note: 'Per the survey plan' }));
      assert(linked.plot_ids.length === 2 && linked.payload.mapping === 'mapped', 'the clearing should now be mapped to two plots');
      assert(linked.quantity === 5000, 'the area must not change');
      assert(!submissionActions(linked).includes('link_plots'), 'once mapped, linking is no longer offered');
      assert((await detail(clearing.id)).plots.length === 2, 'the detail should list the linked plots');
      assert((await siteSetup()).clearing.cleared_sqm === 5000, 'cleared area must still be 5,000 sqm');
      assert(workDetails(linked).some((row) => row.label === 'Plots linked later' && row.value === 'Per the survey plan'), 'the link note should be readable');
    })
  );

  results.push(
    await run('FO-a-reversal-removes-the-work-everywhere-and-cannot-be-repeated', async () => {
      const clearing = (await queue('verified')).find((row) => row.metric_key === 'clearing_sqm') as FieldSubmission;
      const path = `/admin/field-submissions/${clearing.id}/reverse`;
      assert((await refusal(() => send('POST', path, {}))) === 'VALIDATION_FAILED', 'a reversal needs a reason');
      const costsBefore = (await fieldCosts()).total_amount;

      const reversed = FieldSubmissionSchema.parse(await send('POST', path, { reason: 'The work was never done' }));
      assert(reversed.status === 'reversed' && reversed.reversal_reason === 'The work was never done', 'status and reason should be recorded');
      assert((await siteSetup()).clearing.cleared_sqm === 0, 'cleared area should fall to a real 0');
      assert((await fieldCosts()).total_amount === costsBefore - 1_800_000, 'its 1,800,000 should leave the field costs');
      assert((await refusal(() => send('POST', path, { reason: 'again' }))) === 'SUBMISSION_ALREADY_REVERSED', 'a second reversal must be refused');
    })
  );

  results.push(
    await run('FO-rejecting-needs-a-reason-and-only-works-on-pending-work', async () => {
      const pending = (await queue('submitted')).find((row) => row.payload.work_type === 'repair');
      assert(pending, 'the repair should be awaiting review');
      assert(!pending.counts_towards_target && pending.quantity === 0, 'a repair is logged but counts nothing towards the target');
      assert(workDetails(pending).some((row) => row.value.startsWith('Repair')), 'the sheet should say it is a repair');

      const path = `/admin/field-submissions/${pending.id}/reject`;
      const rejected = FieldSubmissionSchema.parse(await send('POST', path, { reason: 'No photos' }));
      assert(rejected.status === 'rejected' && rejected.review_note === 'No photos', 'the reason is kept as the review note');
      assert((await refusal(() => send('POST', path, { reason: 'again' }))) === 'SUBMISSION_ALREADY_REVIEWED', 'reviewed work cannot be rejected again');
      assert((await queue('submitted')).length === 0, 'nothing should be left awaiting review');
    })
  );

  results.push(
    await run('FO-a-worker-with-no-targets-has-no-score-rather-than-zero', async () => {
      const verified = (await queue('verified')).find((row) => row.payload.side === 'front') as FieldSubmission;
      const performance = AssetFieldPerformanceSchema.parse(
        await get(`/admin/assets/${A1}/field-performance`, { year: verified.year, month: verified.month })
      );
      const manager = performance.workers.find((row) => row.field_staff.staff_type === 'site_manager');
      assert(manager, 'the site manager should be listed');
      assert(manager.scorecards[0].metrics[0].verified >= 160, 'verified fencing should feed the score');
      assert(workerScore(manager) !== null, 'a worker with targets has a score');

      const noTargets = { ...manager, scorecards: [], total_score: 0, projected_score: 0 };
      assert(workerScore(noTargets) === null, 'no scorecards means no score, not 0');
      assert(averageScore([noTargets]) === null, 'and no site average');
      assert(averageScore([manager, noTargets]) === manager.total_score, 'the average covers only workers with targets');
    })
  );

  results.push(
    await run('FO-an-event-owner-must-be-a-site-manager-covering-the-estate-that-day', async () => {
      const events = z.object({ data: z.array(z.object({ id: z.string(), starts_at: z.string() })) }).parse(
        await get('/admin/company-events', { asset_id: A2, type: 'allocation', limit: 5 })
      ).data;
      assert(events.length > 0, 'the mock should have an allocation event on the second estate');
      const event = events[0];

      const report = EventAllocationFiguresSchema.parse(await get(`/admin/field-allocation/events/${event.id}`));
      assert(report.owner === null && report.note, 'an unowned event still reports its figures, with the note');
      assert(report.expected.plans > 0 && report.confirmed.plans <= report.expected.plans, 'confirmed cannot exceed expected');
      assert(AssetFieldAllocationSchema.parse(await get(`/admin/field-allocation/assets/${A2}`)).events.length === 0, 'the per-estate list holds only owned events');

      const staff = z.array(FieldAssignmentSchema).parse(await get(`/admin/assets/${A1}/field-staff`, { include_ended: true }));
      assert(staff.length === 3, 'with past assignments included there are three on the first estate');
      assert(z.array(FieldAssignmentSchema).parse(await get(`/admin/assets/${A1}/field-staff`)).length === 2, 'and two active');
      const now = new Date().toISOString();
      assert(eligibleEventOwners(staff, now).map((row) => row.field_staff?.full_name).join() === 'Ngozi Adeyemi', 'today: only the active site manager');
      const longAgo = new Date(Date.now() - 150 * 86_400_000).toISOString();
      assert(eligibleEventOwners(staff, longAgo).map((row) => row.field_staff?.full_name).join() === 'Ibrahim Sule', '150 days ago: the manager who covered it then');

      const owner = `/admin/field-allocation/events/${event.id}/owner`;
      const surveyor = staff.find((row) => row.staff_type === 'surveyor')!.field_staff!.id;
      const formerManager = staff.find((row) => !row.is_active)!.field_staff!.id;
      const manager = staff.find((row) => row.staff_type === 'site_manager' && row.is_active)!.field_staff!.id;
      assert((await refusal(() => send('PUT', owner, { field_staff_id: surveyor }))) === 'FIELD_WRONG_STAFF_TYPE', 'a surveyor cannot own an event');
      assert((await refusal(() => send('PUT', owner, { field_staff_id: formerManager }))) === 'FIELD_SITE_NOT_ASSIGNED', 'a manager not on that estate cannot own it');

      AssignEventOwnerResultSchema.parse(await send('PUT', owner, { field_staff_id: manager, note: 'Lead on the day' }));
      const owned = AssetFieldAllocationSchema.parse(await get(`/admin/field-allocation/assets/${A2}`)).events;
      assert(owned.length === 1 && owned[0].owner?.full_name === 'Ngozi Adeyemi', 'the event should now be listed with its owner');

      await send('DELETE', owner);
      assert((await refusal(() => send('DELETE', owner))) === 'ALLOCATION_EVENT_NOT_OWNED', 'removing a missing owner is refused');
    })
  );

  results.push(
    await run('FO-the-pitch-pack-is-set-replaced-and-removed-on-its-own-endpoints', async () => {
      const path = `/admin/assets/${A1}/pitch-pack`;
      // The mock estate is seeded with a pitch pack; start from none.
      await send('DELETE', path);
      assert(AssetDetailSchema.parse(await get(`/admin/assets/${A1}`)).pitch_pack == null, 'after removal the estate has no pitch pack');
      assert((await refusal(() => send('PUT', path, { url: 'not-a-link', size_bytes: 10 }))) === 'VALIDATION_FAILED', 'the url must be a link');
      assert((await refusal(() => send('PUT', path, { url: 'https://files.abode.test/p.pdf', size_bytes: 200 * 1024 * 1024 }))) === 'VALIDATION_FAILED', '100 MB is the limit');

      const first = PitchPackSchema.parse(await send('PUT', path, { url: 'https://files.abode.test/p.pdf', size_bytes: 2_500_000 }));
      const again = PitchPackSchema.parse(await send('PUT', path, { url: 'https://files.abode.test/p.pdf', size_bytes: 2_600_000 }));
      assert(again.uploaded_at === first.uploaded_at && again.size_bytes === 2_600_000, 'the same link keeps its upload date');
      assert(AssetDetailSchema.parse(await get(`/admin/assets/${A1}`)).pitch_pack?.url === first.url, 'the asset detail should carry it');

      assert(z.object({ removed: z.boolean() }).parse(await send('DELETE', path)).removed === true, 'removing reports removed');
      assert(z.object({ removed: z.boolean() }).parse(await send('DELETE', path)).removed === false, 'removing nothing reports not removed');
    })
  );

  results.push(
    await run('FO-cost-groups-come-from-the-catalogue-and-one-plot-uses-the-single-endpoint', async () => {
      const catalogue = CostCatalogueSchema.parse(await get(`/admin/assets/${A1}/costs/catalogue`));
      assert(catalogue.groups.length === 5 && catalogue.groups[2].label === 'Documentation & Finance', 'five groups with the backend labels');

      const blocks = z.array(z.object({ _id: z.string() })).parse(await get(`/admin/assets/${A1}/blocks`));
      const path = `/admin/blocks/${blocks[0]._id}/plots`;
      const created = z.object({ _id: z.string(), plot_number: z.number(), size: z.number() }).parse(await send('POST', path, { plot_number: 9001, size: 450 }));
      assert(created.plot_number === 9001 && created.size === 450, 'the plot should be created as sent');
      assert((await refusal(() => send('POST', path, { plot_number: 9001, size: 450 }))) === 'DUPLICATE_PLOT', 'the same number twice is refused');
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
