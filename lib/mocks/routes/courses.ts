import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Courses — the Academy domain owns /admin/courses/* and
 * /admin/academy-settings/*.
 *
 * 🚧 Entirely provisional — abode-be-v2 has no courses model yet. Fixtures
 * mirror docs reference course-system-admin.html screen 1 (the courses
 * table) so mock mode and the design stay in step.
 *
 * `academy_settings` is a singleton: exactly one realtor course can hold
 * `first_sale_path_course_id`. Each course also carries a denormalized
 * `is_first_sale_path` for cheap list/detail reads — the routes below keep
 * that flag in sync with the singleton on every write, so it is never the
 * source of truth, only a cache of it.
 * ============================================================ */

type MockCourse = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  audience: 'realtor' | 'buyer';
  estate_id: string | null;
  estate_name: string | null;
  cover_url: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  require_in_order: boolean;
  grants_credential: boolean;
  credential_validity_months: number | null;
  credential_renewal: 'refresher' | 'full_retake' | null;
  is_first_sale_path: boolean;
  modules_count: number;
  learners_count: number;
  completed_count: number;
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const course = (
  partial: Partial<MockCourse> & Pick<MockCourse, 'id' | 'title' | 'audience'>
): MockCourse => ({
  slug: slugify(partial.title),
  summary: '',
  estate_id: null,
  estate_name: null,
  cover_url: null,
  status: 'draft',
  published_at: null,
  require_in_order: false,
  grants_credential: false,
  credential_validity_months: null,
  credential_renewal: null,
  is_first_sale_path: false,
  modules_count: 0,
  learners_count: 0,
  completed_count: 0,
  estimated_minutes: 0,
  created_at: daysAgo(30),
  updated_at: daysAgo(2),
  ...partial,
});

const courses: MockCourse[] = [
  course({
    id: '66cc0a0000000000000001',
    title: 'Selling Woodgate Prime',
    summary:
      "What Woodgate Prime costs, how the plan works, what the title is today, and when a client's plot gets allocated.",
    audience: 'realtor',
    estate_id: '665faaaa00000000000000a1',
    estate_name: 'Woodgate Prime',
    status: 'published',
    published_at: daysAgo(26),
    is_first_sale_path: true,
    modules_count: 4,
    learners_count: 128,
    completed_count: 78,
    estimated_minutes: 35,
    created_at: daysAgo(40),
  }),
  course({
    id: '66cc0a0000000000000002',
    title: 'Abode Associate Certification',
    summary: 'The five-module course every associate takes to earn the Abode certification badge.',
    audience: 'realtor',
    status: 'published',
    published_at: daysAgo(60),
    grants_credential: true,
    credential_validity_months: 12,
    credential_renewal: 'refresher',
    modules_count: 5,
    learners_count: 96,
    completed_count: 34,
    estimated_minutes: 48,
    created_at: daysAgo(90),
  }),
  course({
    id: '66cc0a0000000000000003',
    title: 'Selling The District',
    summary: 'The District: pricing, the plan, and what to tell a buyer about title today.',
    audience: 'realtor',
    estate_id: '665faaaa00000000000000a3',
    estate_name: 'The District',
    status: 'published',
    published_at: daysAgo(18),
    modules_count: 4,
    learners_count: 41,
    completed_count: 9,
    estimated_minutes: 32,
    created_at: daysAgo(24),
  }),
  course({
    id: '66cc0a0000000000000004',
    title: 'Handling title questions',
    summary: 'How to answer the title and C of O questions that come up most in a sales conversation.',
    audience: 'realtor',
    status: 'published',
    published_at: daysAgo(33),
    modules_count: 3,
    learners_count: 64,
    completed_count: 31,
    estimated_minutes: 28,
    created_at: daysAgo(45),
  }),
  course({
    id: '66cc0a0000000000000005',
    title: 'Selling Empire Park',
    summary: 'Empire Park: what is already built, the plan, and the allocation threshold.',
    audience: 'realtor',
    estate_id: '665faaaa00000000000000a6',
    estate_name: 'Empire Park',
    status: 'draft',
    modules_count: 4,
    estimated_minutes: 30,
    created_at: daysAgo(7),
    updated_at: daysAgo(7),
  }),
  course({
    id: '66cc0a0000000000000006',
    title: 'Understanding your land documents',
    summary: 'What a deed of assignment, survey and C of O each are, and what a buyer should expect to receive.',
    audience: 'buyer',
    status: 'draft',
    modules_count: 3,
    estimated_minutes: 22,
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  }),
  course({
    id: '66cc0a0000000000000007',
    title: 'What allocation means',
    summary: "Allocation explained for buyers: what it is, and when a client's plot gets assigned.",
    audience: 'buyer',
    status: 'draft',
    modules_count: 2,
    estimated_minutes: 15,
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  }),
];

function requireCourse(id: string): MockCourse {
  const row = courses.find((candidate) => candidate.id === id);
  if (!row) throw new MockHttpError(404, 'Course not found', 'COURSE_NOT_FOUND');
  return row;
}

/** The one thing that can never be true of two courses at once. */
let firstSalePathCourseId: string | null = courses.find((c) => c.is_first_sale_path)?.id ?? null;

export const courseRoutes: MockRoutes = {
  'GET /admin/courses': ({ query }) => {
    const search = String(query.search ?? '').trim().toLowerCase();
    const status = query.status ? String(query.status) : null;
    const audience = query.audience ? String(query.audience) : null;

    const rows = courses
      .filter((row) => (status ? row.status === status : true))
      .filter((row) => (audience ? row.audience === audience : true))
      .filter((row) => (search ? row.title.toLowerCase().includes(search) : true))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return paged(rows, query);
  },

  'GET /admin/courses/summary': () => ({
    total: courses.length,
    published: courses.filter((c) => c.status === 'published').length,
    draft: courses.filter((c) => c.status === 'draft').length,
    realtor: courses.filter((c) => c.audience === 'realtor').length,
    buyer: courses.filter((c) => c.audience === 'buyer').length,
  }),

  'POST /admin/courses': ({ body: raw }) => {
    const dto = body<{ title?: string; audience?: 'realtor' | 'buyer'; summary?: string }>(raw);

    if (!dto.title?.trim()) {
      throw new MockHttpError(400, 'title should not be empty', 'VALIDATION_FAILED');
    }
    if (!dto.audience) {
      throw new MockHttpError(400, 'audience should not be empty', 'VALIDATION_FAILED');
    }

    const created = course({
      id: `66cc0a${String(Date.now()).slice(-18)}`,
      title: dto.title.trim(),
      audience: dto.audience,
      summary: dto.summary?.trim() ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    courses.unshift(created);
    return created;
  },

  'GET /admin/courses/:id': ({ params }) => requireCourse(params.id),

  'PATCH /admin/courses/:id': ({ params, body: raw }) => {
    const row = requireCourse(params.id);
    const dto = body<{
      title?: string;
      summary?: string;
      audience?: 'realtor' | 'buyer';
      estate_id?: string | null;
      cover_url?: string | null;
      grants_credential?: boolean;
      credential_validity_months?: number | null;
      credential_renewal?: 'refresher' | 'full_retake' | null;
    }>(raw);

    if (dto.title !== undefined) {
      row.title = dto.title;
      row.slug = slugify(dto.title);
    }
    if (dto.summary !== undefined) row.summary = dto.summary;
    if (dto.audience !== undefined) {
      // Buyer courses can't hold the first-sale path — switching audience away
      // from realtor clears it, mirroring what the BE's constraint would do.
      if (dto.audience === 'buyer' && firstSalePathCourseId === row.id) {
        firstSalePathCourseId = null;
        row.is_first_sale_path = false;
      }
      row.audience = dto.audience;
    }
    if (dto.estate_id !== undefined) row.estate_id = dto.estate_id;
    if (dto.cover_url !== undefined) row.cover_url = dto.cover_url;
    if (dto.grants_credential !== undefined) row.grants_credential = dto.grants_credential;
    if (dto.credential_validity_months !== undefined) {
      row.credential_validity_months = dto.credential_validity_months;
    }
    if (dto.credential_renewal !== undefined) row.credential_renewal = dto.credential_renewal;

    row.updated_at = new Date().toISOString();
    return row;
  },

  'PATCH /admin/courses/:id/status': ({ params, body: raw }) => {
    const row = requireCourse(params.id);
    const dto = body<{ status?: 'draft' | 'published' }>(raw);
    if (dto.status !== 'draft' && dto.status !== 'published') {
      throw new MockHttpError(400, 'status must be draft or published', 'VALIDATION_FAILED');
    }

    row.status = dto.status;
    if (dto.status === 'published' && !row.published_at) {
      row.published_at = new Date().toISOString();
    }
    row.updated_at = new Date().toISOString();
    return row;
  },

  'DELETE /admin/courses/:id': ({ params }) => {
    const row = requireCourse(params.id);
    if (firstSalePathCourseId === row.id) firstSalePathCourseId = null;
    courses.splice(courses.indexOf(row), 1);
    return { message: 'Course deleted' };
  },

  'GET /admin/academy-settings': () => ({
    first_sale_path_course_id: firstSalePathCourseId,
    first_sale_path_course_title: firstSalePathCourseId
      ? (courses.find((c) => c.id === firstSalePathCourseId)?.title ?? null)
      : null,
  }),

  'POST /admin/academy-settings/first-sale-path': ({ body: raw }) => {
    const dto = body<{ course_id?: string }>(raw);
    if (!dto.course_id) throw new MockHttpError(400, 'course_id should not be empty', 'VALIDATION_FAILED');

    const next = requireCourse(dto.course_id);
    if (next.audience !== 'realtor') {
      throw new MockHttpError(
        400,
        'Only a realtor course can be the first-sale path',
        'INVALID_FIRST_SALE_PATH_AUDIENCE'
      );
    }

    if (firstSalePathCourseId) {
      const previous = courses.find((c) => c.id === firstSalePathCourseId);
      if (previous) previous.is_first_sale_path = false;
    }

    firstSalePathCourseId = next.id;
    next.is_first_sale_path = true;

    return {
      first_sale_path_course_id: firstSalePathCourseId,
      first_sale_path_course_title: next.title,
    };
  },
};
