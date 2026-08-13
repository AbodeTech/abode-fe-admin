import type { MockRoutes } from '../router';
import { PEOPLE, matchesPersonSearch, publicPerson } from './people';
import { paged } from './util';

/* ============================================================
 * Admin users — only what the shared UserPicker needs today.
 *
 * `GET /admin/users` was a stub on the BE until 2026-08-13 (ticket 2) and is now
 * wired to `AdminService.listUsers`. This mocks the lookup the picker performs:
 * `?search=` matched against name, email and username, and `?limit=`.
 *
 * The users feature owns this path — when it migrates it should extend this
 * table (detail, suspend, unsuspend, edit) rather than re-registering the route,
 * which the mock router refuses as a duplicate.
 * ============================================================ */

export const userRoutes: MockRoutes = {
  'GET /admin/users': ({ query }) => {
    const search = typeof query.search === 'string' ? query.search : '';
    const matched = PEOPLE.filter((person) => matchesPersonSearch(person, search));

    return paged(matched.map(publicPerson), query);
  },
};
