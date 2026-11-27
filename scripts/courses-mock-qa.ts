/**
 * Academy courses — mock API verification.
 * Run: npx tsx scripts/courses-mock-qa.ts
 *
 * Courses showed "Response shape mismatch: data.0.cover_image … expected string" for
 * Recruitment, Sales and Developer: the mock still served the design-era shape
 * (cover_url, estate fields, roll-up counts) after the schema moved to the real BE
 * contract. This parses every route with the SAME Zod schemas the screens use and
 * checks the BE rules the UI depends on:
 *
 *   - publish is refused for an empty course (COURSE_EMPTY)
 *   - the first-sale path must be a published course, and is cleared on unpublish
 *   - reorder must list every sibling exactly once (REORDER_SET_MISMATCH)
 *   - Sales holds view_courses + view_course_learners only; Recruitment also holds manage_courses
 */
import { z } from 'zod';

import { AcademySettingsSchema } from '../features/courses/schemas/academy-settings.schema';
import {
  ContentBlockRefSchema,
  CourseDetailSchema,
  CourseModuleRefSchema,
  CourseSchema,
} from '../features/courses/schemas/course.schema';
import { EnrolmentRowSchema, GlobalEnrolmentRowSchema } from '../features/courses/schemas/learner.schema';
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { authRoutes } from '../lib/mocks/routes/auth';
import { courseRoutes } from '../lib/mocks/routes/courses';

registerRoutes(authRoutes);
registerRoutes(courseRoutes);

const call = (method: string, path: string, query: Record<string, unknown> = {}, body?: unknown) =>
  dispatchMockRoute({ method, path, query, body });
const signIn = (email: string) => call('POST', '/auth/admin/login', {}, { email, password: 'password123' });

type Result = { id: string; ok: boolean };
type Paged = { data: unknown[]; meta: { total?: number } };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number, code?: string) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status && (!code || e.code === code)) return;
    throw new Error(`expected ${status} ${code ?? ''}, got ${e instanceof MockHttpError ? `${e.statusCode} ${e.code}` : (e as Error).message}`);
  }
  throw new Error(`expected ${status} ${code ?? ''}, but the call succeeded`);
}

const courses = async (query: Record<string, unknown> = { page: 1, limit: 100 }) =>
  z.array(CourseSchema).parse(((await call('GET', '/admin/courses', query)) as Paged).data);
const detail = async (id: string) => CourseDetailSchema.parse(await call('GET', `/admin/courses/${id}`));

async function main() {
  const results: Result[] = [];
  const add = async (id: string, fn: () => Promise<void>) => results.push(await run(id, fn));

  /* ---------------- Sales: read-only ---------------- */
  await signIn('as-sales_member@abode.ng');
  let woodgate = '';
  let empty = '';

  await add('SALES-list-parses-the-real-shape-the-reported-failure', async () => {
    const all = await courses();
    assert(all.length === 8, `eight courses, got ${all.length}`);
    assert(all.some((c) => c.audience === 'both') && all.some((c) => c.status === 'archived'), 'covers audience "both" and status "archived"');
    woodgate = all.find((c) => c.title === 'Selling Woodgate Prime')!.id;
    empty = all.find((c) => c.title === 'What allocation means')!.id;
  });

  await add('SALES-filters-and-the-q-param', async () => {
    const published = await courses({ page: 1, limit: 100, status: 'published' });
    assert(published.length === 4 && published.every((c) => c.status === 'published'), 'status filter');
    assert((await courses({ page: 1, limit: 1, audience: 'buyer' })).length === 1, 'limit applies');
    const found = await courses({ page: 1, limit: 100, q: 'woodgate' });
    assert(found.length === 1 && found[0].title === 'Selling Woodgate Prime', 'q matches by title');
    const total = ((await call('GET', '/admin/courses', { page: 1, limit: 1 })) as Paged).meta.total;
    assert(total === 8, 'meta.total drives the summary chips');
  });

  await add('SALES-detail-has-modules-with-blocks', async () => {
    const d = await detail(woodgate);
    assert(d.modules.length === 4 && d.modules.every((m) => m.blocks.length > 0), 'modules with blocks, inline');
    assert(d.modules.every((m, i) => m.position === i + 1), 'positions run 1..n');
    assert((await detail(empty)).modules.length === 0, 'the empty draft has none');
    await expectError(() => call('GET', '/admin/courses/000000000000000000000000'), 404, 'COURSE_NOT_FOUND');
  });

  await add('SALES-learners-parse-and-cover-every-state', async () => {
    const page = (await call('GET', `/admin/courses/${woodgate}/learners`, { page: 1, limit: 50 })) as Paged;
    const rows = z.array(EnrolmentRowSchema).parse(page.data);
    assert(rows.length === 8 && page.meta.total === 8, 'eight enrolments');
    assert(rows.some((r) => r.progress.complete) && rows.some((r) => r.progress.percent === 0) && rows.some((r) => r.progress.percent > 0 && !r.progress.complete), 'complete, not started, and in between');
    assert(rows.every((r) => r.progress.total_modules === 4 && r.progress.complete === (r.completed_at !== null)), 'completion agrees with completed_at');
    assert(rows.every((r) => r.attempts.total >= r.attempts.failed && (r.attempts.total === 0) === (r.attempts.best_score_pct === null)), 'attempts add up; no score without an attempt');
    assert(rows.every((r) => (r.progress.percent === 0 && r.attempts.total === 0) === (r.last_block_id === null)), 'a learner who has not started has no last block');
    await expectError(() => call('GET', '/admin/courses/000000000000000000000000/learners'), 404, 'COURSE_NOT_FOUND');
    assert((((await call('GET', `/admin/courses/${empty}/learners`)) as Paged).data.length) === 0, 'a draft has no learners');
  });

  await add('SALES-global-learners-and-the-course-filter', async () => {
    const all = (await call('GET', '/admin/learners', { page: 1, limit: 100 })) as Paged;
    const rows = z.array(GlobalEnrolmentRowSchema).parse(all.data);
    assert(rows.length === 40 && rows.every((r) => r.course_title), 'five non-draft courses (four published, one archived) x eight, each with its title');
    const one = z.array(GlobalEnrolmentRowSchema).parse(((await call('GET', '/admin/learners', { page: 1, limit: 100, course_id: woodgate })) as Paged).data);
    assert(one.length === 8 && one.every((r) => r.course_id === woodgate), 'course_id filter');
  });

  await add('SALES-settings-readable-writes-refused', async () => {
    const s = AcademySettingsSchema.parse(await call('GET', '/admin/academy-settings'));
    assert(s.first_sale_path_course_id === woodgate, 'Woodgate is the first-sale path');
    await expectError(() => call('POST', '/admin/courses', {}, { title: 'X', audience: 'realtor' }), 403);
    await expectError(() => call('PATCH', `/admin/courses/${woodgate}`, {}, { title: 'X' }), 403);
    await expectError(() => call('POST', `/admin/courses/${woodgate}/unpublish`), 403);
    await expectError(() => call('PATCH', '/admin/academy-settings', {}, { first_sale_path_course_id: null }), 403);
    await expectError(() => call('POST', `/admin/courses/${woodgate}/modules`, {}, { title: 'X' }), 403);
    await expectError(() => call('DELETE', `/admin/courses/${woodgate}`), 403);
  });

  /* ---------------- Support has neither key ---------------- */
  await signIn('as-cs_manager@abode.ng');
  await add('SUPPORT-no-access-at-all', async () => {
    await expectError(() => call('GET', '/admin/courses'), 403);
    await expectError(() => call('GET', '/admin/learners'), 403);
  });

  /* ---------------- Super admin: writes ---------------- */
  await signIn('ada@abode.ng');
  let created = '';

  await add('ADMIN-create-validates-and-names-the-author', async () => {
    await expectError(() => call('POST', '/admin/courses', {}, { audience: 'realtor' }), 400);
    await expectError(() => call('POST', '/admin/courses', {}, { title: 'X', audience: 'everyone' }), 400);
    const c = CourseSchema.parse(await call('POST', '/admin/courses', {}, { title: 'Selling Woodgate Prime', audience: 'both', summary: ' A new angle ' }));
    created = c.id;
    assert(c.status === 'draft' && c.summary === 'A new angle' && c.created_by.length > 0, 'a draft, trimmed, with an author');
    assert(c.slug !== 'selling-woodgate-prime', 'a clashing title still gets a unique slug');
  });

  await add('ADMIN-edit-and-slug-conflict', async () => {
    const c = CourseSchema.parse(await call('PATCH', `/admin/courses/${created}`, {}, { estimated_minutes: 40, cover_image: 'https://cdn.example.com/c.png', grants_credential: true, credential_validity_months: 6 }));
    assert(c.estimated_minutes === 40 && c.grants_credential && c.credential_validity_months === 6 && c.cover_image, 'fields saved');
    await expectError(() => call('PATCH', `/admin/courses/${created}`, {}, { slug: 'selling-woodgate-prime' }), 409, 'COURSE_SLUG_TAKEN');
  });

  await add('ADMIN-publish-needs-content', async () => {
    await expectError(() => call('POST', `/admin/courses/${empty}/publish`), 400, 'COURSE_EMPTY');
    const m = CourseModuleRefSchema.parse(await call('POST', `/admin/courses/${created}/modules`, {}, { title: 'Start here' }));
    await expectError(() => call('POST', `/admin/courses/${created}/publish`), 400, 'COURSE_EMPTY');
    const b = ContentBlockRefSchema.parse(await call('POST', `/admin/modules/${m.id}/blocks`, {}, { type: 'text', payload: { html: '<p>Hello</p>' } }));
    assert(b.position === 1, 'first block');
    const published = CourseSchema.parse(await call('POST', `/admin/courses/${created}/publish`));
    assert(published.status === 'published' && published.published_at, 'published once it has content');
  });

  await add('ADMIN-first-sale-path-rules', async () => {
    const draft = (await courses()).find((c) => c.status === 'draft')!;
    await expectError(() => call('PATCH', '/admin/academy-settings', {}, { first_sale_path_course_id: draft.id }), 400, 'FIRST_SALE_COURSE_NOT_PUBLISHED');
    assert(AcademySettingsSchema.parse(await call('PATCH', '/admin/academy-settings', {}, { first_sale_path_course_id: created })).first_sale_path_course_id === created, 'moves to another published course');
    await call('POST', `/admin/courses/${created}/unpublish`);
    assert(AcademySettingsSchema.parse(await call('GET', '/admin/academy-settings')).first_sale_path_course_id === null, 'unpublishing the holder clears it');
    assert(AcademySettingsSchema.parse(await call('PATCH', '/admin/academy-settings', {}, { first_sale_path_course_id: null })).first_sale_path_course_id === null, 'null clears it');
  });

  await add('ADMIN-modules-and-blocks-crud-and-reorder', async () => {
    const d = await detail(woodgate);
    const ids = d.modules.map((m) => m.id);
    assert(z.array(CourseModuleRefSchema).parse(await call('GET', `/admin/courses/${woodgate}/modules`)).length === 4, 'modules list');

    await expectError(() => call('PATCH', '/admin/modules/reorder', {}, { parent_id: woodgate, ordered_ids: ids.slice(1) }), 400, 'REORDER_SET_MISMATCH');
    await expectError(() => call('PATCH', '/admin/modules/reorder', {}, { parent_id: woodgate, ordered_ids: [ids[0], ids[0], ids[2], ids[3]] }), 400, 'REORDER_SET_MISMATCH');
    const reversed = [...ids].reverse();
    const out = z.array(CourseModuleRefSchema).parse(await call('PATCH', '/admin/modules/reorder', {}, { parent_id: woodgate, ordered_ids: reversed }));
    assert(out.map((m) => m.id).join() === reversed.join() && out.every((m, i) => m.position === i + 1), 'reordered and renumbered');
    assert((await detail(woodgate)).modules[0].id === reversed[0], 'the detail follows');

    const renamed = CourseModuleRefSchema.parse(await call('PATCH', `/admin/modules/${ids[0]}`, {}, { title: 'Renamed' }));
    assert(renamed.title === 'Renamed', 'rename');

    const blockList = z.array(ContentBlockRefSchema).parse(await call('GET', `/admin/modules/${ids[1]}/blocks`));
    const extra = ContentBlockRefSchema.parse(await call('POST', `/admin/modules/${ids[1]}/blocks`, {}, { type: 'text', payload: { html: '<p>More</p>' } }));
    assert(extra.position === blockList.length + 1, 'appended');
    const edited = ContentBlockRefSchema.parse(await call('PATCH', `/admin/content-blocks/${extra.id}`, {}, { payload: { html: '<p>Edited</p>' } }));
    assert(edited.payload.html === '<p>Edited</p>', 'edit');
    await call('DELETE', `/admin/content-blocks/${extra.id}`);
    assert((await call('GET', `/admin/modules/${ids[1]}/blocks`) as unknown[]).length === blockList.length, 'delete');
    await expectError(() => call('POST', `/admin/modules/${ids[1]}/blocks`, {}, { type: 'hologram', payload: {} }), 400);
    await expectError(() => call('PATCH', '/admin/modules/000000000000000000000000', {}, { title: 'x' }), 404, 'MODULE_NOT_FOUND');
  });

  await add('ADMIN-delete-module-renumbers-and-delete-course-cascades', async () => {
    const d = await detail(created);
    await call('DELETE', `/admin/modules/${d.modules[0].id}`);
    assert((await detail(created)).modules.length === 0, 'module gone');
    await call('DELETE', `/admin/courses/${created}`);
    await expectError(() => call('GET', `/admin/courses/${created}`), 404, 'COURSE_NOT_FOUND');
  });

  /* ---------------- Recruitment authors courses ---------------- */
  await signIn('as-recruitment_member@abode.ng');
  await add('RECRUIT-can-author', async () => {
    const c = CourseSchema.parse(await call('POST', '/admin/courses', {}, { title: 'Recruiting associates', audience: 'realtor' }));
    assert(c.status === 'draft', 'created');
    await call('DELETE', `/admin/courses/${c.id}`);
    assert((await courses()).length === 8, 'and removed again');
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

void main();
