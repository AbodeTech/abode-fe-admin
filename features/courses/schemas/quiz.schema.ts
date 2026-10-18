import { z } from 'zod';

/* ============================================================
 * Quiz — authoring + preview/grading for a module's quiz.
 * ✅ real — `QuizAdminController` (staging `7fefe13`): confirmed against
 * `QuizAdminService`/`quiz-question.schema.ts`/`quiz-settings.schema.ts`.
 *
 * `correct_option_id` is `select: false` on the BE schema for the learner
 * path but IS returned to admins (`listQuestions`/`shapeQuestion` always
 * include it — `QuizAdminController`'s own doc comment says "including the
 * answer key"). `learner-preview` is the one read that strips it, via a
 * separate serializer (`toLearnerQuiz`).
 * ============================================================ */

export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizSettingsSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  pass_mark_pct: z.number(),
  max_attempts: z.number().nullable(),
  shuffle_questions: z.boolean(),
  shuffle_options: z.boolean(),
  cooldown_minutes: z.number(),
  question_count: z.number(),
});
export type QuizSettings = z.infer<typeof QuizSettingsSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  quiz_settings_id: z.string(),
  prompt: z.string(),
  options: z.array(QuizOptionSchema),
  correct_option_id: z.string(),
  explanation: z.string().nullable(),
  position: z.number(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/** `GET /quiz-settings/:id/learner-preview` — the no-answer-key payload a learner gets. */
export const LearnerQuizSchema = z.object({
  quiz_settings_id: z.string(),
  pass_mark_pct: z.number(),
  max_attempts: z.number().nullable(),
  cooldown_minutes: z.number(),
  question_count: z.number(),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      options: z.array(QuizOptionSchema),
    })
  ),
});
export type LearnerQuiz = z.infer<typeof LearnerQuizSchema>;

/** `POST /quiz-settings/:id/grade-preview` — runs the real grader, records nothing. */
export const GradeResultSchema = z.object({
  total: z.number(),
  correct_count: z.number(),
  score_pct: z.number(),
  pass_mark_pct: z.number(),
  passed: z.boolean(),
  results: z.array(
    z.object({
      question_id: z.string(),
      selected_option_id: z.string().nullable(),
      correct_option_id: z.string(),
      correct: z.boolean(),
      explanation: z.string().nullable(),
    })
  ),
});
export type GradeResult = z.infer<typeof GradeResultSchema>;
