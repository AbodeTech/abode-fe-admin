"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [action, setAction] = useState("all");

  useEffect(() => {
    setEmail(searchParams.get("query") || "");
    setAction(searchParams.get("action") || "all");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (email.trim()) params.set("query", email.trim());
    else params.delete("query");
    if (action !== "all") params.set("action", action);
    else params.delete("action");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Input
        placeholder="Search by admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
        className="w-64"
      />
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-[180px]">
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
      <Button onClick={applyFilters}>Apply</Button>
    </div>
  );
}
