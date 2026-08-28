"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { IssueStatus } from "@/lib/gql/graphql";
import {
  useIssues,
  DEFAULT_ISSUES_LIMIT,
  IssueStatusChips,
  IssuesTable,
  CreateIssueDialog,
} from "@/features/tickets";

/**
 * Root-cause issue list. Group ticket clusters here so a single fix
 * closes the whole batch (resolveIssue on the detail page).
 * URL-driven filter state (status, q, page).
 */

const parseStatus = (v: string | null): IssueStatus | null => {
  if (!v) return null;
  const values = Object.values(IssueStatus) as string[];
  return values.includes(v) ? (v as IssueStatus) : null;
};

function IssuesContent() {
  const router = useRouter();
  const search = useSearchParams();

  const status = parseStatus(search.get("status"));
  const page = Math.max(1, Number(search.get("page") ?? "1") || 1);

  const [q, setQ] = useState(search.get("q") ?? "");
  const debouncedQ = useDebounce(q);
  const [createOpen, setCreateOpen] = useState(false);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!("page" in patch)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError, error } = useIssues({
    status,
    search: debouncedQ || null,
    page,
    limit: DEFAULT_ISSUES_LIMIT,
  });

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500 mt-1">
            Root-cause grouping for ticket clusters. Resolve the issue
            and every linked ticket closes with it in one deliberate act.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New issue
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <IssueStatusChips
          active={status}
          onChange={(v) => updateParams({ status: v })}
        />
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              updateParams({ q: e.target.value || null });
            }}
            placeholder="Search title, ref or description…"
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      <IssuesTable
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
      />

      {totalCount > DEFAULT_ISSUES_LIMIT && (
        <Pagination
          count={totalCount}
          currentIdx={page}
          limit={DEFAULT_ISSUES_LIMIT}
        />
      )}

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(issue) => router.push(`/issues/${issue._id}`)}
      />
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={null}>
      <IssuesContent />
    </Suspense>
  );
}
