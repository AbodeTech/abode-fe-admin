'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Loader2, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAdminPermissions, useHasPermission } from '@/hooks/use-admin-permission';
import { useMeetings } from '@/features/meetings';

import {
  useCohortTest,
  useCohortTestAttempts,
  useCohortTests,
  useCreateCohortTest,
  useExportTestAttempts,
  useReplaceTestQuestions,
  useToggleCohortTestActive,
  useUpdateCohortTest,
} from '../hooks/use-recruitment';
import {
  TEST_ELIGIBILITY_LABELS,
  TEST_ELIGIBILITY_TYPES,
  type CohortTest,
  type CreateCohortTestInput,
  type TestEligibilityType,
  type TestQuestionInput,
} from '../schemas/test.schema';
import { CohortShell } from './CohortShell';

type DraftQuestion = {
  type: 'multiple_choice' | 'true_false';
  prompt: string;
  optionsText: string;
  correct_answer: string;
};

function emptyQuestion(): DraftQuestion {
  return {
    type: 'multiple_choice',
    prompt: '',
    optionsText: 'a|Option A\nb|Option B\nc|Option C',
    correct_answer: 'a',
  };
}

/** MCQ options round-trip through a `key|label` per-line textarea; true/false is fixed. */
function draftFromQuestion(q: TestQuestionInput): DraftQuestion {
  return {
    type: q.type,
    prompt: q.prompt,
    optionsText: (q.options ?? []).map((o) => `${o.key}|${o.label}`).join('\n'),
    correct_answer: q.correct_answer,
  };
}

function parseQuestions(drafts: DraftQuestion[]): TestQuestionInput[] {
  return drafts.map((q, index) => {
    const options =
      q.type === 'true_false'
        ? [
            { key: 'true', label: 'True' },
            { key: 'false', label: 'False' },
          ]
        : q.optionsText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
              const [key, ...rest] = line.split('|');
              return { key: key.trim(), label: rest.join('|').trim() || key.trim() };
            });
    return {
      type: q.type,
      prompt: q.prompt.trim(),
      options,
      correct_answer: q.correct_answer.trim(),
      // Required by the real BE (`@Min(0) @IsInt()`) — see test.schema.ts.
      position: index,
    };
  });
}

/**
 * Shared question-builder UI for both create and edit — MCQ options as
 * `key|label` per line. Questions collapse into an accordion (one open at a
 * time) so the dialog doesn't grow unboundedly as questions are added; each
 * closed row summarizes its prompt and type. Newly added questions open
 * automatically.
 */
function QuestionsEditor({
  questions,
  onChange,
}: {
  questions: DraftQuestion[];
  onChange: (next: DraftQuestion[]) => void;
}) {
  const [openValue, setOpenValue] = useState<string>(String(Math.max(0, questions.length - 1)));

  const updateAt = (idx: number, patch: Partial<DraftQuestion>) =>
    onChange(questions.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const addQuestion = () => {
    const next = [...questions, emptyQuestion()];
    onChange(next);
    setOpenValue(String(next.length - 1));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Questions</Label>
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          Add question
        </Button>
      </div>
      <Accordion
        type="single"
        collapsible
        value={openValue}
        onValueChange={setOpenValue}
        className="rounded-md border"
      >
        {questions.map((q, idx) => (
          <AccordionItem key={idx} value={String(idx)} className="px-3">
            <AccordionTrigger>
              <span className="flex min-w-0 items-baseline gap-2 text-left">
                <span className="shrink-0 font-medium">Q{idx + 1}.</span>
                <span className="truncate">
                  {q.prompt.trim() || <span className="text-muted-foreground">Untitled question</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {q.type === 'true_false' ? 'True/False' : 'Multiple choice'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2">
              <Select
                value={q.type}
                onValueChange={(v) =>
                  updateAt(idx, {
                    type: v as DraftQuestion['type'],
                    correct_answer: v === 'true_false' ? 'true' : q.correct_answer,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                  <SelectItem value="true_false">True / false</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Prompt"
                value={q.prompt}
                onChange={(e) => updateAt(idx, { prompt: e.target.value })}
              />
              {q.type === 'multiple_choice' ? (
                <Textarea
                  rows={3}
                  value={q.optionsText}
                  onChange={(e) => updateAt(idx, { optionsText: e.target.value })}
                  placeholder="key|label per line"
                />
              ) : null}
              <Input
                placeholder="Correct answer key"
                value={q.correct_answer}
                onChange={(e) => updateAt(idx, { correct_answer: e.target.value })}
              />
              {questions.length > 1 ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(questions.filter((_, i) => i !== idx))}
                  >
                    Remove question
                  </Button>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/** Eligibility + schedule fields shared by create and edit. */
function EligibilityFields({
  cohortId,
  eligibilityType,
  setEligibilityType,
  meetingId,
  setMeetingId,
  seriesId,
  setSeriesId,
  requiredCount,
  setRequiredCount,
  disabled,
}: {
  cohortId: string;
  eligibilityType: TestEligibilityType;
  setEligibilityType: (v: TestEligibilityType) => void;
  meetingId: string;
  setMeetingId: (v: string) => void;
  seriesId: string;
  setSeriesId: (v: string) => void;
  requiredCount: string;
  setRequiredCount: (v: string) => void;
  disabled?: boolean;
}) {
  const meetingsQuery = useMeetings({ page: 1, limit: 50, cohort_id: cohortId });
  const seriesOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of meetingsQuery.data?.items ?? []) {
      if (!m.series_id) continue;
      // `series_name` is a mock-only convenience — the real MeetingDto only
      // carries `series_id`, so a raw id would otherwise show up as the
      // option label against the real backend. Fall back to the session's
      // own name (sessions in one series share a name in practice) rather
      // than ever rendering the id itself.
      if (!map.has(m.series_id)) map.set(m.series_id, m.series_name ?? m.name);
    }
    return [...map.entries()];
  }, [meetingsQuery.data?.items]);

  return (
    <>
      <div className="space-y-2">
        <Label>Eligibility</Label>
        <Select
          value={eligibilityType}
          onValueChange={(v) => setEligibilityType(v as TestEligibilityType)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEST_ELIGIBILITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TEST_ELIGIBILITY_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {disabled ? (
          <p className="text-xs text-slate-500">
            Eligibility can&rsquo;t be changed after a test is created.
          </p>
        ) : null}
      </div>
      {eligibilityType === 'session' ? (
        <div className="space-y-2">
          <Label>Required session</Label>
          <Select value={meetingId || undefined} onValueChange={setMeetingId} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {(meetingsQuery.data?.items ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {eligibilityType === 'series_n_of_m' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Series</Label>
            <Select value={seriesId || undefined} onValueChange={setSeriesId} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Select series" />
              </SelectTrigger>
              <SelectContent>
                {seriesOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Required count (N)</Label>
            <Input
              type="number"
              min={1}
              value={requiredCount}
              onChange={(e) => setRequiredCount(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function CreateTestDialog({ cohortId }: { cohortId: string }) {
  const [open, setOpen] = useState(false);
  const create = useCreateCohortTest(cohortId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eligibilityType, setEligibilityType] = useState<TestEligibilityType>('series_n_of_m');
  const [meetingId, setMeetingId] = useState('');
  const [seriesId, setSeriesId] = useState('');
  const [requiredCount, setRequiredCount] = useState('2');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [duration, setDuration] = useState('30');
  const [passMark, setPassMark] = useState('70');
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setEligibilityType('series_n_of_m');
    setMeetingId('');
    setSeriesId('');
    setRequiredCount('2');
    setOpensAt('');
    setClosesAt('');
    setDuration('30');
    setPassMark('70');
    setQuestions([emptyQuestion()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !opensAt) {
      toast.error('Title and open time are required');
      return;
    }
    const parsedQuestions = parseQuestions(questions);
    if (parsedQuestions.some((q) => !q.prompt || !q.correct_answer)) {
      toast.error('Each question needs a prompt and correct answer');
      return;
    }

    const payload: CreateCohortTestInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      eligibility_type: eligibilityType,
      eligibility_meeting_id: eligibilityType === 'session' ? meetingId || null : null,
      eligibility_series_id: eligibilityType === 'series_n_of_m' ? seriesId || null : null,
      eligibility_required_count:
        eligibilityType === 'series_n_of_m' ? Number(requiredCount) || 1 : null,
      opens_at: new Date(opensAt).toISOString(),
      closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      duration_minutes: Number(duration) || 30,
      pass_mark: Number(passMark) || 70,
      questions: parsedQuestions,
    };

    try {
      await create.mutateAsync(payload);
      toast.success('Test created');
      setOpen(false);
      reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create test');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create test
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create cohort test</DialogTitle>
          <DialogDescription>
            Set eligibility (session or N-of-M series), schedule, and questions.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <EligibilityFields
            cohortId={cohortId}
            eligibilityType={eligibilityType}
            setEligibilityType={setEligibilityType}
            meetingId={meetingId}
            setMeetingId={setMeetingId}
            seriesId={seriesId}
            setSeriesId={setSeriesId}
            requiredCount={requiredCount}
            setRequiredCount={setRequiredCount}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Opens at</Label>
              <Input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Closes at</Label>
              <Input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pass mark %</Label>
              <Input type="number" value={passMark} onChange={(e) => setPassMark(e.target.value)} />
            </div>
          </div>

          <QuestionsEditor questions={questions} onChange={setQuestions} />

          <DialogFooter>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Local datetime-local input value from an ISO string, or '' when absent. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditTestDialog({
  cohortId,
  testId,
  open,
  onOpenChange,
}: {
  cohortId: string;
  testId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: test, isLoading } = useCohortTest(testId);
  const updateTest = useUpdateCohortTest();
  const replaceQuestions = useReplaceTestQuestions();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [duration, setDuration] = useState('30');
  const [passMark, setPassMark] = useState('70');
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Populate the form once per opened test, from the render-time value rather
  // than an effect — matches this codebase's set-state-during-render
  // convention for syncing from a query result (see useMeetings usages).
  if (test && loadedFor !== test.id) {
    setLoadedFor(test.id);
    setTitle(test.title);
    setDescription(test.description ?? '');
    setOpensAt(toLocalInput(test.opens_at));
    setClosesAt(toLocalInput(test.closes_at));
    setDuration(String(test.duration_minutes ?? 30));
    setPassMark(String(test.pass_mark));
    setQuestions((test.questions ?? []).map(draftFromQuestion));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test) return;
    if (!title.trim() || !opensAt) {
      toast.error('Title and open time are required');
      return;
    }
    const parsedQuestions = parseQuestions(questions);
    if (parsedQuestions.some((q) => !q.prompt || !q.correct_answer)) {
      toast.error('Each question needs a prompt and correct answer');
      return;
    }

    try {
      await updateTest.mutateAsync({
        id: test.id,
        title: title.trim(),
        description: description.trim(),
        opens_at: new Date(opensAt).toISOString(),
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        duration_minutes: Number(duration) || 30,
        pass_mark: Number(passMark) || 70,
      });
      await replaceQuestions.mutateAsync({ id: test.id, questions: parsedQuestions });
      toast.success('Test updated');
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update test');
    }
  };

  const pending = updateTest.isPending || replaceQuestions.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setLoadedFor(null);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit test</DialogTitle>
          <DialogDescription>
            Update schedule and questions. Eligibility is fixed once a test is created.
          </DialogDescription>
        </DialogHeader>
        {isLoading || !test ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading test…</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <EligibilityFields
              cohortId={cohortId}
              eligibilityType={test.eligibility_type}
              setEligibilityType={() => undefined}
              meetingId={test.eligibility_meeting_id ?? ''}
              setMeetingId={() => undefined}
              seriesId={test.eligibility_series_id ?? ''}
              setSeriesId={() => undefined}
              requiredCount={String(test.eligibility_required_count ?? 1)}
              setRequiredCount={() => undefined}
              disabled
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Opens at</Label>
                <Input
                  type="datetime-local"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Closes at</Label>
                <Input
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pass mark %</Label>
                <Input type="number" value={passMark} onChange={(e) => setPassMark(e.target.value)} />
              </div>
            </div>

            <QuestionsEditor questions={questions} onChange={setQuestions} />

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AttemptsPanel({ testId }: { testId: string }) {
  const canExport = useAdminPermissions().has('export_academy');
  const attemptsQuery = useCohortTestAttempts(testId);
  const exportAttempts = useExportTestAttempts(testId);
  const rows = attemptsQuery.data?.items ?? [];

  const onExport = async () => {
    try {
      await exportAttempts.mutateAsync();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <div className="mt-4 border-t pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">Attempts</p>
        {canExport ? (
          <Button variant="outline" size="sm" onClick={onExport} disabled={exportAttempts.isPending}>
            {exportAttempts.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        ) : null}
      </div>
      {attemptsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Loading attempts…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No attempts yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                {a.first_name} {a.last_name} · {a.email}
              </span>
              <span className="tabular-nums text-slate-600">
                {a.submitted_at
                  ? `${a.score}% · ${a.correct_count}/${a.total_count} · ${a.passed ? 'Passed' : 'Failed'}`
                  : 'In progress'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TestRow({
  test,
  canManage,
  onEdit,
}: {
  test: CohortTest;
  canManage: boolean;
  onEdit: () => void;
}) {
  const toggle = useToggleCohortTestActive();
  const [showAttempts, setShowAttempts] = useState(false);

  const copyUrl = async () => {
    if (!test.public_url) return;
    try {
      await navigator.clipboard.writeText(test.public_url);
      toast.success('Public test link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{test.title}</h3>
            <Badge variant={test.is_active ? 'default' : 'secondary'}>
              {test.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {test.eligibility_label} · {test.question_count} questions · {test.attempt_count} attempts
            · pass {test.pass_mark}%
          </p>
          {test.description ? <p className="mt-1 text-sm text-slate-600">{test.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={copyUrl}>
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </Button>
          {canManage ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => setShowAttempts((v) => !v)}>
            {showAttempts ? 'Hide attempts' : 'Review attempts'}
          </Button>
          {canManage ? (
            <Button
              variant="outline"
              size="sm"
              disabled={toggle.isPending}
              onClick={async () => {
                try {
                  await toggle.mutateAsync({ id: test.id, is_active: !test.is_active });
                  toast.success(test.is_active ? 'Test deactivated' : 'Test activated');
                } catch (err: unknown) {
                  toast.error(err instanceof Error ? err.message : 'Update failed');
                }
              }}
            >
              {test.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          ) : null}
        </div>
      </div>

      {showAttempts ? <AttemptsPanel testId={test.id} /> : null}
    </div>
  );
}

export function CohortTestsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const canManage = useHasPermission('manage_academy');
  const { data, isLoading, error } = useCohortTests(cohortId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const rows = data?.items ?? [];

  return (
    <CohortShell programmeId={programmeId} cohortId={cohortId}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tests</h2>
            <p className="text-sm text-slate-500">
              Create assessments with session or series attendance eligibility, then review
              attempts.
            </p>
          </div>
          {canManage ? <CreateTestDialog cohortId={cohortId} /> : null}
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
            {error.message}
          </div>
        ) : isLoading ? (
          <p className="text-sm text-slate-500">Loading tests…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
            No tests yet for this cohort.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((test) => (
              <TestRow
                key={test.id}
                test={test}
                canManage={canManage}
                onEdit={() => setEditingId(test.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editingId ? (
        <EditTestDialog
          cohortId={cohortId}
          testId={editingId}
          open={Boolean(editingId)}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
        />
      ) : null}
    </CohortShell>
  );
}
