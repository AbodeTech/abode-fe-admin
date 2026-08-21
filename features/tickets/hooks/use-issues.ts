"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import {
  IssueStatus,
  type CreateIssueInput,
  type UpdateIssueInput,
  type ResolveIssueInput,
} from "@/lib/gql/graphql";
import { issueKeys, ticketKeys } from "./query-keys";

const ISSUE_FIELDS = `
  _id
  issue_ref
  title
  description
  status
  resolution_note
  resolved_at
  ticketCount
  createdAt
  updatedAt
  owner { _id userName email }
  resolved_by { _id userName email }
  created_by { _id userName email }
`;

const GET_ISSUES = graphql(`
  query GetIssues($status: IssueStatus, $search: String, $page: Int, $limit: Int) {
    getIssues(status: $status, search: $search, page: $page, limit: $limit) {
      count
      results {
        _id
        issue_ref
        title
        description
        status
        ticketCount
        createdAt
        updatedAt
        owner { _id userName email }
      }
    }
  }
`);

const GET_ISSUE = graphql(`
  query GetIssue($issueId: ID!) {
    getIssue(issueId: $issueId) {
      issue {
        _id
        issue_ref
        title
        description
        status
        resolution_note
        resolved_at
        ticketCount
        createdAt
        updatedAt
        owner { _id userName email }
        resolved_by { _id userName email }
        created_by { _id userName email }
      }
      ticketCount
      tickets {
        _id
        ticket_ref
        subject
        status
        createdAt
        user_affected { _id firstName lastName email }
      }
    }
  }
`);

const CREATE_ISSUE = graphql(`
  mutation CreateIssue($input: CreateIssueInput!) {
    createIssue(input: $input) {
      _id
      issue_ref
      title
      status
    }
  }
`);

const UPDATE_ISSUE = graphql(`
  mutation UpdateIssue($input: UpdateIssueInput!) {
    updateIssue(input: $input) {
      _id
      title
      description
      status
      owner { _id userName email }
    }
  }
`);

const RESOLVE_ISSUE = graphql(`
  mutation ResolveIssue($input: ResolveIssueInput!) {
    resolveIssue(input: $input) {
      issue {
        _id
        status
        resolution_note
        resolved_at
      }
      ticketsResolved
      ticketsExcluded
      customersAffected
    }
  }
`);

export interface UseIssuesParams {
  status?: IssueStatus | null;
  search?: string | null;
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const DEFAULT_ISSUES_LIMIT = 25;

export const useIssues = ({
  status = null,
  search = null,
  page = 1,
  limit = DEFAULT_ISSUES_LIMIT,
  enabled = true,
}: UseIssuesParams = {}) => {
  return useQuery({
    queryKey: issueKeys.list({ status, search, page, limit }),
    queryFn: () =>
      execute(GET_ISSUES, {
        status: status ?? null,
        search: search ?? null,
        page,
        limit,
      }),
    select: (data) => data.getIssues,
    enabled,
  });
};

export const useIssue = (issueId: string | null | undefined) => {
  return useQuery({
    queryKey: issueKeys.detail(issueId ?? ""),
    queryFn: () => execute(GET_ISSUE, { issueId: issueId as string }),
    select: (data) => data.getIssue,
    enabled: !!issueId,
  });
};

const invalidateIssues = (
  qc: ReturnType<typeof useQueryClient>,
  issueId?: string
) => {
  qc.invalidateQueries({ queryKey: issueKeys.lists() });
  if (issueId) {
    qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
  }
  // Ticket rows carry a link to the issue — refresh the list so status
  // and issue chip stay in sync after a mutation.
  qc.invalidateQueries({ queryKey: ticketKeys.lists() });
};

export const useCreateIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIssueInput) => execute(CREATE_ISSUE, { input }),
    onSuccess: (data) => invalidateIssues(qc, data.createIssue._id),
  });
};

export const useUpdateIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateIssueInput) => execute(UPDATE_ISSUE, { input }),
    onSuccess: (data) => invalidateIssues(qc, data.updateIssue._id),
  });
};

export const useResolveIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResolveIssueInput) => execute(RESOLVE_ISSUE, { input }),
    onSuccess: (data) => invalidateIssues(qc, data.resolveIssue.issue._id),
  });
};

void ISSUE_FIELDS;
