"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { AssistantAudience } from "@/lib/gql/graphql";
import { assistantQueryKeys } from "./query-keys";

/**
 * Read-only admin view of every question put to Amaris (the Ilé
 * assistant). BE: getAssistantQueries + assistantQueryCounts.
 *
 * The "answered" filter distinguishes real answers from the
 * [NO_ANSWER] sentinel — those are handbook content gaps worth
 * surfacing to whoever maintains the assistant's source material.
 */

const GET_ASSISTANT_QUERIES = graphql(`
  query GetAssistantQueries(
    $page: Int
    $limit: Int
    $filters: AssistantQueryFilters
  ) {
    getAssistantQueries(page: $page, limit: $limit, filters: $filters) {
      count
      data {
        id
        email
        firstName
        lastName
        audience
        question
        answer
        answered
        createdAt
      }
    }
  }
`);

const GET_ASSISTANT_QUERY_COUNTS = graphql(`
  query GetAssistantQueryCounts {
    assistantQueryCounts {
      customer
      associate
      answered
      noAnswer
      total
    }
  }
`);

export const DEFAULT_ASSISTANT_QUERIES_LIMIT = 25;

export interface UseAssistantQueriesParams {
  page?: number;
  limit?: number;
  /** null / undefined → any audience */
  audience?: AssistantAudience | null;
  /** true = answered · false = handbook gap · null = both */
  answered?: boolean | null;
  search?: string | null;
  enabled?: boolean;
}

export const useAssistantQueries = ({
  page = 1,
  limit = DEFAULT_ASSISTANT_QUERIES_LIMIT,
  audience = null,
  answered = null,
  search = null,
  enabled = true,
}: UseAssistantQueriesParams = {}) => {
  return useQuery({
    queryKey: assistantQueryKeys.list({
      page,
      limit,
      audience,
      answered,
      search,
    }),
    queryFn: () =>
      execute(GET_ASSISTANT_QUERIES, {
        page,
        limit,
        filters: {
          audience: audience ?? null,
          answered: answered ?? null,
          search: search ?? null,
        },
      }),
    select: (data) => data.getAssistantQueries,
    enabled,
  });
};

export const useAssistantQueryCounts = () => {
  return useQuery({
    queryKey: assistantQueryKeys.counts(),
    queryFn: () => execute(GET_ASSISTANT_QUERY_COUNTS, {}),
    select: (data) => data.assistantQueryCounts,
  });
};
