import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, type MockAsset } from './assets';
import {
  SIDES,
  approveBoundary,
  boundaryVersions,
  currentBoundary,
  fieldStaff,
  liveEffects,
  round2,
  submissions,
  unitFor,
  type Sides,
} from './field-store';
import { body } from './util';

/* ============================================================
 * Site Setup — GET/PUT /admin/assets/:assetId/boundary, GET .../site-setup,
 * GET .../field-history.
 *
 * Confirmed REAL against `abode-be-v2` staging's field-staff module
 * (`AssetSiteSetupController`/`SiteSetupService`) — this mock exists only
 * for offline/E2E parity, not because the real endpoint is missing.
 *
 * Progress is worked out the way the real service does it: from the effects
 * of verified field work (field-store.ts), never from made-up figures. So
 * verifying, correcting or reversing a submission through
 * field-operations.ts moves what this file returns.
 * ============================================================ */

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'FIELD_SITE_NOT_FOUND');
  return row;
}

export const siteSetupRoutes: MockRoutes = {
  /** `SiteSetupService.siteSetup()`. */
  'GET /admin/assets/:assetId/site-setup': ({ params }) => {
    const asset = requireAsset(params.assetId);
    const boundary = currentBoundary(params.assetId);

    const fencing: Record<keyof Sides, { new_metres: number; repair_metres: number }> = {
      front: { new_metres: 0, repair_metres: 0 },
      right: { new_metres: 0, repair_metres: 0 },
      back: { new_metres: 0, repair_metres: 0 },
      left: { new_metres: 0, repair_metres: 0 },
    };
    let boundaryEstablished = 0;
    let clearedSqm = 0;
    let parcelledPlots = 0;
    let reworkPlots = 0;
    const plotsTouched = new Set<string>();

    for (const effect of liveEffects(params.assetId)) {
      const detail = effect.detail;
      if (effect.effect_type === 'site_setup' && detail.kind === 'fencing') {
        const side = detail.side as keyof Sides;
        if (SIDES.includes(side)) {
          if (detail.work_type === 'repair') fencing[side].repair_metres += Number(detail.metres ?? 0);
          else fencing[side].new_metres += Number(detail.metres ?? 0);
        }
      }
      if (effect.effect_type === 'site_setup' && detail.kind === 'boundary') boundaryEstablished += effect.quantity;
      if (effect.effect_type === 'plot_history' && detail.kind === 'clearing') {
        clearedSqm += effect.quantity;
        for (const id of effect.plot_ids) plotsTouched.add(id);
      }
      if (effect.effect_type === 'plot_history' && detail.kind === 'parcelation') {
        if (detail.is_rework) reworkPlots += effect.plot_ids.length;
        else parcelledPlots += effect.plot_ids.length;
        for (const id of effect.plot_ids) plotsTouched.add(id);
      }
    }

    const sides = SIDES.map((side) => {
      const approved = boundary?.sides[side] ?? null;
      const done = round2(fencing[side].new_metres);
      return {
        side,
        approved_metres: approved,
        fenced_metres: done,
        repaired_metres: round2(fencing[side].repair_metres),
        remaining_metres: approved === null ? null : round2(Math.max(0, approved - done)),
        over_by_metres: approved === null ? null : round2(Math.max(0, done - approved)),
        percent_complete: approved && approved > 0 ? round2(Math.min(100, (done / approved) * 100)) : null,
      };
    });

    const approvedPerimeter = boundary?.perimeter_metres ?? null;
    const totalFenced = round2(sides.reduce((sum, row) => sum + row.fenced_metres, 0));
    const totalLand = asset.total_land_sqm ?? null;

    return {
      asset: { id: params.assetId, name: asset.name, total_land_sqm: totalLand },
      boundary: boundary
        ? {
            version: boundary.version,
            sides: boundary.sides,
            perimeter_metres: boundary.perimeter_metres,
            source: boundary.source,
            approved_at: boundary.approved_at,
            note: boundary.note,
          }
        : null,
      boundary_established_metres: round2(boundaryEstablished),
      fencing: {
        sides,
        total_fenced_metres: totalFenced,
        approved_perimeter_metres: approvedPerimeter,
        percent_complete:
          approvedPerimeter && approvedPerimeter > 0 ? round2(Math.min(100, (totalFenced / approvedPerimeter) * 100)) : null,
      },
      clearing: {
        cleared_sqm: round2(clearedSqm),
        percent_of_estate: totalLand && totalLand > 0 ? round2(Math.min(100, (clearedSqm / totalLand) * 100)) : null,
      },
      parcelation: {
        plots_parcelled: parcelledPlots,
        plots_re_pegged: reworkPlots,
        distinct_plots_worked: plotsTouched.size,
      },
      readiness: {
        has_boundary: Boolean(boundary),
        fencing_started: totalFenced > 0,
        clearing_started: clearedSqm > 0,
        parcelation_started: parcelledPlots > 0,
      },
    };
  },

  /**
   * GET /admin/assets/:assetId/field-history — field work that has been
   * verified (or later reversed), newest first (`SiteSetupService.fieldHistory()`).
   */
  'GET /admin/assets/:assetId/field-history': ({ params, query }) => {
    requireAsset(params.assetId);
    const limit = Number(query.limit) || 100;
    return submissions
      .filter((row) => row.asset_id === params.assetId && ['verified', 'corrected', 'reversed'].includes(row.status))
      .sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime())
      .slice(0, limit)
      .map((row) => {
        const staff = fieldStaff.find((candidate) => candidate.id === row.staff_id);
        return {
          submission_id: row.id,
          metric_key: row.metric_key,
          summary: row.payload,
          quantity: row.quantity,
          unit: unitFor(row.metric_key),
          status: row.status,
          work_date: row.work_date,
          amount_spent: row.amount_spent,
          field_staff: staff ? { id: staff.id, full_name: `${staff.first_name} ${staff.last_name}` } : null,
        };
      });
  },

  'GET /admin/assets/:assetId/boundary': ({ params }) => {
    requireAsset(params.assetId);
    return boundaryVersions(params.assetId);
  },

  'PUT /admin/assets/:assetId/boundary': ({ params, body: raw }) => {
    requireAsset(params.assetId);
    const dto = body<{ front?: number; right?: number; back?: number; left?: number; note?: string }>(raw);

    for (const key of SIDES) {
      const value = dto[key];
      if (typeof value !== 'number' || value < 0.01 || value > 100_000) {
        throw new MockHttpError(400, `${key} must be a number of metres above zero`, 'VALIDATION_FAILED');
      }
    }

    const sides: Sides = { front: dto.front!, right: dto.right!, back: dto.back!, left: dto.left! };
    const created = approveBoundary(params.assetId, sides, 'admin', dto.note?.trim() || null);

    return { version: created.version, sides: created.sides, perimeter_metres: created.perimeter_metres };
  },
};
