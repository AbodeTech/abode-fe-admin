"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useIssue, IssueDetail } from "@/features/tickets";

interface Props {
  params: Promise<{ id: string }>;
}

export default function IssueDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, isError, error } = useIssue(id);

  return (
    <div className="space-y-4 py-2">
      <Link
        href="/issues"
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C]"
      >
        <ChevronLeft className="h-3 w-3" />
        All issues
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading issue…
        </div>
      ) : isError || !data ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
          Couldn&apos;t load issue.
          {error instanceof Error && (
            <div className="mt-1 text-xs text-red-800">{error.message}</div>
          )}
        </div>
      ) : (
        <IssueDetail detail={data} />
      )}
    </div>
  );
}
