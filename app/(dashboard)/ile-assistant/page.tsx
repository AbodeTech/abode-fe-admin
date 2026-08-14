"use client";

import { useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AssistantAudience } from "@/lib/gql/graphql";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AssistantQueryStatsStrip,
  AssistantQueryFilters,
  AssistantQueryTable,
  useAssistantQueries,
  DEFAULT_ASSISTANT_QUERIES_LIMIT,
} from "@/features/assistant-questions";

/**
 * Ilé Assistant — read-only admin view of every question put to Amaris.
 * BE: getAssistantQueries + assistantQueryCounts.
 *
 * Filter state lives in the URL so pagination + share-a-view work
 * without extra plumbing (page, audience, answered, q).
 */

const parseAudience = (v: string | null): AssistantAudience | null => {
  if (v === "customer") return AssistantAudience.Customer;
  if (v === "associate") return AssistantAudience.Associate;
  return null;
};

const parseAnswered = (v: string | null): boolean | null => {
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
};

function IleAssistantContent() {
  const router = useRouter();
  const search = useSearchParams();

  const page = Math.max(1, Number(search.get("page") ?? "1") || 1);
  const audience = parseAudience(search.get("audience"));
  const answered = parseAnswered(search.get("answered"));
  const [q, setQ] = useState(search.get("q") ?? "");
  const debouncedQ = useDebounce(q);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Any filter change resets pagination.
    if (!("page" in patch)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError, error } = useAssistantQueries({
    page,
    limit: DEFAULT_ASSISTANT_QUERIES_LIMIT,
    audience,
    answered,
    search: debouncedQ || null,
  });

  const totalCount = data?.count ?? 0;

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Ilé Assistant Questions
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Read-only log of every question put to Amaris. Handbook gaps
          surface as &ldquo;No answer&rdquo; — worth adding to the source material so
          those questions are covered next time.
        </p>
      </div>

      <AssistantQueryStatsStrip />

      <AssistantQueryFilters
        audience={audience}
        onAudienceChange={(v) =>
          updateParams({ audience: v ? v.toLowerCase() : null })
        }
        answered={answered}
        onAnsweredChange={(v) =>
          updateParams({ answered: v === null ? null : String(v) })
        }
        search={q}
        onSearchChange={(v) => {
          setQ(v);
          updateParams({ q: v || null });
        }}
      />

      <AssistantQueryTable
        rows={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
      />

      {totalCount > DEFAULT_ASSISTANT_QUERIES_LIMIT && (
        <Pagination
          count={totalCount}
          currentIdx={page}
          limit={DEFAULT_ASSISTANT_QUERIES_LIMIT}
        />
      )}
    </div>
  );
}

export default function IleAssistantPage() {
  // useSearchParams needs a Suspense boundary at the page level per Next.js
  // 16 App Router.
  return (
    <Suspense fallback={null}>
      <IleAssistantContent />
    </Suspense>
  );
}
