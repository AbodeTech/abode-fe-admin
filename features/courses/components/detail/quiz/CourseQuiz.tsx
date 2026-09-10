"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { DUMMY_COURSES } from "../../../dummy-data";
import { getQuizModuleForCourse } from "../../../dummy-modules";
import {
  getQuizForModule,
  getQuizSettingsForModule,
  getQuizStatsForModule,
  type QuizQuestion,
} from "../../../dummy-quiz";

const ATTEMPT_OPTIONS = ["Unlimited", "1", "2", "3", "5"];
const PASS_MARK_OPTIONS = [50, 60, 70, 80, 90];

let nextOptionId = 1;
let nextQuestionId = 1;

function QuestionEditor({
  question,
  index,
  total,
  onChange,
  onDuplicate,
  onDelete,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onChange: (next: QuizQuestion) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
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
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
            Duplicate
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
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Question</Label>
          <Input
            value={question.prompt}
            onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Options — tap a circle to mark the right one</Label>
          <div className="space-y-1.5">
            {question.options.map((option) => {
              const isCorrect = option.id === question.correctOptionId;
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
                    onClick={() => onChange({ ...question, correctOptionId: option.id })}
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      isCorrect ? "border-emerald-600 bg-emerald-600" : "border-muted-foreground/40"
                    )}
                  />
                  <Input
                    value={option.text}
                    onChange={(e) =>
                      onChange({
                        ...question,
                        options: question.options.map((o) =>
                          o.id === option.id ? { ...o, text: e.target.value } : o
                        ),
                      })
                    }
                    className="h-8 flex-1 border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                  {isCorrect ? <Badge className="shrink-0 bg-emerald-600">Correct</Badge> : null}
                  <button
                    type="button"
                    aria-label="Remove option"
                    disabled={question.options.length <= 2}
                    onClick={() =>
                      onChange({ ...question, options: question.options.filter((o) => o.id !== option.id) })
                    }
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
            onClick={() =>
              onChange({
                ...question,
                options: [...question.options, { id: `new-${nextOptionId++}`, text: "New option" }],
              })
            }
          >
            + Add option
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Why — shown after they answer</Label>
          <Textarea
            rows={3}
            value={question.explanation}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  index,
  onEdit,
}: {
  question: QuizQuestion;
  index: number;
  onEdit: () => void;
}) {
  const tags = (
    <>
      <Badge variant="secondary" className="shrink-0">
        {question.options.length} options
      </Badge>
      {question.mostMissed ? (
        <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700">
          Most missed
        </Badge>
      ) : null}
    </>
  );

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3.5 sm:items-center">
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground sm:mt-0" />
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold sm:mt-0">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold sm:truncate">{question.prompt}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">{tags}</div>
      </div>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{tags}</div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

/** Design preview — every edit here (questions, options, settings) is local state only. See dummy-quiz.ts. */
export function CourseQuiz() {
  const params = useParams<{ id: string }>();
  const course = DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];
  // quiz_question / quiz_settings hang off the course's quiz-kind module, not the course directly.
  const quizModule = getQuizModuleForCourse(course.id, course.modules_count);

  const [questions, setQuestions] = useState(() => (quizModule ? getQuizForModule(quizModule.id) : []));
  const [openId, setOpenId] = useState<string | null>(
    () => questions.find((q) => q.position === 3)?.id ?? null
  );
  const [settings, setSettings] = useState(() =>
    getQuizSettingsForModule(quizModule?.id ?? "")
  );
  const stats = quizModule ? getQuizStatsForModule(quizModule.id) : null;

  const attemptsLabel = settings.maxAttempts === null ? "unlimited attempts" : `${settings.maxAttempts} attempts`;

  const updateQuestion = (id: string, next: QuizQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? next : q)));
  };

  const duplicateQuestion = (question: QuizQuestion) => {
    const copy: QuizQuestion = {
      ...question,
      id: `dup-${nextQuestionId++}`,
      prompt: `${question.prompt} (copy)`,
    };
    setQuestions((prev) => {
      const index = prev.findIndex((q) => q.id === question.id);
      const next = [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
      return next.map((q, i) => ({ ...q, position: i + 1 }));
    });
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, position: i + 1 })));
    if (openId === id) setOpenId(null);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `new-${nextQuestionId++}`,
      moduleId: quizModule?.id ?? "",
      position: questions.length + 1,
      prompt: "New question",
      options: [
        { id: `new-${nextOptionId++}`, text: "Option 1" },
        { id: `new-${nextOptionId++}`, text: "Option 2" },
      ],
      correctOptionId: "",
      explanation: "",
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setOpenId(newQuestion.id);
  };

  if (!quizModule) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm font-semibold">This course has no quiz module yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Quiz questions belong to a quiz-kind module — add one from the Modules tab first.
        </p>
        <Button asChild variant="outline" className="mt-3">
          <Link href={`/academy/courses/${course.id}/modules`}>Go to Modules</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold wrap-break-word">{quizModule.title}</h2>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions · {settings.passMarkPct}% to pass · {attemptsLabel}
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => toast.success("Quiz saved")}>
          Save quiz
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-2">
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No quiz questions yet.
            </div>
          ) : (
            questions.map((question, index) =>
              openId === question.id ? (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  total={questions.length}
                  onChange={(next) => updateQuestion(question.id, next)}
                  onDuplicate={() => duplicateQuestion(question)}
                  onDelete={() => deleteQuestion(question.id)}
                />
              ) : (
                <QuestionRow
                  key={question.id}
                  question={question}
                  index={index}
                  onEdit={() => setOpenId(question.id)}
                />
              )
            )
          )}

          <button
            type="button"
            onClick={addQuestion}
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
                  value={String(settings.passMarkPct)}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, passMarkPct: Number(value) }))}
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
                  value={settings.maxAttempts === null ? "Unlimited" : String(settings.maxAttempts)}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      maxAttempts: value === "Unlimited" ? null : Number(value),
                    }))
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
                <p className="text-xs text-muted-foreground">
                  Associates are told this is open book and retakeable. Limiting attempts changes that promise.
                </p>
              </div>

              <div className="flex items-center gap-2 border-t pt-3.5">
                <Checkbox
                  id="shuffle"
                  checked={settings.shuffle}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, shuffle: Boolean(checked) }))}
                />
                <Label htmlFor="shuffle" className="text-sm font-semibold">
                  Shuffle questions
                </Label>
              </div>
              <p className="-mt-3 text-xs text-muted-foreground">Different order each attempt.</p>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-explanation"
                  checked={settings.showExplanationInline}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, showExplanationInline: Boolean(checked) }))
                  }
                />
                <Label htmlFor="show-explanation" className="text-sm font-semibold">
                  Show why after each answer
                </Label>
              </div>
              <p className="-mt-3 text-xs text-muted-foreground">Teaches on the way through, not only at the end.</p>
            </div>
          </section>

          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">How it grades</h3>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Correct answers stay on the server. The browser receives questions and options only. Nobody can
                read the answer key out of the network tab — which matters, because passing this is what puts a
                badge in front of buyers.
              </p>
              {stats ? (
                <div className="space-y-1 border-t pt-3 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Average score</span>
                    <span className="font-medium tabular-nums">{stats.averageScorePct}%</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Pass rate, first attempt</span>
                    <span className="font-medium tabular-nums">{stats.passRateFirstAttemptPct}%</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Most missed</span>
                    <span className="font-medium">Question {stats.mostMissedPosition}</span>
                  </div>
                </div>
              ) : (
                <p className="border-t pt-3 text-xs text-muted-foreground">No attempts yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
