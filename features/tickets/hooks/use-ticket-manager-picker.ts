"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * Active CS Managers, for the two manager filters above the ticket table.
 *
 * The tickets feature keeps its own query rather than reusing the one in
 * features/cs-managers: features are self-contained here, and this needs two
 * fields where that one pulls scores and portfolio counts it would throw away.
 *
 * Only CS Managers, not every admin. The two filters exist to answer questions
 * about a manager's queue and a manager's book, and a list of nineteen admins
 * would bury the handful of people either question is ever asked about.
 */

const LIST_CS_MANAGERS_FOR_TICKET_FILTER = graphql(`
  query ListCSManagersForTicketFilter {
    listCSManagers {
      _id
      manager {
        _id
        userName
        email
      }
    }
  }
`);

export interface TicketManagerOption {
  id: string;
  label: string;
}

export const useTicketManagerPicker = (enabled = true) => {
  const query = useQuery({
    queryKey: ["tickets", "cs-manager-picker"] as const,
    queryFn: () => execute(LIST_CS_MANAGERS_FOR_TICKET_FILTER, {}),
    // Who holds the role changes rarely, and the BE computes a score per
    // manager to answer this — not something to refetch on every mount.
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const options: TicketManagerOption[] = (query.data?.listCSManagers ?? [])
    .map((row) => ({
      id: row.manager._id,
      label: row.manager.userName || row.manager.email || row.manager._id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return { options, isLoading: query.isLoading };
};
