import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { managerKeys } from "./query-keys";

const GET_ASSOCIATE_MANAGERS_QUERY = graphql(`
  query GetAssociateManagers($page: Int!, $limit: Int!, $searchQuery: String) {
    getAssociateManagers(page: $page, limit: $limit, searchQuery: $searchQuery) {
      count
      page
      limit
      results {
        _id
        manager {
          _id
          userName
          firstName
          lastName
          email
          role
        }
        associate_pros_count
        associate_pros {
          _id
          firstName
          lastName
          email
          phoneNumber
          last_login
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  }
`);

interface UseAssociateManagersParams {
  page?: number;
  limit?: number;
  searchQuery?: string | null;
}

export const useAssociateManagers = (params?: UseAssociateManagersParams) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const searchQuery = params?.searchQuery ?? null;

  return useQuery({
    queryKey: managerKeys.list({ page, limit, searchQuery }),
    queryFn: () =>
      execute(GET_ASSOCIATE_MANAGERS_QUERY, { page, limit, searchQuery }),
    select: (data) => data.getAssociateManagers,
  });
};

const GET_ASSOCIATE_MANAGER_QUERY = graphql(`
  query GetAssociateManager($managerId: ID!) {
    getAssociateManager(managerId: $managerId) {
      _id
      manager {
        _id
        userName
        firstName
        lastName
        email
        role
      }
      associate_pros {
        _id
        firstName
        lastName
        email
        phoneNumber
        last_login
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`);

export const useAssociateManager = (managerId: string | null | undefined) => {
  return useQuery({
    queryKey: managerKeys.detail(managerId ?? ""),
    queryFn: () =>
      execute(GET_ASSOCIATE_MANAGER_QUERY, { managerId: managerId as string }),
    select: (data) => data.getAssociateManager,
    enabled: !!managerId,
  });
};
