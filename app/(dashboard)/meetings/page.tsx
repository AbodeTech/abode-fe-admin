"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { useDebounce } from "@/hooks/use-debounce";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  CreateMeetingDialog,
  DEFAULT_MEETINGS_LIMIT,
  MEETING_AUDIENCE_TYPES,
  MeetingsFilters,
  MeetingsTable,
  useMeetings,
  type MeetingAudienceType,
} from "@/features/meetings";

function parseAudience(value: string | null): MeetingAudienceType | undefined {
  return value && (MEETING_AUDIENCE_TYPES as readonly string[]).includes(value)
    ? (value as MeetingAudienceType)
    : undefined;
}

function MeetingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canManage = useHasPermission("manage_meetings");

  const page = Number(searchParams.get("page")) || 1;
  const audienceType = parseAudience(searchParams.get("audience_type"));
  const activeParam = searchParams.get("is_active");
  const isActive = activeParam === "true" ? true : activeParam === "false" ? false : undefined;
  const search = searchParams.get("q") || "";
  const debouncedSearch = useDebounce(search);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { data, isLoading, error } = useMeetings({
    page,
    limit: DEFAULT_MEETINGS_LIMIT,
    audience_type: audienceType,
    is_active: isActive,
    q: debouncedSearch.trim() || undefined,
  });

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading meetings</h3>
          <p>{error.message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const count = data?.meta.total ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Meetings</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Create Google Meet sessions and share join links with associates.
          </p>
        </div>
        {canManage ? (
          <div className="w-full shrink-0 sm:w-auto">
            <CreateMeetingDialog />
          </div>
        ) : null}
      </div>

      <MeetingsFilters
        audienceType={audienceType ?? null}
        onAudienceTypeChange={(value) => setParam("audience_type", value)}
        isActive={isActive ?? null}
        onIsActiveChange={(value) => setParam("is_active", value === null ? null : String(value))}
        search={search}
        onSearchChange={(value) => setParam("q", value.trim() ? value : null)}
      />

      <MeetingsTable rows={data?.items ?? []} isLoading={isLoading} />

      {count > DEFAULT_MEETINGS_LIMIT ? (
        <Pagination count={count} currentIdx={page} limit={DEFAULT_MEETINGS_LIMIT} />
      ) : null}
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <MeetingsContent />
    </Suspense>
  );
}
