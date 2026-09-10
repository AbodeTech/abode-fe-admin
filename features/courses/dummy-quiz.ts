/* ============================================================
 * Static design-preview data for screen 5 (Quiz).
 * See dummy-data.ts's header — same rules: no backend, edits are local only.
 *
 * quiz_question / quiz_settings hang off a module_id in the data contract —
 * the quiz-kind course_module, not the course directly. WOODGATE_QUIZ_MODULE_ID
 * (from dummy-modules.ts, "Check what you know") is that module, so this
 * file's fixtures are keyed by it rather than by courseId — callers resolve
 * the module first via getQuizModuleForCourse, then fetch by its id.
 * ============================================================ */

import { WOODGATE_QUIZ_MODULE_ID } from './dummy-modules';

export type QuizOption = { id: string; text: string };

export type QuizQuestion = {
  id: string;
  moduleId: string;
  position: number;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  /** Shown after an answer is submitted, never before — see credential.schema note on the BE. */
  explanation: string;
  mostMissed?: boolean;
};

export type QuizSettings = {
  moduleId: string;
  passMarkPct: number;
  /** null = unlimited */
  maxAttempts: number | null;
  shuffle: boolean;
  showExplanationInline: boolean;
};

export type QuizStats = {
  averageScorePct: number;
  passRateFirstAttemptPct: number;
  mostMissedPosition: number;
};

const WOODGATE_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 1,
    prompt: 'What is the monthly payment on a 150sqm plot?',
    options: [
      { id: 'a', text: '₦15,000' },
      { id: 'b', text: '₦19,000' },
      { id: 'c', text: '₦25,000' },
      { id: 'd', text: '₦30,000' },
    ],
    correctOptionId: 'b',
    explanation: 'The standard plan on a 150sqm plot runs ₦19,000 a month across 36 payments.',
  },
  {
    id: 'q2',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 2,
    prompt: 'How many payments does the standard plan run for?',
    options: [
      { id: 'a', text: '12' },
      { id: 'b', text: '24' },
      { id: 'c', text: '36' },
      { id: 'd', text: '48' },
    ],
    correctOptionId: 'c',
    explanation: 'Thirty-six monthly payments — three years — is the standard plan.',
  },
  {
    id: 'q3',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 3,
    prompt: "When does a client's plot get allocated at Woodgate Prime?",
    options: [
      { id: 'a', text: 'After twelve months of payments' },
      { id: 'b', text: 'When they have paid ₦205,200' },
      { id: 'c', text: 'On the date written in the contract' },
      { id: 'd', text: 'When the estate is fully sold' },
    ],
    correctOptionId: 'b',
    explanation:
      "Allocation is triggered by the amount paid, not by time. That is why paying ahead brings a client's allocation forward, and it is the most useful thing you can tell someone who is impatient.",
  },
  {
    id: 'q4',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 4,
    prompt: 'Which title does Woodgate Prime hold today?',
    options: [
      { id: 'a', text: 'Governor’s Consent' },
      { id: 'b', text: 'Excision, survey in progress' },
      { id: 'c', text: 'Certificate of Occupancy' },
      { id: 'd', text: 'No title yet' },
    ],
    correctOptionId: 'b',
    explanation: 'Woodgate Prime has an excision; the survey that precedes a C of O application is in progress.',
  },
  {
    id: 'q5',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 5,
    prompt: 'A client asks when the C of O will be issued. What do you say?',
    options: [
      { id: 'a', text: 'A firm date, to reassure them' },
      { id: 'b', text: "That it's already issued" },
      { id: 'c', text: 'That title work is in progress and there is no fixed date yet' },
      { id: 'd', text: "That it's not the company's responsibility" },
    ],
    correctOptionId: 'c',
    explanation:
      "Never commit to a date the title team hasn't confirmed. Say honestly that the work is in progress — a wrong promise here is the most common source of a later dispute.",
    mostMissed: true,
  },
  {
    id: 'q6',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 6,
    prompt: 'What happens to a client who stops paying for three months?',
    options: [
      { id: 'a', text: 'The plot is repossessed immediately' },
      { id: 'b', text: 'The plan is flagged for follow-up by customer success' },
      { id: 'c', text: 'Nothing — payments are optional' },
      { id: 'd', text: 'They are automatically refunded' },
    ],
    correctOptionId: 'b',
    explanation: 'A defaulting plan is flagged for customer success follow-up, not repossessed outright.',
  },
  {
    id: 'q7',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 7,
    prompt: 'What amenities does Woodgate Prime already have in place?',
    options: [
      { id: 'a', text: 'Nothing yet — it is raw land' },
      { id: 'b', text: 'Perimeter fencing, road network, drainage, security post' },
      { id: 'c', text: 'A completed estate with buildings' },
      { id: 'd', text: 'Only a perimeter fence' },
    ],
    correctOptionId: 'b',
    explanation: 'Fencing, road network, drainage and a security post are already built.',
  },
  {
    id: 'q8',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 8,
    prompt: "Can a client pay off Woodgate Prime early?",
    options: [
      { id: 'a', text: 'No, the schedule is fixed' },
      { id: 'b', text: 'Yes, and it brings their allocation forward' },
      { id: 'c', text: 'Yes, but it delays allocation' },
      { id: 'd', text: 'Only after month 12' },
    ],
    correctOptionId: 'b',
    explanation: 'Since allocation is amount-triggered, paying ahead of schedule moves allocation forward, never back.',
  },
  {
    id: 'q9',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 9,
    prompt: 'Where is Woodgate Prime located?',
    options: [
      { id: 'a', text: 'Ibeju-Lekki, Lagos' },
      { id: 'b', text: 'Along the Lekki–Epe corridor, past the toll gate' },
      { id: 'c', text: 'Abeokuta, Ogun' },
      { id: 'd', text: 'Ikorodu, Lagos' },
    ],
    correctOptionId: 'b',
    explanation: 'Twenty minutes past the Lekki-Epe toll gate.',
  },
  {
    id: 'q10',
    moduleId: WOODGATE_QUIZ_MODULE_ID,
    position: 10,
    prompt: 'A client wants a document fee waiver. What do you tell them?',
    options: [
      { id: 'a', text: 'Waivers are decided by the associate, on the spot' },
      { id: 'b', text: 'There is no such fee on this plan' },
      { id: 'c', text: 'That request goes to customer success, not the associate' },
      { id: 'd', text: 'Waivers are automatic after 12 months' },
    ],
    correctOptionId: 'c',
    explanation: 'Fee waivers are a customer success decision — an associate promising one on the spot is a common source of disputes.',
  },
];

const WOODGATE_QUIZ_SETTINGS: QuizSettings = {
  moduleId: WOODGATE_QUIZ_MODULE_ID,
  passMarkPct: 70,
  maxAttempts: null,
  shuffle: true,
  showExplanationInline: true,
};

const WOODGATE_QUIZ_STATS: QuizStats = {
  averageScorePct: 81,
  passRateFirstAttemptPct: 64,
  mostMissedPosition: 5,
};

export function getQuizForModule(moduleId: string): QuizQuestion[] {
  if (moduleId === WOODGATE_QUIZ_MODULE_ID) return WOODGATE_QUIZ;
  return [];
}

export function getQuizSettingsForModule(moduleId: string): QuizSettings {
  if (moduleId === WOODGATE_QUIZ_MODULE_ID) return WOODGATE_QUIZ_SETTINGS;
  return { moduleId, passMarkPct: 70, maxAttempts: null, shuffle: false, showExplanationInline: false };
}

export function getQuizStatsForModule(moduleId: string): QuizStats | null {
  if (moduleId === WOODGATE_QUIZ_MODULE_ID) return WOODGATE_QUIZ_STATS;
  return null;
}
