import type { Workflow, WorkflowFilters } from '../schemas/workflows.schema';
import type { PostingFilters, RunFilters } from '../schemas/finance.schema';

export const financeKeys = {
  all: ['finance-automation'] as const,
  workflowRuns: (workflow: Workflow, filters: WorkflowFilters) => [...financeKeys.all, workflow, 'runs', filters] as const,
  workflowRun: (workflow: Workflow, id: string) => [...financeKeys.all, workflow, 'run', id] as const,
  workflowPostings: (workflow: Workflow, filters: WorkflowFilters) => [...financeKeys.all, workflow, 'postings', filters] as const,
  runs: (filters: RunFilters) => [...financeKeys.all, 'runs', filters] as const,
  run: (id: string) => [...financeKeys.all, 'run', id] as const,
  postings: (filters: PostingFilters) => [...financeKeys.all, 'postings', filters] as const,
};
