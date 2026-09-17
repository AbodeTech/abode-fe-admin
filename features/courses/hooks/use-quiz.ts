'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';

import { CourseModuleRefSchema } from '../schemas/course.schema';
import {
  GradeResultSchema,
  LearnerQuizSchema,
  QuizQuestionSchema,
  QuizSettingsSchema,
  type QuizOption,
  type QuizSettings,
} from '../schemas/quiz.schema';
import { courseKeys } from './query-keys';

export type CourseQuizInfo = { moduleId: string; moduleTitle: string; settings: QuizSettings };

/**
 * The real data model ties a quiz to a *module* (`QuizSettings.module_id`),
 * not to a course — there's no direct course→quiz endpoint. This scans the
 * course's modules for the first one with a quiz, for the course-level Quiz
 * tab. A course could in principle have more than one quiz-carrying module;
 * the tab only surfaces the first.
 */
export const useCourseQuiz = (courseId: string) =>
  useQuery({
    queryKey: courseKeys.courseQuiz(courseId),
    queryFn: async (): Promise<CourseQuizInfo | null> => {
      const modules = await apiGet(`/admin/courses/${courseId}/modules`, z.array(CourseModuleRefSchema));
      for (const mod of modules) {
        const settingsList = await apiGet(`/admin/modules/${mod.id}/quiz-settings`, z.array(QuizSettingsSchema));
        if (settingsList.length > 0) {
          return { moduleId: mod.id, moduleTitle: mod.title, settings: settingsList[0] };
        }
      }
      return null;
    },
    enabled: Boolean(courseId),
  });

/** `GET /admin/modules/:id/quiz-settings` — a module can in principle have more than one; the UI treats the first as *the* quiz. */
export const useModuleQuizzes = (moduleId: string) =>
  useQuery({
    queryKey: courseKeys.quizForModule(moduleId),
    queryFn: () => apiGet(`/admin/modules/${moduleId}/quiz-settings`, z.array(QuizSettingsSchema)),
    enabled: Boolean(moduleId),
  });

export const useQuizSettings = (id: string) =>
  useQuery({
    queryKey: courseKeys.quizSettings(id),
    queryFn: () => apiGet(`/admin/quiz-settings/${id}`, QuizSettingsSchema),
    enabled: Boolean(id),
  });

export type CreateQuizSettingsPayload = {
  module_id: string;
  pass_mark_pct?: number;
  max_attempts?: number | null;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  cooldown_minutes?: number;
};

export const useCreateQuizSettings = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuizSettingsPayload) => apiPost('/admin/quiz-settings', dto, QuizSettingsSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizForModule(moduleId) });
    },
  });
};

export type UpdateQuizSettingsPayload = Partial<
  Omit<CreateQuizSettingsPayload, 'module_id'>
>;

/**
 * `courseId` is only here so this hook can patch `useCourseQuiz`'s cache —
 * the screen that actually renders these settings reads `courseKeys.courseQuiz(courseId)`,
 * not `courseKeys.quizSettings(id)`. An earlier version only touched the
 * latter (plus `quizForModule`), so toggling shuffle/pass-mark/etc. never
 * invalidated the query the checkbox was bound to — the visible "lag" was
 * really a UI that never got told to update, only self-correcting whenever
 * something else happened to refetch it. Optimistic update here makes the
 * toggle instant and correct either way.
 */
export const useUpdateQuizSettings = (id: string, moduleId: string, courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateQuizSettingsPayload) => apiPatch(`/admin/quiz-settings/${id}`, dto, QuizSettingsSchema),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.courseQuiz(courseId) });
      const previous = queryClient.getQueryData<CourseQuizInfo | null>(courseKeys.courseQuiz(courseId));
      if (previous) {
        queryClient.setQueryData(courseKeys.courseQuiz(courseId), {
          ...previous,
          settings: { ...previous.settings, ...dto },
        });
      }
      return { previous };
    },
    onError: (_err, _dto, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(courseKeys.courseQuiz(courseId), context.previous);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(courseKeys.quizSettings(id), updated);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizForModule(moduleId) });
      queryClient.invalidateQueries({ queryKey: courseKeys.courseQuiz(courseId) });
    },
  });
};

const DeleteResponseSchema = z.looseObject({});

/** BE 400s `QUIZ_IN_USE` if a content block still references this quiz. */
export const useDeleteQuizSettings = (moduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/quiz-settings/${id}`, DeleteResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizForModule(moduleId) });
    },
  });
};

/** `GET /admin/quiz-questions?quiz_settings_id=` — includes the answer key (admin-only route). */
export const useQuizQuestions = (quizSettingsId: string) =>
  useQuery({
    queryKey: courseKeys.quizQuestions(quizSettingsId),
    queryFn: () =>
      apiGet('/admin/quiz-questions', z.array(QuizQuestionSchema), {
        params: { quiz_settings_id: quizSettingsId },
      }),
    enabled: Boolean(quizSettingsId),
  });

export type QuizQuestionPayload = {
  quiz_settings_id: string;
  prompt: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string;
};

export const useCreateQuizQuestion = (quizSettingsId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: QuizQuestionPayload) => apiPost('/admin/quiz-questions', dto, QuizQuestionSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizQuestions(quizSettingsId) });
    },
  });
};

export type UpdateQuizQuestionPayload = Partial<Omit<QuizQuestionPayload, 'quiz_settings_id'>>;

export const useUpdateQuizQuestion = (quizSettingsId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: UpdateQuizQuestionPayload & { id: string }) =>
      apiPatch(`/admin/quiz-questions/${id}`, dto, QuizQuestionSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizQuestions(quizSettingsId) });
    },
  });
};

export const useDeleteQuizQuestion = (quizSettingsId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/quiz-questions/${id}`, DeleteResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.quizQuestions(quizSettingsId) });
    },
  });
};

/** `GET /admin/quiz-settings/:id/learner-preview` — exactly what a learner receives, no answer key. */
export const useLearnerPreview = (quizSettingsId: string) =>
  useMutation({
    mutationFn: () => apiGet(`/admin/quiz-settings/${quizSettingsId}/learner-preview`, LearnerQuizSchema),
  });

/** `POST /admin/quiz-settings/:id/grade-preview` — runs the real grader on sample answers, records nothing. */
export const useGradePreview = (quizSettingsId: string) =>
  useMutation({
    mutationFn: (answers: Record<string, string>) =>
      apiPost(`/admin/quiz-settings/${quizSettingsId}/grade-preview`, { answers }, GradeResultSchema),
  });
