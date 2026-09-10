/* ============================================================
 * Static design-preview data for screen 6 (Course · Learners).
 * See dummy-data.ts's header — same rules: no backend, edits are local only.
 *
 * Holds raw enrolment/credential fields (earned_at, expires_at, revoked_at)
 * rather than a pre-computed status — credential.state is derived, never
 * stored (see credential-state.ts). `engagement` is a separate, genuinely
 * stored concept: whether the person is actively working through the
 * course, which isn't something the credential fields can tell you.
 * ============================================================ */

export type Engagement = 'in_progress' | 'stalled';

export type CourseLearner = {
  id: string;
  name: string;
  meta: string;
  modulesCompleted: number;
  modulesTotal: number;
  quizScorePct: number | null;
  engagement: Engagement;
  lastActiveDaysAgo: number;
  /** credential.earned_at / expires_at / revoked_at — raw, derive display state from these. */
  earnedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type CourseLearnerStats = {
  started: number;
  completed: number;
  inProgress: number;
  expiringIn30Days: number;
  expired: number;
};

const CERTIFICATION_ID = '66cc0a0000000000000002';

const CERT_LEARNERS: CourseLearner[] = [
  {
    id: 'l1',
    name: 'Kemi Adeyemi',
    meta: 'Lagos West · Founder',
    modulesCompleted: 5,
    modulesTotal: 5,
    quizScorePct: 92,
    engagement: 'in_progress',
    lastActiveDaysAgo: 0,
    earnedAt: '2026-03-02',
    expiresAt: '2027-03-02',
    revokedAt: null,
  },
  {
    id: 'l2',
    name: 'Femi Okon',
    meta: 'Ikeja · Associate Pro',
    modulesCompleted: 5,
    modulesTotal: 5,
    quizScorePct: 78,
    engagement: 'in_progress',
    lastActiveDaysAgo: 6,
    earnedAt: '2025-09-28',
    expiresAt: '2026-09-28',
    revokedAt: null,
  },
  {
    id: 'l3',
    name: 'Chidi Nwosu',
    meta: 'Lagos West · Associate Pro',
    modulesCompleted: 3,
    modulesTotal: 5,
    quizScorePct: null,
    engagement: 'in_progress',
    lastActiveDaysAgo: 2,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: 'l4',
    name: 'Ngozi Balogun',
    meta: 'Lagos West · Associate Pro',
    modulesCompleted: 2,
    modulesTotal: 5,
    quizScorePct: null,
    engagement: 'in_progress',
    lastActiveDaysAgo: 1,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: 'l5',
    name: 'Amaka Eze',
    meta: 'Lagos West · Associate Pro',
    modulesCompleted: 1,
    modulesTotal: 5,
    quizScorePct: null,
    engagement: 'stalled',
    lastActiveDaysAgo: 34,
    earnedAt: null,
    expiresAt: null,
    revokedAt: null,
  },
  {
    id: 'l6',
    name: 'Segun Ade',
    meta: 'Lagos West · Associate',
    modulesCompleted: 5,
    modulesTotal: 5,
    quizScorePct: 71,
    engagement: 'stalled',
    lastActiveDaysAgo: 122,
    earnedAt: '2025-08-11',
    expiresAt: '2026-08-11',
    revokedAt: null,
  },
];

const CERT_STATS: CourseLearnerStats = {
  started: 96,
  completed: 34,
  inProgress: 62,
  expiringIn30Days: 7,
  expired: 3,
};

const NAME_POOL: [string, string][] = [
  ['Kemi Adeyemi', 'Lagos West · Founder'],
  ['Femi Okon', 'Ikeja · Associate Pro'],
  ['Chidi Nwosu', 'Lagos West · Associate Pro'],
  ['Ngozi Balogun', 'Lagos West · Associate Pro'],
  ['Amaka Eze', 'Lagos West · Associate Pro'],
  ['Segun Ade', 'Lagos West · Associate'],
  ['Tolu Bakare', 'Lagos West · Associate'],
];

/** Courses without a dedicated fixture get a small synthesized roster, sized to the course's own counts. */
function genericLearners(learnersCount: number, completedCount: number, modulesTotal: number): CourseLearner[] {
  const rows = Math.min(learnersCount, NAME_POOL.length);
  return Array.from({ length: rows }, (_, index) => {
    const [name, meta] = NAME_POOL[index];
    const isCompleted = index < completedCount;
    const modulesCompleted = isCompleted ? modulesTotal : Math.max(1, modulesTotal - 1 - index);
    return {
      id: `gen-${index}`,
      name,
      meta,
      modulesCompleted,
      modulesTotal,
      quizScorePct: isCompleted ? 70 + ((index * 7) % 25) : null,
      engagement: (index % 3 === 0 && !isCompleted ? 'stalled' : 'in_progress') as Engagement,
      lastActiveDaysAgo: index,
      earnedAt: isCompleted ? '2026-08-14' : null,
      expiresAt: isCompleted ? '2027-08-14' : null,
      revokedAt: null,
    };
  });
}

export function getLearnersForCourse(
  courseId: string,
  learnersCount: number,
  completedCount: number,
  modulesTotal: number
): CourseLearner[] {
  if (courseId === CERTIFICATION_ID) return CERT_LEARNERS;
  return genericLearners(learnersCount, completedCount, modulesTotal);
}

export function getLearnerStatsForCourse(
  courseId: string,
  learnersCount: number,
  completedCount: number
): CourseLearnerStats {
  if (courseId === CERTIFICATION_ID) return CERT_STATS;
  return {
    started: learnersCount,
    completed: completedCount,
    inProgress: Math.max(0, learnersCount - completedCount),
    expiringIn30Days: 0,
    expired: 0,
  };
}
