import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { managerKeys } from "./query-keys";

const GET_UNASSIGNED_PROS_QUERY = graphql(`
  query GetUnassignedAssociatePros(
    $page: Int!
    $limit: Int!
    $searchQuery: String
  ) {
    getUnassignedAssociatePros(
      page: $page
      limit: $limit
      searchQuery: $searchQuery
    ) {
      count
      page
      limit
      results {
        _id
        firstName
        lastName
        email
        phoneNumber
        last_login
        createdAt
      }
    }
  }
`);

interface UseUnassignedProsParams {
  page?: number;
  limit?: number;
  searchQuery?: string | null;
}

export const useUnassignedPros = (params?: UseUnassignedProsParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const searchQuery = params?.searchQuery ?? null;

  return useQuery({
    queryKey: managerKeys.unassignedList({ page, limit, searchQuery }),
    queryFn: () =>
      execute(GET_UNASSIGNED_PROS_QUERY, { page, limit, searchQuery }),
    select: (data) => data.getUnassignedAssociatePros,
  });
};

const GET_UNASSIGNED_PROS_COUNT_QUERY = graphql(`
  query GetUnassignedAssociateProsCount($searchQuery: String) {
    getUnassignedAssociateProsCount(searchQuery: $searchQuery)
  }
`);

export const useUnassignedProsCount = (searchQuery?: string | null) => {
  return useQuery({
    queryKey: managerKeys.unassignedCount(searchQuery),
    queryFn: () =>
      execute(GET_UNASSIGNED_PROS_COUNT_QUERY, {
        searchQuery: searchQuery ?? null,
      }),
    select: (data) => data.getUnassignedAssociateProsCount,
  });
};
