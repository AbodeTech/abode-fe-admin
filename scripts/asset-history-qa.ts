/**
 * Updates tab — turning each area's history rows into one timeline
 * (`asset-history.schema.ts`), including against the mock routes that feed it.
 * Run: npx tsx scripts/asset-history-qa.ts
 */
import { z } from 'zod';

import { registerRoutes, dispatchMockRoute } from '../lib/mocks/router';
import { assetRoutes } from '../lib/mocks/routes/assets';
import { landConfigurationRoutes } from '../lib/mocks/routes/land-configuration';
import { siteSetupRoutes } from '../lib/mocks/routes/site-setup';
import {
  FieldHistoryRowSchema,
  boundaryHistoryEntries,
  eventHistoryEntries,
  fieldHistoryEntries,
  landHistoryEntries,
  mergeAssetHistory,
} from '../features/assets/schemas/asset-history.schema';
import { LandConfigurationHistoryEntrySchema } from '../features/assets/schemas/land-configuration.schema';
import { BoundaryVersionSchema } from '../features/assets/schemas/site-setup.schema';

registerRoutes(assetRoutes);
registerRoutes(landConfigurationRoutes);
registerRoutes(siteSetupRoutes);

const A1 = '665faaaa00000000000000a1';

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

async function main() {
  const results: Result[] = [];

  results.push(
    await run('AH-field-work-reads-as-metric-and-quantity', () => {
      const [entry] = fieldHistoryEntries([
        {
          submission_id: 's1',
          metric_key: 'clearing_sqm',
          summary: {},
          quantity: 5000,
          unit: 'sqm',
          status: 'verified',
          work_date: '2026-09-18T00:00:00.000Z',
          amount_spent: 1_800_000,
          field_staff: { id: 'f1', full_name: 'Tunde Surveyor' },
        },
      ]);
      assert(entry.title === 'Land cleared: 5,000 sqm', `unexpected title "${entry.title}"`);
      assert(entry.detail.join(' | ') === 'Verified field work | Tunde Surveyor | ₦1,800,000 spent', `unexpected detail "${entry.detail.join(' | ')}"`);
      assert(entry.kind === 'field' && entry.at === '2026-09-18T00:00:00.000Z', 'kind and date should carry over');
    })
  );

  results.push(
    await run('AH-a-reversed-field-entry-says-so-and-missing-values-are-left-out', () => {
      const [entry] = fieldHistoryEntries([
        {
          submission_id: 's2',
          metric_key: 'parcelation_plots',
          summary: null,
          quantity: null,
          unit: null,
          status: 'reversed',
          work_date: null,
          amount_spent: null,
          field_staff: null,
        },
      ]);
      assert(entry.title === 'Plots parcelled', 'with no quantity the title is just the metric');
      assert(entry.detail.join() === 'Field work, reversed', `unexpected detail "${entry.detail.join()}"`);
    })
  );

  results.push(
    await run('AH-only-past-allocation-events-are-history', () => {
      const now = new Date('2026-10-01T00:00:00.000Z').getTime();
      const event = (id: string, starts_at: string) => ({
        id,
        title: `Batch ${id}`,
        date: '',
        time: '',
        starts_at,
        status: 'published' as const,
        reserved_size: 6000,
        remaining_capacity: null,
        size_unit: 'sqm',
      });
      const entries = eventHistoryEntries([event('1', '2026-09-16T09:00:00.000Z'), event('2', '2026-10-03T09:00:00.000Z')], now);
      assert(entries.length === 1 && entries[0].id === 'event-1', 'the upcoming event must not appear as history');
      assert(entries[0].detail[0] === '6,000 sqm reserved', `unexpected detail "${entries[0].detail[0]}"`);
    })
  );

  results.push(
    await run('AH-the-timeline-is-newest-first-with-undated-entries-last', () => {
      const merged = mergeAssetHistory(
        [{ id: 'a', kind: 'land', at: '2026-09-01T00:00:00.000Z', title: 'a', detail: [] }],
        [
          { id: 'b', kind: 'cost', at: '2026-09-20T00:00:00.000Z', title: 'b', detail: [] },
          { id: 'c', kind: 'field', at: null, title: 'c', detail: [] },
        ],
        [{ id: 'd', kind: 'boundary', at: '2026-09-12T00:00:00.000Z', title: 'd', detail: [] }]
      );
      assert(merged.map((entry) => entry.id).join('') === 'bdac', `unexpected order ${merged.map((entry) => entry.id).join('')}`);
    })
  );

  results.push(
    await run('AH-the-mock-estate-merges-every-source-without-error', async () => {
      const get = (path: string, query: Record<string, unknown> = {}) =>
        dispatchMockRoute({ method: 'GET', path, query, body: undefined });

      const land = z
        .object({ data: z.array(LandConfigurationHistoryEntrySchema) })
        .parse(await get(`/admin/assets/${A1}/land-configuration/history`, { page: 1, limit: 50 }));
      const boundary = z.array(BoundaryVersionSchema).parse(await get(`/admin/assets/${A1}/boundary`));
      const field = z.array(FieldHistoryRowSchema).parse(await get(`/admin/assets/${A1}/field-history`, { limit: 100 }));

      const merged = mergeAssetHistory(
        landHistoryEntries(land.data),
        boundaryHistoryEntries(boundary),
        fieldHistoryEntries(field)
      );

      assert(land.data.length > 0, 'the mock estate should have land account history');
      assert(merged.length === land.data.length + boundary.length + field.length, 'no entry should be dropped or duplicated');
      assert(new Set(merged.map((entry) => entry.id)).size === merged.length, 'entry ids should be unique across sources');
      for (let i = 1; i < merged.length; i += 1) {
        const previous = merged[i - 1].at ? new Date(merged[i - 1].at as string).getTime() : -Infinity;
        const current = merged[i].at ? new Date(merged[i].at as string).getTime() : -Infinity;
        assert(previous >= current, 'the merged timeline should be newest first');
      }
    })
  );

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

main();
