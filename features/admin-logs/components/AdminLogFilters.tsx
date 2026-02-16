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
          <SelectItem value="all">All actions</SelectItem>
          <SelectItem value="create">Create</SelectItem>
          <SelectItem value="update">Update</SelectItem>
          <SelectItem value="delete">Delete</SelectItem>
          <SelectItem value="approve">Approve</SelectItem>
          <SelectItem value="decline">Decline</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={applyFilters}>Apply</Button>
    </div>
  );
}
