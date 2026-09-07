'use client';

import { useMemo, useState } from 'react';
import { Copy, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
import { useHasPermission } from '@/hooks/use-admin-permission';
import { useMeetings } from '@/features/meetings';

import {
  useCohortTestAttempts,
  useCohortTests,
  useCreateCohortTest,
  useToggleCohortTestActive,
} from '../hooks/use-recruitment';
import {
  TEST_ELIGIBILITY_LABELS,
  TEST_ELIGIBILITY_TYPES,
  type CreateCohortTestInput,
  type TestEligibilityType,
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

function CreateTestDialog({
  cohortId,
  onCreated,
}: {
  cohortId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const create = useCreateCohortTest(cohortId);
  const meetingsQuery = useMeetings({ page: 1, limit: 50, cohort_id: cohortId });
  const seriesOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of meetingsQuery.data?.items ?? []) {
      if (m.series_id) map.set(m.series_id, m.series_name ?? m.series_id);
    }
    return [...map.entries()];
  }, [meetingsQuery.data?.items]);

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
    const parsedQuestions = questions.map((q) => {
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
      };
    });
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
      onCreated();
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
          <div className="space-y-2">
            <Label>Eligibility</Label>
            <Select
              value={eligibilityType}
              onValueChange={(v) => setEligibilityType(v as TestEligibilityType)}
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
          </div>
          {eligibilityType === 'session' ? (
            <div className="space-y-2">
              <Label>Required session</Label>
              <Select value={meetingId || undefined} onValueChange={setMeetingId}>
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
                <Select value={seriesId || undefined} onValueChange={setSeriesId}>
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
                />
              </div>
            </div>
          ) : null}
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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuestions((q) => [...q, emptyQuestion()])}
              >
                Add question
              </Button>
            </div>
            {questions.map((q, idx) => (
              <div key={idx} className="space-y-2 rounded-md border p-3">
                <Select
                  value={q.type}
                  onValueChange={(v) =>
                    setQuestions((rows) =>
                      rows.map((row, i) =>
                        i === idx
                          ? {
                              ...row,
                              type: v as DraftQuestion['type'],
                              correct_answer: v === 'true_false' ? 'true' : row.correct_answer,
                            }
                          : row,
                      ),
                    )
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
                  onChange={(e) =>
                    setQuestions((rows) =>
                      rows.map((row, i) => (i === idx ? { ...row, prompt: e.target.value } : row)),
                    )
                  }
                />
                {q.type === 'multiple_choice' ? (
                  <Textarea
                    rows={3}
                    value={q.optionsText}
                    onChange={(e) =>
                      setQuestions((rows) =>
                        rows.map((row, i) =>
                          i === idx ? { ...row, optionsText: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="key|label per line"
                  />
                ) : null}
                <Input
                  placeholder="Correct answer key"
                  value={q.correct_answer}
                  onChange={(e) =>
                    setQuestions((rows) =>
                      rows.map((row, i) =>
                        i === idx ? { ...row, correct_answer: e.target.value } : row,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>

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

export function CohortTestsPage({
  programmeId,
  cohortId,
}: {
  programmeId: string;
  cohortId: string;
}) {
  const canManage = useHasPermission('manage_academy');
  const { data, isLoading, error, refetch } = useCohortTests(cohortId);
  const toggle = useToggleCohortTestActive();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const attemptsQuery = useCohortTestAttempts(selectedId ?? '');

  const rows = data?.items ?? [];

  const copyUrl = async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public test link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

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
          {canManage ? (
            <CreateTestDialog cohortId={cohortId} onCreated={() => void refetch()} />
          ) : null}
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
              <div key={test.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{test.title}</h3>
                      <Badge variant={test.is_active ? 'default' : 'secondary'}>
                        {test.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {test.eligibility_label} · {test.question_count} questions ·{' '}
                      {test.attempt_count} attempts · pass {test.pass_mark}%
                    </p>
                    {test.description ? (
                      <p className="mt-1 text-sm text-slate-600">{test.description}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => copyUrl(test.public_url)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedId((id) => (id === test.id ? null : test.id))
                      }
                    >
                      {selectedId === test.id ? 'Hide attempts' : 'Review attempts'}
                    </Button>
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={async () => {
                          try {
                            await toggle.mutateAsync({
                              id: test.id,
                              is_active: !test.is_active,
                            });
                            toast.success(test.is_active ? 'Test deactivated' : 'Test activated');
                            void refetch();
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

                {selectedId === test.id ? (
                  <div className="mt-4 border-t pt-3">
                    {attemptsQuery.isLoading ? (
                      <p className="text-sm text-slate-500">Loading attempts…</p>
                    ) : (attemptsQuery.data?.items ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No attempts yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(attemptsQuery.data?.items ?? []).map((a) => (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                          >
                            <span>
                              {a.first_name} {a.last_name} · {a.email}
                            </span>
                            <span className="tabular-nums text-slate-600">
                              {a.score}% · {a.correct_count}/{a.total_count} ·{' '}
                              {a.passed ? 'Passed' : 'Failed'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </CohortShell>
  );
}
