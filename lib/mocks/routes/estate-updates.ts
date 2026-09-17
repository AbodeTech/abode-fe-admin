import { MockHttpError, type MockRoutes } from '../router';
import { formatMockDate } from '../shared';
import { MOCK_ASSET_DIRECTORY } from './assets';
import { body, paged } from './util';

/* ============================================================
 * Estate updates — /admin/assets/:id/updates*.
 *
 *   GET   /admin/assets/:id/updates                     list (?status=&page=&limit=)
 *   GET   /admin/assets/:id/updates/:updateId           one update
 *   POST  /admin/assets/:id/updates                     create — always a draft
 *   PATCH /admin/assets/:id/updates/:updateId           edit fields, any status
 *   POST  /admin/assets/:id/updates/:updateId/publish   draft | archived → published
 *   POST  /admin/assets/:id/updates/:updateId/archive   draft | published → archived
 *
 * 🚧 Provisional until the abode-be-v2 estate-update module merges. Mirrors
 * `estate-update-admin.controller.ts` / `.service.ts` and `toAdminEstateUpdate`
 * on that branch. Carved out of the assets domain's /admin/assets/* claim (see
 * routes/index.ts): the segment after `:id` is the literal "updates", so no key
 * here can match an offers or blocks route.
 *
 * Kept identical to the BE where the UI can tell the difference:
 *  - every write returns the full admin shape, even though the FE write hooks
 *    parse `z.unknown()` — a stricter consumer later shouldn't find a gap
 *  - an unknown body key is a 400, as `forbidNonWhitelisted` makes it, which
 *    is what catches a PATCH that sends `status` or `published_at`
 *  - an update filed under another estate is a 404, because the BE scopes
 *    every read and write by `{ _id, asset_id }`
 *  - `published_at` is set once, on the first publish; archive never clears it
 *  - 404/409/name-check messages are the BE's own wording
 *
 * Deliberately lenient where the BE isn't: an asset id missing from the assets
 * fixture lists empty and accepts creates rather than 404ing ASSET_NOT_FOUND.
 * The estate-name check then has no name to compare against and passes.
 * ============================================================ */

const MOCK_ADMIN_ID = 'mock-admin-001';

const CATEGORIES = ['construction', 'title_documents', 'allocation', 'amenities', 'general'] as const;
const AUDIENCES = ['owners', 'everyone'] as const;

const HEADLINE_MAX = 80;
const BODY_MAX = 5000;
const MAX_IMAGES = 4;

type EstateUpdateStatus = 'draft' | 'published' | 'archived';

/** Exactly the keys of the FE's `EstateUpdateSchema` — there is no internal-only field to strip. */
type MockEstateUpdate = {
  id: string;
  asset_id: string;
  headline: string;
  category: (typeof CATEGORIES)[number];
  body: string | null;
  progress_percent: number | null;
  images: string[];
  audience: (typeof AUDIENCES)[number];
  status: EstateUpdateStatus;
  published_at: string | null;
  notified_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

/** The fields an admin writes. Mirrors `CreateEstateUpdateDto` / `UpdateEstateUpdateDto`. */
type EstateUpdateFields = Pick<
  MockEstateUpdate,
  'headline' | 'category' | 'body' | 'progress_percent' | 'images' | 'audience'
>;

const ALLOWED_KEYS: readonly string[] = ['headline', 'category', 'body', 'progress_percent', 'images', 'audience'];

// Legal status moves — mirrors `ESTATE_UPDATE_TRANSITIONS` in the BE's
// `estate-update.schema.ts`. Archive is the unpublish; there is no delete.
const STATUS_TRANSITIONS: Record<EstateUpdateStatus, EstateUpdateStatus[]> = {
  draft: ['published', 'archived'],
  published: ['archived'],
  archived: ['published'],
};

const rows: MockEstateUpdate[] = [];
let seq = 0;
let seeded = false;

function assetNameFor(assetId: string): string | null {
  return MOCK_ASSET_DIRECTORY.find((a) => a._id === assetId)?.name ?? null;
}

function requireUpdate(assetId: string, updateId: string): MockEstateUpdate {
  const row = rows.find((r) => r.id === updateId);
  if (!row || row.asset_id !== assetId) {
    throw new MockHttpError(404, 'Estate update not found', 'ESTATE_UPDATE_NOT_FOUND');
  }
  return row;
}

/** Shapes a row exactly like the BE's `toAdminEstateUpdate()`. `images` is copied so a caller can't reach the store. */
function publicEstateUpdate(row: MockEstateUpdate) {
  return {
    id: row.id,
    asset_id: row.asset_id,
    headline: row.headline,
    category: row.category,
    body: row.body,
    progress_percent: row.progress_percent,
    images: [...row.images],
    audience: row.audience,
    status: row.status,
    published_at: row.published_at,
    notified_at: row.notified_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * The publish body's only key, mirroring `PublishEstateUpdateDto`. Anything else is a 400,
 * the way `forbidNonWhitelisted` makes it on the BE.
 */
function readNotifyFlag(raw: unknown): boolean {
  const body = (raw ?? {}) as Record<string, unknown>;
  const unknown = Object.keys(body).filter((k) => k !== 'notify_subscribers');
  if (unknown.length) {
    throw new MockHttpError(400, `property ${unknown[0]} should not exist`);
  }
  const value = body.notify_subscribers;
  if (value !== undefined && typeof value !== 'boolean') {
    throw new MockHttpError(400, 'notify_subscribers must be a boolean value');
  }
  return value === true;
}

function requireTransition(row: MockEstateUpdate, target: EstateUpdateStatus): void {
  // A move to the same status is refused too — the BE has no idempotent no-op here.
  if (!STATUS_TRANSITIONS[row.status].includes(target)) {
    throw new MockHttpError(409, 'That status change is not allowed for this update', 'INVALID_STATUS_TRANSITION');
  }
}

/**
 * Same rule as the BE's `headlineMentionsEstate`: a case-insensitive substring
 * check against the trimmed asset name, skipped when that name is under 3
 * chars (or, here, unknown).
 */
function assertHeadlineOmitsEstate(headline: string, assetId: string): void {
  const name = assetNameFor(assetId)?.trim() ?? '';
  if (name.length < 3) return;
  if (headline.toLowerCase().includes(name.toLowerCase())) {
    throw new MockHttpError(
      400,
      'Leave the estate name out of the headline. It is shown next to it.',
      'HEADLINE_CONTAINS_ESTATE_NAME'
    );
  }
}

/**
 * The validation pipe, for both DTOs. `partial` is the PATCH: every field may
 * be left out, but none may be sent as `null` unless the DTO lets it (body,
 * progress_percent). Messages borrow class-validator's wording.
 *
 * Returns only the keys that were sent, normalized the way the service stores
 * them: headline trimmed, body `trim() || null`.
 */
function validatePayload(raw: unknown, { partial }: { partial: boolean }): Partial<EstateUpdateFields> {
  const dto = body<Record<string, unknown>>(raw);
  const invalid = (message: string) => new MockHttpError(400, message, 'VALIDATION_ERROR');
  const out: Partial<EstateUpdateFields> = {};

  const unknownKey = Object.keys(dto).find((key) => !ALLOWED_KEYS.includes(key));
  if (unknownKey) throw invalid(`property ${unknownKey} should not exist`);

  if (dto.headline !== undefined || !partial) {
    if (typeof dto.headline !== 'string') throw invalid('headline must be a string');
    const headline = dto.headline.trim();
    if (!headline) throw invalid('headline should not be empty');
    if (headline.length > HEADLINE_MAX) {
      throw invalid(`headline must be shorter than or equal to ${HEADLINE_MAX} characters`);
    }
    out.headline = headline;
  }

  if (dto.category !== undefined) {
    const category = CATEGORIES.find((c) => c === dto.category);
    if (!category) throw invalid(`category must be one of the following values: ${CATEGORIES.join(', ')}`);
    out.category = category;
  }

  if (dto.body !== undefined) {
    if (dto.body === null) {
      out.body = null;
    } else {
      if (typeof dto.body !== 'string') throw invalid('body must be a string');
      if (dto.body.length > BODY_MAX) throw invalid(`body must be shorter than or equal to ${BODY_MAX} characters`);
      out.body = dto.body.trim() || null;
    }
  }

  if (dto.progress_percent !== undefined) {
    const progress = dto.progress_percent;
    if (progress === null) {
      out.progress_percent = null;
    } else {
      if (typeof progress !== 'number' || !Number.isInteger(progress)) {
        throw invalid('progress_percent must be an integer number');
      }
      if (progress < 0) throw invalid('progress_percent must not be less than 0');
      if (progress > 100) throw invalid('progress_percent must not be greater than 100');
      out.progress_percent = progress;
    }
  }

  if (dto.images !== undefined) {
    const images = dto.images;
    if (!Array.isArray(images)) throw invalid('images must be an array');
    if (images.length > MAX_IMAGES) throw invalid(`images must contain no more than ${MAX_IMAGES} elements`);
    if (!images.every((url): url is string => typeof url === 'string')) {
      throw invalid('each value in images must be a URL address');
    }
    out.images = [...images];
  }

  if (dto.audience !== undefined) {
    const audience = AUDIENCES.find((a) => a === dto.audience);
    if (!audience) throw invalid(`audience must be one of the following values: ${AUDIENCES.join(', ')}`);
    out.audience = audience;
  }

  return out;
}

function insertRow(
  fields: Omit<MockEstateUpdate, 'id' | 'created_by' | 'updated_by' | 'notified_at'> & {
    notified_at?: string | null;
  }
): MockEstateUpdate {
  const row: MockEstateUpdate = {
    id: `eu-${++seq}`,
    notified_at: null,
    ...fields,
    created_by: MOCK_ADMIN_ID,
    updated_by: MOCK_ADMIN_ID,
  };
  rows.unshift(row);
  return row;
}

const SAMPLE_IMAGES = [
  'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1/samples/landscapes/nature-mountains.jpg',
];

type SeedRow = EstateUpdateFields & {
  asset_id: string;
  status: EstateUpdateStatus;
  /** `null` for an update that has never been published. */
  publishedDaysAgo: number | null;
};

// Aviation City and Harmony Gardens only — every other asset keeps the empty
// state reachable. Between them the rows cover each status, category and
// audience, a null progress, and an archived update that still has its
// published_at (so the row offers "Re-publish").
const SEED: SeedRow[] = [
  {
    asset_id: '665faaaa00000000000000a1',
    headline: 'Perimeter fencing reached 75%',
    category: 'construction',
    body: 'The eastern and southern walls are complete. Gatehouse work starts next month.',
    progress_percent: 75,
    images: [],
    audience: 'owners',
    status: 'published',
    publishedDaysAgo: 2,
  },
  {
    asset_id: '665faaaa00000000000000a1',
    headline: 'Road grading started on the main access road',
    category: 'construction',
    body: 'Graders are on site from the gate to the first roundabout. Expect dust on inspection days.',
    progress_percent: 20,
    images: [],
    audience: 'everyone',
    status: 'published',
    publishedDaysAgo: 9,
  },
  {
    asset_id: '665faaaa00000000000000a1',
    headline: 'Survey plans lodged with the lands registry',
    category: 'title_documents',
    body: null,
    progress_percent: null,
    images: [],
    audience: 'owners',
    status: 'archived',
    publishedDaysAgo: 30,
  },
  {
    asset_id: '665faaaa00000000000000a1',
    headline: 'Block C allocation opens in October',
    category: 'allocation',
    body: null,
    progress_percent: null,
    images: [],
    audience: 'owners',
    status: 'draft',
    publishedDaysAgo: null,
  },
  {
    asset_id: '665faaaa00000000000000a1',
    headline: 'Borehole and water tower completed',
    category: 'amenities',
    body: 'Water is now piped to every street in phase 1.',
    progress_percent: 100,
    images: SAMPLE_IMAGES,
    audience: 'everyone',
    status: 'published',
    publishedDaysAgo: 45,
  },
  {
    asset_id: '665faaaa00000000000000a2',
    headline: 'Clearing finished on Phase 2',
    category: 'construction',
    body: 'Surveyors return next week to re-peg the Phase 2 plots.',
    progress_percent: 40,
    images: [],
    audience: 'owners',
    status: 'published',
    publishedDaysAgo: 5,
  },
  {
    asset_id: '665faaaa00000000000000a2',
    headline: 'Estate newsletter for September',
    category: 'general',
    body: null,
    progress_percent: null,
    images: [],
    audience: 'everyone',
    status: 'draft',
    publishedDaysAgo: null,
  },
];

function seedIfNeeded(): void {
  if (seeded) return;
  seeded = true;

  SEED.forEach(({ publishedDaysAgo, images, ...fields }) => {
    // Written the day before it went out (a draft, yesterday); updated_at is
    // the later of the two.
    const published_at = publishedDaysAgo === null ? null : formatMockDate(publishedDaysAgo);
    const created_at = formatMockDate(publishedDaysAgo === null ? 1 : publishedDaysAgo + 1);
    insertRow({ ...fields, images: [...images], published_at, created_at, updated_at: published_at ?? created_at });
  });
}

export const estateUpdateRoutes: MockRoutes = {
  'GET /admin/assets/:id/updates': ({ params, query }) => {
    seedIfNeeded();
    let filtered = rows.filter((r) => r.asset_id === params.id);

    const status = query.status ? String(query.status) : null;
    if (status) filtered = filtered.filter((r) => r.status === status);

    // Newest written first, as the BE's `{ createdAt: -1, _id: -1 }` — not by
    // published_at, so drafts sit alongside published rows. Rows are unshifted
    // and the sort is stable, so a same-millisecond tie still lists newest first.
    filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const result = paged(filtered, query, 20);
    return { ...result, data: result.data.map(publicEstateUpdate) };
  },

  'GET /admin/assets/:id/updates/:updateId': ({ params }) => {
    seedIfNeeded();
    return publicEstateUpdate(requireUpdate(params.id, params.updateId));
  },

  'POST /admin/assets/:id/updates': ({ params, body: raw }) => {
    seedIfNeeded();
    const dto = validatePayload(raw, { partial: false });
    const headline = dto.headline as string; // required when not partial
    assertHeadlineOmitsEstate(headline, params.id);

    const now = new Date().toISOString();
    const row = insertRow({
      asset_id: params.id,
      headline,
      category: dto.category ?? 'general',
      body: dto.body ?? null,
      progress_percent: dto.progress_percent ?? null,
      images: dto.images ?? [],
      audience: dto.audience ?? 'owners',
      // Always a draft: the create DTO has no status, and publishing is its own step.
      status: 'draft',
      published_at: null,
      created_at: now,
      updated_at: now,
    });
    return publicEstateUpdate(row);
  },

  'PATCH /admin/assets/:id/updates/:updateId': ({ params, body: raw }) => {
    seedIfNeeded();
    const row = requireUpdate(params.id, params.updateId);
    const changes = validatePayload(raw, { partial: true });

    // Only a changed headline is re-checked, so renaming the asset never
    // blocks an unrelated edit to an older update.
    if (changes.headline !== undefined && changes.headline !== row.headline) {
      assertHeadlineOmitsEstate(changes.headline, params.id);
    }

    // The BE diffs before writing: a PATCH that changes nothing leaves
    // updated_at alone. status and published_at can't arrive here at all.
    let changed = false;
    for (const key of Object.keys(changes) as (keyof EstateUpdateFields)[]) {
      if (JSON.stringify(changes[key]) === JSON.stringify(row[key])) continue;
      Object.assign(row, { [key]: changes[key] });
      changed = true;
    }
    if (changed) {
      row.updated_by = MOCK_ADMIN_ID;
      row.updated_at = new Date().toISOString();
    }
    return publicEstateUpdate(row);
  },

  'POST /admin/assets/:id/updates/:updateId/publish': ({ params, body }) => {
    seedIfNeeded();
    const row = requireUpdate(params.id, params.updateId);
    requireTransition(row, 'published');
    const notify = readNotifyFlag(body);

    const now = new Date().toISOString();
    row.status = 'published';
    // Mailed once per update, as the BE stamps it: a re-publish never mails again.
    if (notify && row.notified_at === null) row.notified_at = now;
    // Set once: a re-publish from archived keeps the original date.
    row.published_at = row.published_at ?? now;
    row.updated_by = MOCK_ADMIN_ID;
    row.updated_at = now;
    return publicEstateUpdate(row);
  },

  'POST /admin/assets/:id/updates/:updateId/archive': ({ params }) => {
    seedIfNeeded();
    const row = requireUpdate(params.id, params.updateId);
    requireTransition(row, 'archived');

    // published_at is left as it is, null for a draft archived unpublished.
    row.status = 'archived';
    row.updated_by = MOCK_ADMIN_ID;
    row.updated_at = new Date().toISOString();
    return publicEstateUpdate(row);
  },
};
