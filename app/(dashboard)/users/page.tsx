"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useUsers, UsersTable, SystemUserOverview } from "@/features/users";
import { Pagination } from "@/components/shared/Pagination";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [isSearchPending, setIsSearchPending] = useState(false);

  // Debounce search update to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = searchParams.get("search") || "";

      if (searchTerm !== currentSearch) {
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
      setIsSearchPending(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, router, searchParams]);

  const { data, isLoading } = useUsers({
    page,
    limit,
    searchQuery: searchParams.get("search") || undefined,
    hasReferral: searchParams.get("hasReferral") === 'true' ? true : searchParams.get("hasReferral") === 'false' ? false : undefined,
    hasAsset: searchParams.get("hasAsset") === 'true' ? true : searchParams.get("hasAsset") === 'false' ? false : undefined,
    referralStatus: searchParams.get("referralStatus") || undefined,
    howDidYouHearAboutUs: searchParams.get("howYouHeard") || undefined,
  });

  const users = (data?.data || []).filter((u) => u !== null && u !== undefined);
  const totalCount = data?.count || 0;

  return (
    <div className="mt-4 space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">Users</h1>
          <p className="text-sm text-[#667085] mt-1">Manage all users and their details</p>
        </div>
      </div>

      <SystemUserOverview />

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 border border-[#E5EAEF] rounded-lg">
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

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <FilterSelect
            data={[
              { label: "All Statuses", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
              { label: "Suspended", value: "suspended" },
            ]}
            queryKey="referralStatus"
            placeholder="Status"
          />
          <FilterSelect
            data={[
              { label: "Referral: All", value: "all" },
              { label: "Has Referral", value: "true" },
              { label: "No Referral", value: "false" },
            ]}
            queryKey="hasReferral"
            placeholder="Referral"
          />
          <FilterSelect
            data={[
              { label: "Asset: All", value: "all" },
              { label: "Has Asset", value: "true" },
              { label: "No Asset", value: "false" },
            ]}
            queryKey="hasAsset"
            placeholder="Asset Ownership"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <UsersTable data={users} isLoading={isLoading || isSearchPending} />
        </div>

        {/* Pagination Section */}
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
