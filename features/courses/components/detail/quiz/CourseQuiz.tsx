"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { cn } from "@/lib/utils";

import {
  useCourseQuiz,
  useCreateQuizQuestion,
  useDeleteQuizQuestion,
  useDeleteQuizSettings,
  useGradePreview,
  useLearnerPreview,
  useQuizQuestions,
  useUpdateQuizQuestion,
  useUpdateQuizSettings,
} from "../../../hooks/use-quiz";
import { courseKeys } from "../../../hooks/query-keys";
import type { GradeResult, LearnerQuiz, QuizOption, QuizQuestion } from "../../../schemas/quiz.schema";
import { getErrorMessage } from "../../../utils/error-message";

const ATTEMPT_OPTIONS = ["Unlimited", "1", "2", "3", "5"];
const PASS_MARK_OPTIONS = [50, 60, 70, 80, 90];

function newOption(index: number): QuizOption {
  return { id: `opt-${Date.now()}-${index}`, text: `Option ${index}` };
}

function QuestionEditor({
  question,
  index,
  total,
  onSave,
  onDelete,
  onCancel,
  isSaving,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onSave: (values: { prompt: string; options: QuizOption[]; correct_option_id: string; explanation: string }) => void;
  onDelete: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState(question.options);
  const [correctOptionId, setCorrectOptionId] = useState(question.correct_option_id);
  const [explanation, setExplanation] = useState(question.explanation ?? "");

  return (
    <div className="rounded-lg border border-foreground p-4">
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
          {index + 1}
        </div>
        <span className="flex-1 text-xs whitespace-nowrap text-muted-foreground">
          Question {index + 1} of {total}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Close
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Question</Label>
          <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Options — tap a circle to mark the right one</Label>
          <div className="space-y-1.5">
            {options.map((option) => {
              const isCorrect = option.id === correctOptionId;
              return (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border p-2.5",
                    isCorrect && "border-emerald-300 bg-emerald-50"
                  )}
                >
                  <button
                    type="button"
                    aria-label="Mark as correct"
                    onClick={() => setCorrectOptionId(option.id)}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      isCorrect ? "border-emerald-600 bg-emerald-600" : "border-muted-foreground/40"
                    )}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) =>
                      setOptions((prev) => prev.map((o) => (o.id === option.id ? { ...o, text: e.target.value } : o)))
                    }
                    className="h-8 flex-1 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  {isCorrect ? <Badge className="shrink-0 bg-emerald-600">Correct</Badge> : null}
                  <button
                    type="button"
                    aria-label="Remove option"
                    disabled={options.length <= 2}
                    onClick={() => setOptions((prev) => prev.filter((o) => o.id !== option.id))}
                    className="shrink-0 text-muted-foreground hover:text-red-600 disabled:opacity-30"
                  >
                    ⌫
                  </button>
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={options.length >= 10}
            onClick={() => setOptions((prev) => [...prev, newOption(prev.length + 1)])}
          >
            + Add option
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Why — shown after they answer</Label>
          <Textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            disabled={isSaving || !prompt.trim() || !correctOptionId}
            onClick={() => onSave({ prompt, options, correct_option_id: correctOptionId, explanation })}
          >
            {isSaving ? "Saving…" : "Save question"}
          </Button>
          <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ question, index, onEdit }: { question: QuizQuestion; index: number; onEdit: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3.5 sm:items-center">
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:mt-0" />
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold sm:mt-0">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold sm:truncate">{question.prompt}</p>
        <Badge variant="secondary" className="mt-1.5 shrink-0 sm:hidden">
          {question.options.length} options
        </Badge>
      </div>
      <Badge variant="secondary" className="hidden shrink-0 sm:block">
        {question.options.length} options
      </Badge>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

function LearnerPreviewDialog({ preview, onClose }: { preview: LearnerQuiz; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>What the learner sees</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {preview.question_count} question{preview.question_count === 1 ? "" : "s"} · {preview.pass_mark_pct}% to
          pass ·{" "}
          {preview.max_attempts === null ? "unlimited attempts" : `${preview.max_attempts} attempts`}
        </p>
        <div className="space-y-3">
          {preview.questions.map((q, i) => (
            <div key={q.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">
                {i + 1}. {q.prompt}
              </p>
              <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                {q.options.map((o) => (
                  <li key={o.id}>— {o.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GradePreviewDialog({ result, onClose }: { result: GradeResult; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade preview</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <Badge variant={result.passed ? "default" : "destructive"} className="text-sm">
            {result.score_pct}% — {result.passed ? "Passed" : "Failed"}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {result.correct_count} of {result.total} correct · {result.pass_mark_pct}% to pass
          </p>
        </div>
        <div className="space-y-2">
          {result.results.map((r, i) => (
            <div
              key={r.question_id}
              className={cn(
                "rounded-md border p-2.5 text-sm",
                r.correct ? "border-emerald-300 bg-emerald-50" : "border-red-200 bg-red-50"
              )}
            >
              Question {i + 1}: {r.correct ? "Correct" : "Incorrect"}
              {r.explanation ? <p className="mt-1 text-xs text-muted-foreground">{r.explanation}</p> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CourseQuiz() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const queryClient = useQueryClient();
  const { data: courseQuiz, isLoading: loadingQuiz } = useCourseQuiz(courseId);
  const quizId = courseQuiz?.settings.id ?? "";

  const { data: questions, isLoading: loadingQuestions } = useQuizQuestions(quizId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [previewResult, setPreviewResult] = useState<LearnerQuiz | null>(null);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);

  const createQuestion = useCreateQuizQuestion(quizId);
  const updateQuestion = useUpdateQuizQuestion(quizId);
  const deleteQuestion = useDeleteQuizQuestion(quizId);
  const updateSettings = useUpdateQuizSettings(quizId, courseQuiz?.moduleId ?? "", courseId);
  const deleteQuizSettings = useDeleteQuizSettings(courseQuiz?.moduleId ?? "");
  const learnerPreview = useLearnerPreview(quizId);
  const gradePreview = useGradePreview(quizId);

  if (loadingQuiz) return <PageContentLoader label="Loading quiz…" />;

  if (!courseQuiz) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-semibold">This course has no quiz yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a &quot;Quiz&quot; block from a module&apos;s content editor to create one.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href={`/academy/courses/${courseId}/modules`}>Go to Modules</Link>
        </Button>
      </div>
    );
  }

  const settings = courseQuiz.settings;
  const rows = questions ?? [];
  const attemptsLabel = settings.max_attempts === null ? "unlimited attempts" : `${settings.max_attempts} attempts`;

  const handleTestGrading = () => {
    if (!rows.length) {
      toast.info("Add questions first");
      return;
    }
    const answers = Object.fromEntries(rows.map((q) => [q.id, q.correct_option_id]));
    gradePreview.mutate(answers, {
      onSuccess: (result) => setGradeResult(result),
      onError: (err) => toast.error(getErrorMessage(err, "Couldn't run the grade preview.")),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold wrap-break-word">{courseQuiz.moduleTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} question{rows.length === 1 ? "" : "s"} · {settings.pass_mark_pct}% to pass · {attemptsLabel}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={learnerPreview.isPending}
            onClick={() =>
              learnerPreview.mutate(undefined, {
                onSuccess: (preview) => setPreviewResult(preview),
                onError: (err) => toast.error(getErrorMessage(err, "Couldn't load the learner preview.")),
              })
            }
          >
            {learnerPreview.isPending ? "Loading…" : "Preview as learner"}
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" disabled={gradePreview.isPending} onClick={handleTestGrading}>
            {gradePreview.isPending ? "Grading…" : "Test grading"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 sm:w-auto"
            onClick={() => setDeletingQuiz(true)}
          >
            Delete quiz
          </Button>
        </div>
      </div>

      <AlertDialog open={deletingQuiz} onOpenChange={setDeletingQuiz}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes the quiz and every question in it. Refused while a content block still uses it — remove the
              quiz block from {courseQuiz.moduleTitle} first if this fails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteQuizSettings.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteQuizSettings.isPending}
              onClick={(event) => {
                event.preventDefault();
                deleteQuizSettings.mutate(quizId, {
                  onSuccess: () => {
                    toast.success("Quiz deleted");
                    setDeletingQuiz(false);
                    queryClient.invalidateQueries({ queryKey: courseKeys.courseQuiz(courseId) });
                  },
                  onError: (err) => toast.error(getErrorMessage(err, "Couldn't delete the quiz.")),
                });
              }}
            >
              {deleteQuizSettings.isPending ? "Deleting…" : "Delete quiz"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewResult ? <LearnerPreviewDialog preview={previewResult} onClose={() => setPreviewResult(null)} /> : null}
      {gradeResult ? <GradePreviewDialog result={gradeResult} onClose={() => setGradeResult(null)} /> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-2">
          {loadingQuestions ? (
            <PageContentLoader label="Loading questions…" />
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No quiz questions yet.
            </div>
          ) : (
            rows.map((question, index) =>
              openId === question.id ? (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  total={rows.length}
                  isSaving={updateQuestion.isPending}
                  onSave={(values) =>
                    updateQuestion.mutate(
                      { id: question.id, ...values },
                      {
                        onSuccess: () => {
                          toast.success("Question saved");
                          setOpenId(null);
                        },
                        onError: (err) => toast.error(getErrorMessage(err, "Couldn't save the question.")),
                      }
                    )
                  }
                  onDelete={() =>
                    deleteQuestion.mutate(question.id, {
                      onSuccess: () => {
                        toast.success("Question deleted");
                        setOpenId(null);
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Couldn't delete the question.")),
                    })
                  }
                  onCancel={() => setOpenId(null)}
                />
              ) : (
                <QuestionRow key={question.id} question={question} index={index} onEdit={() => setOpenId(question.id)} />
              )
            )
          )}

          <button
            type="button"
            onClick={() => {
              // `correct_option_id` is required on create (unlike update) — the BE 400s
              // "correct_option_id should not be empty" without a real one, so this
              // defaults to the first option rather than leaving it blank.
              const options = [newOption(1), newOption(2)];
              createQuestion.mutate(
                {
                  quiz_settings_id: quizId,
                  prompt: "New question",
                  options,
                  correct_option_id: options[0].id,
                  explanation: "",
                },
                {
                  onSuccess: (created) => setOpenId(created.id),
                  onError: (err) => toast.error(getErrorMessage(err, "Couldn't add the question.")),
                }
              );
            }}
            disabled={createQuestion.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            + Add a question
          </button>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Quiz settings</h3>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Pass mark</Label>
                <Select
                  value={String(settings.pass_mark_pct)}
                  onValueChange={(value) =>
                    updateSettings.mutate(
                      { pass_mark_pct: Number(value) },
                      { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save pass mark.")) }
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PASS_MARK_OPTIONS.map((pct) => (
                      <SelectItem key={pct} value={String(pct)}>
                        {pct}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Attempts</Label>
                <Select
                  value={settings.max_attempts === null ? "Unlimited" : String(settings.max_attempts)}
                  onValueChange={(value) =>
                    updateSettings.mutate(
                      { max_attempts: value === "Unlimited" ? null : Number(value) },
                      { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save attempts.")) }
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTEMPT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Cooldown between attempts (minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={settings.cooldown_minutes}
                  onBlur={(e) => {
                    const value = Math.max(0, e.target.valueAsNumber || 0);
                    if (value !== settings.cooldown_minutes) {
                      updateSettings.mutate(
                        { cooldown_minutes: value },
                        { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save cooldown.")) }
                      );
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2 border-t pt-3.5">
                <Checkbox
                  id="shuffle-questions"
                  checked={settings.shuffle_questions}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate(
                      { shuffle_questions: Boolean(checked) },
                      { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save shuffle setting.")) }
                    )
                  }
                />
                <Label htmlFor="shuffle-questions" className="text-sm font-semibold">
                  Shuffle questions
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="shuffle-options"
                  checked={settings.shuffle_options}
                  onCheckedChange={(checked) =>
                    updateSettings.mutate(
                      { shuffle_options: Boolean(checked) },
                      { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save shuffle setting.")) }
                    )
                  }
                />
                <Label htmlFor="shuffle-options" className="text-sm font-semibold">
                  Shuffle options within each question
                </Label>
              </div>
            </div>
          </section>

          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">How it grades</h3>
            </div>
            <div className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Correct answers stay on the server (`correct_option_id` is only returned to admins here, never to a
                learner — &quot;Preview as learner&quot; above shows exactly what they get). Grading happens server-side;
                &quot;Test grading&quot; runs the real grader without recording an attempt.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
