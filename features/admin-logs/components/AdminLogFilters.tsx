"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function AdminLogFiltersForm({
  initialEmail,
  initialAction,
}: {
  initialEmail: string;
  initialAction: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(initialEmail);
  const [action, setAction] = useState(initialAction);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (email.trim()) params.set("query", email.trim());
    else params.delete("query");
    if (action !== "all") params.set("action", action);
    else params.delete("action");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Search by admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        className="min-w-0 w-full sm:w-64"
      />
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          <SelectItem value="log-in">Log in</SelectItem>
          <SelectItem value="create-role">Create Admin</SelectItem>
          <SelectItem value="add-refferal">Add Referral</SelectItem>
          <SelectItem value="update-payment-plan">Update Payment Plan</SelectItem>
          <SelectItem value="delete-asset">Delete User Asset</SelectItem>
          <SelectItem value="modify-referral-status">Modify Referral Status</SelectItem>
          <SelectItem value="unsuspend-user">Unsuspend User</SelectItem>
          <SelectItem value="suspend-user">Suspend User</SelectItem>
          <SelectItem value="update-asset">Update Asset</SelectItem>
          <SelectItem value="buy-asset">Buy Asset</SelectItem>
          <SelectItem value="edit-wallet-details">Edit Wallet Details</SelectItem>
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
  const initialEmail = searchParams.get("query") || "";
  const initialAction = searchParams.get("action") || "all";
  const syncKey = `${initialEmail}\0${initialAction}`;

  return <AdminLogFiltersForm key={syncKey} initialEmail={initialEmail} initialAction={initialAction} />;
}
