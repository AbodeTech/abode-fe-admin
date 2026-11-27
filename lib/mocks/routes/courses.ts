import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';
import { ADMINS } from './cs-managers';
import { PEOPLE } from './people';
import { requireMockPermission, requireSession } from './auth';

/* ============================================================
 * Courses — the Academy domain owns /admin/courses/*, /admin/modules/*,
 * /admin/content-blocks/*, /admin/learners and /admin/academy-settings.
 *
 * Mirrors abode-be-v2 staging `7fefe13` as features/courses/schemas transcribes
 * it: a course carries NO estate link, `require_in_order`, `credential_renewal`
 * or roll-up counts (an earlier version of this mock invented all of them from
 * the design mockup, which is why every course failed to parse). Counts the UI
 * wants come from `modules.length` on the detail response and from list
 * `meta.total`. `GET /admin/courses/:id` returns the modules with their blocks
 * inline; the course list does not.
 *
 * Guards: `view_courses` reads, `manage_courses` writes, `view_course_learners`
 * the learner reports. Recruitment holds all three (authoring is their job); Sales
 * holds the two view keys only, so they can browse but not author; Support none.
 *
 * Not mocked here (still 404): media upload and the quiz settings / questions
 * families. Seeded blocks are text only, so nothing in the fixtures points at a
 * media asset that does not exist.
 * ============================================================ */

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const nid = (prefix: string, n: number) => `${prefix}${String(n).padStart(24 - prefix.length, '0')}`;

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

type Audience = 'realtor' | 'buyer' | 'both';
type Status = 'draft' | 'published' | 'archived';

type MockCourse = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  status: Status;
  audience: Audience;
  estimated_minutes: number;
  credential_validity_months: number | null;
  grants_credential: boolean;
  created_by: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type MockModule = { id: string; course_id: string; title: string; position: number };
type MockBlock = { id: string; module_id: string; type: 'text' | 'video' | 'image' | 'file' | 'quiz'; position: number; payload: Record<string, unknown> };

const AUTHOR = ADMINS[0]._id;

const courses: MockCourse[] = [];
const modules: MockModule[] = [];
const blocks: MockBlock[] = [];
let counter = 100;

function addCourse(partial: Partial<MockCourse> & Pick<MockCourse, 'id' | 'title' | 'audience'>, moduleTitles: string[]): MockCourse {
  const row: MockCourse = {
    slug: slugify(partial.title),
    summary: null,
    cover_image: null,
    status: 'draft',
    estimated_minutes: 0,
    credential_validity_months: null,
    grants_credential: false,
    created_by: AUTHOR,
    published_at: null,
    created_at: daysAgo(30),
    updated_at: daysAgo(2),
    ...partial,
  };
  courses.push(row);
  moduleTitles.forEach((title, i) => {
    const mod: MockModule = { id: nid('66cc0b', counter++), course_id: row.id, title, position: i + 1 };
    modules.push(mod);
    blocks.push({
      id: nid('66cc0c', counter++),
      module_id: mod.id,
      type: 'text',
      position: 1,
      payload: { html: `<p>${title}: the points a ${row.audience === 'buyer' ? 'buyer' : 'realtor'} needs before the next conversation.</p>` },
    });
  });
  return row;
}

addCourse(
  {
    id: nid('66cc0a', 1),
    title: 'Selling Woodgate Prime',
    summary: "What Woodgate Prime costs, how the plan works, what the title is today, and when a client's plot gets allocated.",
    audience: 'realtor',
    status: 'published',
    published_at: daysAgo(26),
    estimated_minutes: 35,
    created_at: daysAgo(40),
  },
  ['The estate at a glance', 'Pricing and plans', 'Title today', 'Allocation timeline'],
);
addCourse(
  {
    id: nid('66cc0a', 2),
    title: 'Abode Associate Certification',
    summary: 'The five-module course every associate takes to earn the Abode certification badge.',
    audience: 'realtor',
    status: 'published',
    published_at: daysAgo(60),
    grants_credential: true,
    credential_validity_months: 12,
    estimated_minutes: 48,
    created_at: daysAgo(90),
  },
  ['Who Abode is', 'The products', 'The sales conversation', 'Commission and payouts', 'Certification quiz'],
);
addCourse(
  {
    id: nid('66cc0a', 3),
    title: 'Selling The District',
    summary: 'The District: pricing, the plan, and what to tell a buyer about title today.',
    audience: 'realtor',
    status: 'published',
    published_at: daysAgo(18),
    estimated_minutes: 32,
    created_at: daysAgo(24),
  },
  ['The district at a glance', 'Plans', 'Title questions', 'Closing the sale'],
);
addCourse(
  {
    id: nid('66cc0a', 4),
    title: 'Handling title questions',
    summary: 'How to answer the title and C of O questions that come up most in a sales conversation.',
    audience: 'both',
    status: 'published',
    published_at: daysAgo(33),
    estimated_minutes: 28,
    created_at: daysAgo(45),
  },
  ['What a C of O is', 'Survey and deed', 'Answering the hard questions'],
);
addCourse(
  {
    id: nid('66cc0a', 5),
    title: 'Selling Empire Park',
    summary: 'Empire Park: what is already built, the plan, and the allocation threshold.',
    audience: 'realtor',
    estimated_minutes: 30,
    created_at: daysAgo(7),
    updated_at: daysAgo(7),
  },
  ['Built so far', 'The plan', 'Allocation threshold', 'Objections'],
);
addCourse(
  {
    id: nid('66cc0a', 6),
    title: 'Understanding your land documents',
    summary: 'What a deed of assignment, survey and C of O each are, and what a buyer should expect to receive.',
    audience: 'buyer',
    estimated_minutes: 22,
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  },
  ['Deed of assignment', 'Survey plan', 'Certificate of occupancy'],
);
// Empty on purpose: publishing it is refused (COURSE_EMPTY), as it is on the BE.
addCourse(
  {
    id: nid('66cc0a', 7),
    title: 'What allocation means',
    summary: "Allocation explained for buyers: what it is, and when a client's plot gets assigned.",
    audience: 'buyer',
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  },
  [],
);
addCourse(
  {
    id: nid('66cc0a', 8),
    title: 'Selling Harmony Gardens (2025)',
    summary: 'Retired with the estate sell-out. Kept for the record.',
    audience: 'realtor',
    status: 'archived',
    published_at: daysAgo(300),
    estimated_minutes: 26,
    created_at: daysAgo(320),
    updated_at: daysAgo(120),
  },
  ['The estate', 'The plan'],
);

/** The singleton. Exactly one published course holds it; the course rows carry no flag. */
let firstSalePathCourseId: string | null = courses[0].id;

/* ------------------------------ helpers ------------------------------ */

function requireCourse(id: string): MockCourse {
  const row = courses.find((candidate) => candidate.id === id);
  if (!row) throw new MockHttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  return row;
}

function requireModule(id: string): MockModule {
  const row = modules.find((candidate) => candidate.id === id);
  if (!row) throw new MockHttpError(404, 'Module not found', 'MODULE_NOT_FOUND');
  return row;
}

function requireBlock(id: string): MockBlock {
  const row = blocks.find((candidate) => candidate.id === id);
  if (!row) throw new MockHttpError(404, 'Content block not found', 'CONTENT_BLOCK_NOT_FOUND');
  return row;
}

const modulesOf = (courseId: string) => modules.filter((m) => m.course_id === courseId).sort((a, b) => a.position - b.position);
const blocksOf = (moduleId: string) => blocks.filter((b) => b.module_id === moduleId).sort((a, b) => a.position - b.position);
const touch = (course: MockCourse) => {
  course.updated_at = new Date().toISOString();
};

const canWrite = () => requireMockPermission('manage_courses', 'You need permission to manage courses');
const canRead = () => requireMockPermission('view_courses', 'You need permission to view courses');

/** Renumber a list 1..n in the given order. */
function renumber<T extends { position: number }>(ordered: T[]): T[] {
  ordered.forEach((row, i) => {
    row.position = i + 1;
  });
  return ordered;
}

/** Same all-or-nothing rule as the BE: every sibling listed exactly once. */
function applyReorder<T extends { id: string; position: number }>(siblings: T[], orderedIds: unknown): T[] {
  const ids = Array.isArray(orderedIds) ? (orderedIds as string[]) : [];
  const same = ids.length === siblings.length && new Set(ids).size === ids.length && siblings.every((s) => ids.includes(s.id));
  if (!same) throw new MockHttpError(400, 'ordered_ids must list every existing sibling exactly once', 'REORDER_SET_MISMATCH');
  return renumber(ids.map((id) => siblings.find((s) => s.id === id)!));
}

const publicCourse = (c: MockCourse) => ({ ...c });

/* ------------------------------ learners ------------------------------ */

type MockLearner = { id: string; name: string; email: string; tier: string };

const EXTRA_NAMES: Array<[name: string, tier: string]> = [
  ['Chidinma Okoro', 'associate'], ['Yusuf Lawal', 'associate-pro'], ['Bisola Adeoye', 'associate'], ['Emmanuel Idowu', 'user'],
  ['Halima Sani', 'associate'], ['Kunle Ajayi', 'associate-pro'], ['Rita Ekwueme', 'premium'], ['Samuel Odion', 'associate'],
];

const EXTRA_LEARNERS: MockLearner[] = EXTRA_NAMES.map(([name, tier], i) => ({
  id: nid('665fcccc00000000d', i + 1),
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
  tier,
}));

const LEARNERS: MockLearner[] = [
  ...PEOPLE.map((p) => ({ id: p._id, name: `${p.firstName} ${p.lastName}`, email: p.email, tier: p.referral_status })),
  ...EXTRA_LEARNERS,
];

type Enrolment = {
  enrolment_id: string;
  course_id: string;
  learner: MockLearner;
  started_at: string;
  completed_at: string | null;
  completed_modules: number;
  attempts: { total: number; failed: number; passed: boolean; best_score_pct: number | null };
};

/**
 * Eight learners on every published or archived course, spread from complete to
 * not started so each progress state, and the failed-attempts column, has a row.
 */
function seedEnrolments(): Enrolment[] {
  const rows: Enrolment[] = [];
  courses
    .filter((c) => c.status !== 'draft')
    .forEach((course, ci) => {
      const total = modulesOf(course.id).length;
      for (let li = 0; li < 8; li++) {
        const learner = LEARNERS[(ci * 3 + li) % LEARNERS.length];
        const stage = (li * 3 + ci) % 5; // 0 complete, 1 three-quarters, 2 half, 3 a quarter, 4 not started
        const completed = stage === 0 ? total : Math.floor((total * (4 - stage)) / 4);
        const complete = total > 0 && completed === total;
        const tried = complete ? 1 + (li % 2) : completed > 0 ? li % 3 : 0;
        const failed = complete ? tried - 1 : tried;
        rows.push({
          enrolment_id: nid('66cc0d', ++counter),
          course_id: course.id,
          learner,
          started_at: daysAgo(3 + li * 4 + ci),
          completed_at: complete ? daysAgo(1 + li) : null,
          completed_modules: completed,
          attempts: {
            total: tried,
            failed,
            passed: complete,
            best_score_pct: tried ? (complete ? 80 + (li % 20) : 35 + ((li * 5) % 30)) : null,
          },
        });
      }
    });
  return rows;
}

const enrolments = seedEnrolments();

function enrolmentRow(e: Enrolment) {
  const mods = modulesOf(e.course_id);
  const total = mods.length;
  // Where they stopped: the first block of the module after the last one finished.
  const resumeModule = mods[Math.min(e.completed_modules, Math.max(total - 1, 0))];
  const lastBlock = resumeModule ? blocksOf(resumeModule.id)[0] : undefined;
  return {
    enrolment_id: e.enrolment_id,
    course_id: e.course_id,
    learner: { id: e.learner.id, name: e.learner.name, email: e.learner.email, tier: e.learner.tier },
    started_at: e.started_at,
    completed_at: e.completed_at,
    last_block_id: e.completed_modules === 0 && e.attempts.total === 0 ? null : (lastBlock?.id ?? null),
    progress: {
      completed_modules: e.completed_modules,
      total_modules: total,
      percent: total ? Math.round((e.completed_modules / total) * 100) : 0,
      complete: total > 0 && e.completed_modules === total,
    },
    attempts: e.attempts,
  };
}

const newestFirst = (a: Enrolment, b: Enrolment) => b.started_at.localeCompare(a.started_at);

/* ------------------------------- routes ------------------------------- */

export const courseRoutes: MockRoutes = {
  'GET /admin/courses': ({ query }) => {
    canRead();
    // The wire param is `q`; the BE refuses an unknown query key.
    const search = String(query.q ?? '').trim().toLowerCase();
    const status = query.status ? String(query.status) : null;
    const audience = query.audience ? String(query.audience) : null;

    const rows = courses
      .filter((row) => (status ? row.status === status : true))
      .filter((row) => (audience ? row.audience === audience : true))
      .filter((row) => (search ? row.title.toLowerCase().includes(search) : true))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(publicCourse);

    return paged(rows, query);
  },

  'POST /admin/courses': ({ body: raw }) => {
    canWrite();
    const dto = body<{ title?: string; audience?: Audience; summary?: string }>(raw);
    if (!dto.title?.trim()) throw new MockHttpError(400, 'title should not be empty', 'VALIDATION_FAILED');
    if (!dto.audience || !['realtor', 'buyer', 'both'].includes(dto.audience)) {
      throw new MockHttpError(400, 'audience must be one of the following values: realtor, buyer, both', 'VALIDATION_FAILED');
    }

    let slug = slugify(dto.title);
    if (courses.some((c) => c.slug === slug)) slug = `${slug}-${courses.length + 1}`;

    const created: MockCourse = {
      id: nid('66cc0a', ++counter),
      title: dto.title.trim(),
      slug,
      summary: dto.summary?.trim() || null,
      cover_image: null,
      status: 'draft',
      audience: dto.audience,
      estimated_minutes: 0,
      credential_validity_months: null,
      grants_credential: false,
      created_by: requireSession().id,
      published_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    courses.unshift(created);
    return publicCourse(created);
  },

  // The only route that returns modules, each with its blocks.
  'GET /admin/courses/:id': ({ params }) => {
    canRead();
    const row = requireCourse(params.id);
    return {
      ...publicCourse(row),
      modules: modulesOf(row.id).map((m) => ({ ...m, blocks: blocksOf(m.id) })),
    };
  },

  'PATCH /admin/courses/:id': ({ params, body: raw }) => {
    canWrite();
    const row = requireCourse(params.id);
    const dto = body<Partial<Pick<MockCourse, 'title' | 'slug' | 'summary' | 'cover_image' | 'audience' | 'estimated_minutes' | 'grants_credential' | 'credential_validity_months'>>>(raw);

    if (dto.slug !== undefined && courses.some((c) => c.id !== row.id && c.slug === dto.slug)) {
      throw new MockHttpError(409, 'Another course already uses that slug', 'COURSE_SLUG_TAKEN');
    }
    if (dto.title !== undefined) row.title = dto.title;
    if (dto.slug !== undefined) row.slug = dto.slug;
    if (dto.summary !== undefined) row.summary = dto.summary;
    if (dto.cover_image !== undefined) row.cover_image = dto.cover_image;
    if (dto.audience !== undefined) row.audience = dto.audience;
    if (dto.estimated_minutes !== undefined) row.estimated_minutes = dto.estimated_minutes;
    if (dto.grants_credential !== undefined) row.grants_credential = dto.grants_credential;
    if (dto.credential_validity_months !== undefined) row.credential_validity_months = dto.credential_validity_months;
    touch(row);
    return publicCourse(row);
  },

  // Not a generic status PATCH: an empty course (no modules, or a module with no blocks) is refused.
  'POST /admin/courses/:id/publish': ({ params }) => {
    canWrite();
    const row = requireCourse(params.id);
    const mods = modulesOf(row.id);
    if (mods.length === 0 || mods.some((m) => blocksOf(m.id).length === 0)) {
      throw new MockHttpError(400, 'A course needs at least one module, and every module needs content, before it can be published', 'COURSE_EMPTY');
    }
    row.status = 'published';
    row.published_at = row.published_at ?? new Date().toISOString();
    touch(row);
    return publicCourse(row);
  },

  'POST /admin/courses/:id/unpublish': ({ params }) => {
    canWrite();
    const row = requireCourse(params.id);
    row.status = 'draft';
    if (firstSalePathCourseId === row.id) firstSalePathCourseId = null;
    touch(row);
    return publicCourse(row);
  },

  'DELETE /admin/courses/:id': ({ params }) => {
    canWrite();
    const row = requireCourse(params.id);
    if (firstSalePathCourseId === row.id) firstSalePathCourseId = null;
    for (const m of modulesOf(row.id)) {
      for (const b of blocksOf(m.id)) blocks.splice(blocks.indexOf(b), 1);
      modules.splice(modules.indexOf(m), 1);
    }
    courses.splice(courses.indexOf(row), 1);
    return { message: 'Course deleted' };
  },

  'GET /admin/academy-settings': () => {
    canRead();
    return { first_sale_path_course_id: firstSalePathCourseId };
  },

  // `null` clears it. Only a published course can hold it.
  'PATCH /admin/academy-settings': ({ body: raw }) => {
    canWrite();
    const dto = body<{ first_sale_path_course_id?: string | null }>(raw);
    if (dto.first_sale_path_course_id === undefined) {
      throw new MockHttpError(400, 'first_sale_path_course_id must be a string or null', 'VALIDATION_FAILED');
    }
    if (dto.first_sale_path_course_id !== null) {
      const target = requireCourse(dto.first_sale_path_course_id);
      if (target.status !== 'published') {
        throw new MockHttpError(400, 'Only a published course can be the first-sale path', 'FIRST_SALE_COURSE_NOT_PUBLISHED');
      }
    }
    firstSalePathCourseId = dto.first_sale_path_course_id;
    return { first_sale_path_course_id: firstSalePathCourseId };
  },

  /* ---------- learners ---------- */

  'GET /admin/courses/:id/learners': ({ params, query }) => {
    requireMockPermission('view_course_learners', 'You need permission to view course learners');
    const course = requireCourse(params.id);
    return paged(enrolments.filter((e) => e.course_id === course.id).sort(newestFirst).map(enrolmentRow), query);
  },

  'GET /admin/learners': ({ query }) => {
    requireMockPermission('view_course_learners', 'You need permission to view course learners');
    const courseId = query.course_id ? String(query.course_id) : null;
    const rows = enrolments
      .filter((e) => !courseId || e.course_id === courseId)
      .sort(newestFirst)
      .map((e) => ({ ...enrolmentRow(e), course_title: courses.find((c) => c.id === e.course_id)?.title ?? null }));
    return paged(rows, query);
  },

  /* ---------- modules ---------- */

  'GET /admin/courses/:id/modules': ({ params }) => {
    canRead();
    return modulesOf(requireCourse(params.id).id);
  },

  'POST /admin/courses/:id/modules': ({ params, body: raw }) => {
    canWrite();
    const course = requireCourse(params.id);
    const { title } = body<{ title?: string }>(raw);
    if (!title?.trim()) throw new MockHttpError(400, 'title should not be empty', 'VALIDATION_FAILED');
    const created: MockModule = {
      id: nid('66cc0b', ++counter),
      course_id: course.id,
      title: title.trim(),
      position: modulesOf(course.id).length + 1,
    };
    modules.push(created);
    touch(course);
    return created;
  },

  'PATCH /admin/modules/reorder': ({ body: raw }) => {
    canWrite();
    const { parent_id, ordered_ids } = body<{ parent_id?: string; ordered_ids?: unknown }>(raw);
    const course = requireCourse(parent_id ?? '');
    return applyReorder(modulesOf(course.id), ordered_ids);
  },

  'PATCH /admin/modules/:id': ({ params, body: raw }) => {
    canWrite();
    const row = requireModule(params.id);
    const { title } = body<{ title?: string }>(raw);
    if (!title?.trim()) throw new MockHttpError(400, 'title should not be empty', 'VALIDATION_FAILED');
    row.title = title.trim();
    return row;
  },

  'DELETE /admin/modules/:id': ({ params }) => {
    canWrite();
    const row = requireModule(params.id);
    for (const b of blocksOf(row.id)) blocks.splice(blocks.indexOf(b), 1);
    modules.splice(modules.indexOf(row), 1);
    renumber(modulesOf(row.course_id));
    return { message: 'Module deleted' };
  },

  /* ---------- content blocks ---------- */

  'GET /admin/modules/:id/blocks': ({ params }) => {
    canRead();
    return blocksOf(requireModule(params.id).id);
  },

  'POST /admin/modules/:id/blocks': ({ params, body: raw }) => {
    canWrite();
    const mod = requireModule(params.id);
    const { type, payload } = body<{ type?: MockBlock['type']; payload?: Record<string, unknown> }>(raw);
    if (!type || !['text', 'video', 'image', 'file', 'quiz'].includes(type)) {
      throw new MockHttpError(400, 'type must be one of the following values: text, video, image, file, quiz', 'VALIDATION_FAILED');
    }
    const created: MockBlock = {
      id: nid('66cc0c', ++counter),
      module_id: mod.id,
      type,
      position: blocksOf(mod.id).length + 1,
      payload: payload ?? {},
    };
    blocks.push(created);
    return created;
  },

  'PATCH /admin/content-blocks/reorder': ({ body: raw }) => {
    canWrite();
    const { parent_id, ordered_ids } = body<{ parent_id?: string; ordered_ids?: unknown }>(raw);
    const mod = requireModule(parent_id ?? '');
    return applyReorder(blocksOf(mod.id), ordered_ids);
  },

  'PATCH /admin/content-blocks/:id': ({ params, body: raw }) => {
    canWrite();
    const row = requireBlock(params.id);
    const { payload } = body<{ payload?: Record<string, unknown> }>(raw);
    if (!payload || typeof payload !== 'object') throw new MockHttpError(400, 'payload must be an object', 'VALIDATION_FAILED');
    row.payload = payload;
    return row;
  },

  'DELETE /admin/content-blocks/:id': ({ params }) => {
    canWrite();
    const row = requireBlock(params.id);
    blocks.splice(blocks.indexOf(row), 1);
    renumber(blocksOf(row.module_id));
    return { message: 'Content block deleted' };
  },
};
