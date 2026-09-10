/* ============================================================
 * Static design-preview data for screen 7 (Learners — across every course).
 * See dummy-data.ts's header — same rules: no backend, read-only.
 *
 * The design itself only ever draws 7 of the 141 associates it cites in the
 * stats/chip counts — this mirrors that exactly rather than inventing 134
 * more rows. Filter chips work against the 7 rows that exist; their count
 * badges show the design's own illustrative totals, same as the mockup.
 *
 * Holds raw credential fields (earned_at / expires_at / revoked_at), not a
 * pre-computed status — see credential-state.ts. The chip "segment" a row
 * falls under is derived from those fields plus activity, not stored either
 * (see deriveSegment in components/learners/GlobalLearners.tsx).
 * ============================================================ */

export type FirstSalePathProgress =
  | { state: "done" }
  | { state: "not_started" }
  | { state: "in_progress"; completed: number; total: number };

export type GlobalLearner = {
  id: string;
  name: string;
  meta: string;
  firstSalePath: FirstSalePathProgress;
  coursesDone: { completed: number; total: number };
  certification: { completed: number; total: number };
  lastActiveDaysAgo: number;
  /** credential.earned_at / expires_at / revoked_at — raw, derive display state from these. */
  earnedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

export const GLOBAL_LEARNERS: GlobalLearner[] = [
  {
    id: "gl1",
    name: "Kemi Adeyemi",
    meta: "Lagos West · Founder · 6 sales",
    firstSalePath: { state: "done" },
    coursesDone: { completed: 4, total: 5 },
    certification: { completed: 5, total: 5 },
    lastActiveDaysAgo: 0,
    earnedAt: "2026-03-02",
    expiresAt: "2027-03-02",
    revokedAt: null,
  },
  {
    id: "gl2",
    name: "Femi Okon",
    meta: "Ikeja · Associate Pro · 5 sales",
    firstSalePath: { state: "done" },
    coursesDone: { completed: 3, total: 5 },
    certification: { completed: 5, total: 5 },
    lastActiveDaysAgo: 6,
    earnedAt: "2025-09-28",
    expiresAt: "2026-09-28",
    revokedAt: null,
  },
  {
    id: "gl3",
    name: "Ngozi Balogun",
    meta: "Lagos West · Associate Pro · 3 sales",
    firstSalePath: { state: "done" },
    coursesDone: { completed: 2, total: 5 },
    certification: { completed: 2, total: 5 },
    lastActiveDaysAgo: 1,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "gl4",
    name: "Chidi Nwosu",
    meta: "Lagos West · Associate Pro · 4 sales",
    firstSalePath: { state: "done" },
    coursesDone: { completed: 2, total: 5 },
    certification: { completed: 3, total: 5 },
    lastActiveDaysAgo: 2,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "gl5",
    name: "Tolu Bakare",
    meta: "Lagos West · Associate · no sales",
    firstSalePath: { state: "in_progress", completed: 2, total: 4 },
    coursesDone: { completed: 0, total: 5 },
    certification: { completed: 0, total: 5 },
    lastActiveDaysAgo: 0,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "gl6",
    name: "Amaka Eze",
    meta: "Lagos West · Associate Pro · no sales",
    firstSalePath: { state: "in_progress", completed: 1, total: 4 },
    coursesDone: { completed: 0, total: 5 },
    certification: { completed: 1, total: 5 },
    lastActiveDaysAgo: 34,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: "gl7",
    name: "Segun Ade",
    meta: "Lagos West · Associate · no sales",
    firstSalePath: { state: "not_started" },
    coursesDone: { completed: 1, total: 5 },
    certification: { completed: 5, total: 5 },
    lastActiveDaysAgo: 122,
    earnedAt: "2025-08-11",
    expiresAt: "2026-08-11",
    revokedAt: null,
  },
];

export const GLOBAL_LEARNER_STATS = {
  associates: 141,
  startedSomething: 112,
  certified: 34,
  lapsingIn30Days: 7,
  neverOpenedCourse: 29,
};

export const GLOBAL_LEARNER_CHIP_COUNTS = {
  all: 141,
  certified: 34,
  lapsing: 7,
  stalled: 18,
  never_started: 29,
};
