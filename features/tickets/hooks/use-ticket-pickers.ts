"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * Search sources for the "assign affected user" and "assign admin"
 * dialogs. Neither has ticket-specific behaviour, so they reuse the
 * shared admin + user endpoints and just narrow the fields down.
 */

const LIST_ADMINS_FOR_TICKET_PICKER = graphql(`
  query ListAdminsForTicketPicker {
    getAllAdminWithRoles {
      data {
        adminId
        adminName
        adminEmail
        role
      }
    }
  }
`);

const SEARCH_USERS_FOR_TICKET_PICKER = graphql(`
  query SearchUsersForTicketPicker(
    $page: Int!
    $limit: Int!
    $searchQuery: String
  ) {
    getAllUsersWithFilters(page: $page, limit: $limit, searchQuery: $searchQuery) {
      count
      data {
        _id
        firstName
        lastName
        email
        phoneNumber
      }
    }
  }
`);

export interface TicketAdminOption {
  _id: string;
  displayName: string;
  email: string;
  role: string;
}

export const useTicketAdminPicker = (query: string) => {
  const q = query.trim().toLowerCase();
  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "admin-picker"] as const,
    queryFn: () => execute(LIST_ADMINS_FOR_TICKET_PICKER, {}),
    select: (r) => r.getAllAdminWithRoles?.data ?? [],
  });
  const options: TicketAdminOption[] = (data ?? []).map((row) => ({
    _id: row.adminId,
    displayName: row.adminName || row.adminEmail,
    email: row.adminEmail,
    role: row.role,
  }));
  const filtered = q
    ? options.filter(
        (o) =>
          o.displayName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q)
      )
    : options;
  return { data: filtered, isLoading };
};

export interface TicketUserOption {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
}

export const useTicketUserSearch = (query: string, limit = 10) => {
  const q = query.trim();
  return useQuery({
    queryKey: ["tickets", "user-search", q, limit] as const,
    queryFn: () =>
      execute(SEARCH_USERS_FOR_TICKET_PICKER, {
        page: 1,
        limit,
        searchQuery: q || null,
      }),
    // Wait for at least 2 chars — no point paging the entire user table.
    enabled: q.length >= 2,
    select: (r) => {
      const rows = r.getAllUsersWithFilters?.data ?? [];
      // FilteredUserAdminDetail has every field nullable; keep only the
      // ones with a real _id + email so the picker never renders a
      // ghost row.
      return rows
        .filter((u): u is NonNullable<typeof u> => !!u && !!u._id && !!u.email)
        .map<TicketUserOption>((u) => ({
          _id: u._id!,
          firstName: u.firstName ?? null,
          lastName: u.lastName ?? null,
          email: u.email!,
          phoneNumber: u.phoneNumber ?? null,
        }));
    },
  });
};
