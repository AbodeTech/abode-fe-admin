/* ============================================================
 * Static design-preview data for screens 3–4 (Modules, Module editor).
 * See dummy-data.ts's header — same rules: no backend, edits are local only.
 *
 * Mirrors the data contract's `course_module` / content-block shapes,
 * including the two fields the first pass skipped:
 *  - duration_is_override: real field on CourseModule, editable in
 *    ModuleEditor rather than the read-only "Auto" badge it was.
 *  - publishable (derived): computed by `isModulePublishable`, never stored
 *    — false while any video block in the module is still processing.
 * ============================================================ */

export type ModuleTag = 'Text' | 'Video' | 'Quiz';

export type ContentBlock =
  | { id: string; type: 'heading'; text: string }
  | { id: string; type: 'text'; text: string }
  | { id: string; type: 'callout'; title: string; body: string }
  | { id: string; type: 'image'; url: string; caption: string | null }
  | { id: string; type: 'file'; filename: string; sizeLabel: string; url: string }
  | { id: string; type: 'quote'; text: string; attribution: string | null }
  | {
      id: string;
      type: 'video';
      status: 'ready';
      filename: string;
      sizeLabel: string;
      uploadedLabel: string;
      durationLabel: string;
      durationSeconds: number;
      caption: string;
    }
  | {
      id: string;
      type: 'video';
      status: 'processing';
      filename: string;
      sizeLabel: string;
      uploadedLabel: string;
      progressPct: number;
      etaLabel: string;
    }
  | {
      id: string;
      type: 'video';
      status: 'failed';
      filename: string;
      sizeLabel: string;
      uploadedLabel: string;
      errorMessage: string;
    }
  | {
      id: string;
      type: 'video';
      status: 'external';
      provider: 'youtube' | 'vimeo';
      url: string;
      caption: string;
    }
  | { id: string; type: 'video'; status: 'empty' };

export type CourseModule = {
  id: string;
  courseId: string;
  position: number;
  title: string;
  description: string;
  kind: 'lesson' | 'quiz';
  tags: ModuleTag[];
  /** Auto-computed baseline (words + video duration). Shown when durationIsOverride is off. */
  durationMinutes: number;
  /** When true, durationMinutes was typed in by an admin rather than computed. */
  durationIsOverride: boolean;
  countsTowardCompletion: boolean;
  blocks: ContentBlock[];
};

/** Derived — never stored. False while any video block in the module is still processing or failed. */
export function isModulePublishable(mod: CourseModule): boolean {
  return !mod.blocks.some(
    (block) => block.type === 'video' && (block.status === 'processing' || block.status === 'failed')
  );
}

const WOODGATE_PRIME_ID = '66cc0a0000000000000001';

const WOODGATE_MODULES: CourseModule[] = [
  {
    id: 'mod-wg-1',
    courseId: WOODGATE_PRIME_ID,
    position: 1,
    title: 'What Woodgate Prime is',
    description: 'Where it is, who it suits, what is already built',
    kind: 'lesson',
    tags: ['Text'],
    durationMinutes: 6,
    durationIsOverride: false,
    countsTowardCompletion: true,
    blocks: [
      { id: 'b1', type: 'heading', text: 'Where Woodgate Prime is, and who it suits' },
      {
        id: 'b2',
        type: 'text',
        text: 'Woodgate Prime sits along the Lekki–Epe corridor, twenty minutes past the toll gate. It suits a first-time land buyer who wants proximity to Lagos without the Ibeju-Lekki price tag — perimeter fencing, road network and drainage are already in.',
      },
      {
        id: 'b3',
        type: 'quote',
        text: 'Ask about Woodgate before you ask about anywhere else — the road alone tells you they built this to be lived on, not just sold.',
        attribution: 'Bunmi Alade, Allocation Lead',
      },
      {
        id: 'b4',
        type: 'video',
        status: 'failed',
        filename: 'drone-flyover.mp4',
        sizeLabel: '310 MB',
        uploadedLabel: 'uploaded 6 Sept by Martha Oke',
        errorMessage: 'Transcoding failed — the file may be corrupted. Remove it and try uploading again.',
      },
    ],
  },
  {
    id: 'mod-wg-2',
    courseId: WOODGATE_PRIME_ID,
    position: 2,
    title: 'The plan and the price',
    description: '₦19,000 a month, 36 payments, what the client ends up owning',
    kind: 'lesson',
    tags: ['Text', 'Video'],
    durationMinutes: 9,
    durationIsOverride: false,
    countsTowardCompletion: true,
    blocks: [
      { id: 'b1', type: 'heading', text: 'The plan and the price' },
      {
        id: 'b2',
        type: 'text',
        text: 'The standard plan is ₦19,000 a month for 36 months — {{total}} in total. A client owns a place in the queue and a contract from payment one; a specific, numbered plot is what allocation assigns later.',
      },
      {
        id: 'b3',
        type: 'video',
        status: 'ready',
        filename: 'the-plan-explained.mp4',
        sizeLabel: '86 MB · 1080p',
        uploadedLabel: 'uploaded 28 Aug by Martha Oke',
        durationLabel: '3:40',
        durationSeconds: 220,
        caption: 'Walking through the payment schedule on a real plot',
      },
      {
        id: 'b4',
        type: 'image',
        url: '/images/courses/woodgate-site-plan.jpg',
        caption: 'The estate layout, block C highlighted',
      },
      {
        id: 'b5',
        type: 'file',
        filename: 'woodgate-prime-brochure.pdf',
        sizeLabel: '2.4 MB',
        url: '/files/courses/woodgate-prime-brochure.pdf',
      },
      {
        id: 'b6',
        type: 'video',
        status: 'external',
        provider: 'youtube',
        url: 'https://youtu.be/woodgate-site-tour',
        caption: "A resident's walk-through of the finished road network",
      },
    ],
  },
  {
    id: 'mod-wg-3',
    courseId: WOODGATE_PRIME_ID,
    position: 3,
    title: 'Title and allocation',
    description: 'Excision, survey, and the ₦205,200 allocation threshold',
    kind: 'lesson',
    tags: ['Text', 'Video'],
    durationMinutes: 12,
    durationIsOverride: false,
    countsTowardCompletion: true,
    blocks: [
      { id: 'b1', type: 'heading', text: 'What allocation actually means' },
      {
        id: 'b2',
        type: 'text',
        text: "Allocation is the moment a specific plot on the estate layout gets tied to your client's name. Until then they own a place in the queue and a contract, not a numbered plot. Say that plainly — the clients who feel misled are the ones who thought they already had a plot number.",
      },
      {
        id: 'b3',
        type: 'video',
        status: 'ready',
        filename: 'allocation-explained.mp4',
        sizeLabel: '124 MB · 1080p',
        uploadedLabel: 'uploaded 4 Sept by Martha Oke',
        durationLabel: '4:12',
        durationSeconds: 252,
        caption: 'Bunmi from the allocation team walks through one real assignment',
      },
      {
        id: 'b4',
        type: 'video',
        status: 'processing',
        filename: 'site-walk-blocks-c-d.mov',
        sizeLabel: '418 MB',
        uploadedLabel: 'uploaded 2 minutes ago · transcoding 720p',
        progressPct: 64,
        etaLabel: 'about 3 minutes left',
      },
      { id: 'b5', type: 'video', status: 'empty' },
      {
        id: 'b6',
        type: 'callout',
        title: 'The number to remember',
        body: 'Allocation at Woodgate Prime unlocks at ₦205,200 paid — about payment 11 of 36. Triggered by the amount paid, not by elapsed time, so a client who pays ahead gets allocated sooner.',
      },
    ],
  },
  {
    id: 'mod-wg-4',
    courseId: WOODGATE_PRIME_ID,
    position: 4,
    title: 'Check what you know',
    description: 'Ten questions · 70% to pass · open book',
    kind: 'quiz',
    tags: ['Quiz'],
    durationMinutes: 8,
    durationIsOverride: false,
    countsTowardCompletion: true,
    blocks: [],
  },
];

/** The quiz-kind module quiz_question/quiz_settings hang off — see dummy-quiz.ts. */
export const WOODGATE_QUIZ_MODULE_ID = WOODGATE_MODULES.find((m) => m.kind === 'quiz')!.id;

/** Everything but Woodgate Prime gets generic placeholder modules, sized to course.modules_count. */
function genericModules(courseId: string, count: number): CourseModule[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `mod-${courseId}-${index + 1}`,
    courseId,
    position: index + 1,
    title: `Module ${index + 1}`,
    description: 'No content added yet',
    kind: 'lesson',
    tags: ['Text'],
    durationMinutes: 5,
    durationIsOverride: false,
    countsTowardCompletion: true,
    blocks: [
      { id: 'b1', type: 'heading', text: `Module ${index + 1}` },
      { id: 'b2', type: 'text', text: 'Nothing written yet.' },
    ],
  }));
}

export function getModulesForCourse(courseId: string, fallbackCount: number): CourseModule[] {
  if (courseId === WOODGATE_PRIME_ID) return WOODGATE_MODULES;
  return genericModules(courseId, fallbackCount);
}

/** The course's sole quiz-kind module, if it has one — quiz content hangs off this module's id. */
export function getQuizModuleForCourse(courseId: string, fallbackCount: number): CourseModule | undefined {
  return getModulesForCourse(courseId, fallbackCount).find((m) => m.kind === 'quiz');
}

export function moduleStats(modules: CourseModule[]) {
  const lessons = modules.filter((m) => m.kind === 'lesson').length;
  const quizzes = modules.filter((m) => m.kind === 'quiz').length;
  const readyVideos = modules.flatMap((m) =>
    m.blocks.filter((b): b is Extract<ContentBlock, { type: 'video'; status: 'ready' }> =>
      b.type === 'video' && b.status === 'ready'
    )
  );
  const videoSeconds = readyVideos.reduce((total, v) => total + v.durationSeconds, 0);
  const totalMinutes = modules.reduce((total, m) => total + m.durationMinutes, 0);

  return {
    lessons,
    quizzes,
    videoClips: readyVideos.length,
    videoMinutes: Math.floor(videoSeconds / 60),
    totalMinutes,
  };
}
