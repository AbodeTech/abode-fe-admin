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
        router.push(`?${params.toString()}`);
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
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-[#101828]">Users</h1>
            <Link
              href="/analytics/users"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group"
            >
              View Analytics
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-sm text-[#667085] mt-1">Manage all users and their details</p>
        </div>
        <UsersPageActions />
      </div>

      <SystemUserOverview startDate={startDate} endDate={endDate} />

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email..."
          className="pl-8 h-10 bg-white"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsSearchPending(true);
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
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

      <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <UsersTable data={users} isLoading={isLoading || isSearchPending} />
        </div>

        {!isLoading && totalCount > 0 && (
          <div className="px-6 py-4 border-t border-[#E5EAEF]">
            <Pagination count={totalCount} currentIdx={page} limit={limit} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <UsersPageContent />
    </Suspense>
  );
}
