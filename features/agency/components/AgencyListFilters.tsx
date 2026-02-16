"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface AgencyListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function AgencyListFilters({ search, onSearchChange }: AgencyListFiltersProps) {
  return (
    <div className="max-w-xl rounded-lg border border-[#E5EAEF] bg-white p-4 space-y-2">
      <Label className="text-sm text-muted-foreground">Search agencies</Label>
      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          className="pl-9 pr-10"
          placeholder="Search by agency name, email or phone"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
