"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useUsers,
  UsersTable,
  SystemUserOverview,
  UsersPageActions,
} from "@/features/users";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("query") || searchParams.get("search") || ""
  );
  const [isSearchPending, setIsSearchPending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = searchParams.get("query") || searchParams.get("search") || "";
      if (searchTerm !== currentSearch) {
        if (searchTerm) {
          params.set("query", searchTerm);
          params.delete("search");
        } else {
          params.delete("query");
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`, { scroll: false });
      }
      setIsSearchPending(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const searchQuery = searchParams.get("query") || searchParams.get("search") || undefined;
  const hasReferral =
    searchParams.get("hasReferral") === "true"
      ? true
      : searchParams.get("hasReferral") === "false"
        ? false
        : undefined;
  const hasAsset =
    searchParams.get("hasAsset") === "true"
      ? true
      : searchParams.get("hasAsset") === "false"
        ? false
        : undefined;
  const referralStatus = searchParams.get("referralStatus") || undefined;
  const howDidYouHearAboutUs = searchParams.get("howYouHeard") || undefined;
  const startDate = searchParams.get("start_date") || undefined;
  const endDate = searchParams.get("end_date") || undefined;

  const { data, isLoading } = useUsers({
    page,
    limit,
    searchQuery,
    hasReferral,
    hasAsset,
    referralStatus,
    howDidYouHearAboutUs,
    startDate,
    endDate,
  });

  const users = (data?.data || []).filter((u) => u !== null && u !== undefined);
  const totalCount = data?.count || 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-4 flex-col gap-2">
            <h1 className="text-2xl font-semibold text-[#101828]">Users</h1>
            <Link
              href="/analytics/users"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              View Analytics
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-1 text-sm text-[#667085]">Manage all users and their details</p>
        </div>
        <div className="w-full min-w-0 sm:w-auto sm:shrink-0">
          <UsersPageActions />
        </div>
      </div>

      <SystemUserOverview startDate={startDate} endDate={endDate} />

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email..."
          className="h-10 bg-white pl-8"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsSearchPending(true);
          }}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <FilterSelect
          data={[
            { label: "Has Asset - all", value: "all" },
            { label: "Has Asset - true", value: "true" },
            { label: "Has Asset - false", value: "false" },
          ]}
          queryKey="hasAsset"
          placeholder="Has Asset"
        />
        <FilterSelect
          data={[
            { label: "Has Referral - all", value: "all" },
            { label: "Has Referral - true", value: "true" },
            { label: "Has Referral - false", value: "false" },
          ]}
          queryKey="hasReferral"
          placeholder="Has Referral"
        />
        <FilterSelect
          data={[
            { label: "Referral Status - all", value: "all" },
            { label: "Referral Status - User", value: "user" },
            { label: "Referral Status - Associate", value: "associate" },
            { label: "Referral Status - Associate Pro", value: "associate-pro" },
          ]}
          queryKey="referralStatus"
          placeholder="Referral Status"
        />
        <FilterSelect
          data={[
            { label: "How You Heard - all", value: "all" },
            { label: "Someone invited me", value: "referral" },
            { label: "Social Media", value: "social-media" },
            { label: "Billboard", value: "billboard" },
            { label: "Email Newsletter", value: "email-newsletter" },
            { label: "Associate", value: "associate" },
            { label: "African Wealth Festival Event", value: "african-wealth-festival" },
            { label: "Other", value: "other" },
          ]}
          queryKey="howYouHeard"
          placeholder="How You Heard"
        />
        <DateFilter />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E5EAEF] bg-white">
        <div className="overflow-x-auto">
          <UsersTable data={users} isLoading={isLoading || isSearchPending} />
        </div>

        {!isLoading && totalCount > 0 && (
          <div className="border-t border-[#E5EAEF] px-4 py-4">
            <Pagination count={totalCount} currentIdx={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <UsersPageContent />
    </Suspense>
  );
}
