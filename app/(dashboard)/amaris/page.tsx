"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AMARIS_AUDIENCES,
  AMARIS_CHANNELS,
  AmarisQueryFilters,
  AmarisQueryStatsStrip,
  AmarisQueryTable,
  DEFAULT_AMARIS_LIMIT,
  useAmarisQueries,
  type AmarisAudience,
  type AmarisChannel,
} from "@/features/amaris";

/**
 * Amaris — read-only admin log of every question put to the assistant.
 *
 * Filter state lives in the URL so pagination + share-a-view work without
 * extra plumbing (page, audience, channel, answered, q).
 */

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

const parseAnswered = (value: string | null): boolean | null => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

function AmarisContent() {
  const router = useRouter();
  const search = useSearchParams();

  const page = Math.max(1, Number(search.get("page") ?? "1") || 1);
  const audience = parseEnum<AmarisAudience>(search.get("audience"), AMARIS_AUDIENCES);
  const channel = parseEnum<AmarisChannel>(search.get("channel"), AMARIS_CHANNELS);
  const answered = parseAnswered(search.get("answered"));
  const [q, setQ] = useState(search.get("q") ?? "");
  const debouncedQ = useDebounce(q);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Any filter change resets pagination.
    if (!("page" in patch)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError, error } = useAmarisQueries({
    page,
    limit: DEFAULT_AMARIS_LIMIT,
    audience: audience ?? undefined,
    channel: channel ?? undefined,
    answered: answered ?? undefined,
    q: debouncedQ || undefined,
  });

  const rows = data ?? [];
  // ⛔ ticket 26 — the endpoint returns no total (the envelope interceptor
  // drops the service's `count`), so pagination is a full-page heuristic:
  // a full page means there is probably a next one. No invented totals.
  const hasNext = rows.length === DEFAULT_AMARIS_LIMIT;

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Amaris Questions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Read-only log of every question put to Amaris. Handbook gaps surface as
          &ldquo;No answer&rdquo; — worth adding to the source material so those questions are
          covered next time.
        </p>
      </div>

      <AmarisQueryStatsStrip />

      <AmarisQueryFilters
        audience={audience}
        onAudienceChange={(value) => updateParams({ audience: value })}
        channel={channel}
        onChannelChange={(value) => updateParams({ channel: value })}
        answered={answered}
        onAnsweredChange={(value) => updateParams({ answered: value === null ? null : String(value) })}
        search={q}
        onSearchChange={(value) => {
          setQ(value);
          updateParams({ q: value || null });
        }}
      />

      <AmarisQueryTable
        rows={rows}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
      />

      {page > 1 || hasNext ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isLoading}
            onClick={() => updateParams({ page: page > 2 ? String(page - 1) : null })}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Previous
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext || isLoading}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function AmarisPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] px-3 pb-16 sm:px-4 sm:pb-20">
      <Suspense fallback={null}>
        <AmarisContent />
      </Suspense>
    </div>
  );
}
