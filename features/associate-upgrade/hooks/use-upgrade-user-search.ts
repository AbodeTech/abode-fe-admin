import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

const SEARCH_UPGRADE_USERS_QUERY = graphql(`
  query SearchUpgradeUsers($searchQuery: String, $limit: Int!, $page: Int!) {
    getAllUsers(searchQuery: $searchQuery, limit: $limit, page: $page) {
      data {
        _id
        firstName
        lastName
        email
      }
    }
  }
`);

interface UseUpgradeUserSearchParams {
  searchQuery: string;
  limit?: number;
  page?: number;
  enabled?: boolean;
}

export const useUpgradeUserSearch = ({
  searchQuery,
  limit = 10,
  page = 1,
  enabled = true,
}: UseUpgradeUserSearchParams) => {
  return useQuery({
    queryKey: ["associate-upgrade", "user-search", searchQuery, limit, page],
    queryFn: () =>
      execute(SEARCH_UPGRADE_USERS_QUERY, {
        searchQuery: searchQuery || null,
        limit,
        page,
      }),
    enabled: enabled && searchQuery.trim().length >= 2,
    select: (data) => data.getAllUsers.data ?? [],
  });
};

