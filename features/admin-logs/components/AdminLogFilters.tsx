"use client";

import { ADMIN_LOG_ACTION_OPTIONS } from "../schemas/admin-log.schema";
import { useAdminLogAdminOptions } from "../hooks/use-admin-logs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function AdminLogFiltersForm({
  initialAdmin,
  initialAction,
}: {
  initialAdmin: string;
  initialAction: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [admin, setAdmin] = useState(initialAdmin);
  const [action, setAction] = useState(initialAction);
  const { data: admins = [] } = useAdminLogAdminOptions();

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (admin !== "all") params.set("admin", admin);
    else params.delete("admin");
    if (action !== "all") params.set("action", action);
    else params.delete("action");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* The BE filters by admin id only, so this is a picker, not an email search. */}
      <Select value={admin} onValueChange={setAdmin}>
        <SelectTrigger className="w-full sm:w-[240px]" aria-label="Admin">
          <SelectValue placeholder="Admin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All admins</SelectItem>
          {admins.map((a) => (
            <SelectItem key={a._id} value={a._id}>
              {a.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-full sm:w-[240px]" aria-label="Action">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {ADMIN_LOG_ACTION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="w-full shrink-0 sm:w-auto" onClick={applyFilters}>
        Apply
      </Button>
    </div>
  );
}

/** Remounts when URL query changes so draft fields stay in sync without syncing in an effect. */
export function AdminLogFilters() {
  const searchParams = useSearchParams();
  const initialAdmin = searchParams.get("admin") || "all";
  const initialAction = searchParams.get("action") || "all";
  const syncKey = `${initialAdmin}\0${initialAction}`;

  return <AdminLogFiltersForm key={syncKey} initialAdmin={initialAdmin} initialAction={initialAction} />;
}
