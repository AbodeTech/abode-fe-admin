"use client";

import React from "react";
import { Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_TABS = [
  { label: "Disputed", value: "disputed" },
  { label: "Waiting", value: "waiting" },
  { label: "Confirmed", value: "confirmed" },
  { label: "All", value: "all" },
];

const PRODUCT_OPTIONS = [
  { label: "All products", value: "all" },
  { label: "Full ownership", value: "full-ownership" },
  { label: "Flex", value: "flex" },
];

interface PurchaseConfirmationsFiltersProps {
  status: string;
  product: string;
  search: string;
  onStatusChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function PurchaseConfirmationsFilters({
  status,
  product,
  search,
  onStatusChange,
  onProductChange,
  onSearchChange,
  onExport,
  isExporting,
}: PurchaseConfirmationsFiltersProps) {
  return (
    <section className="mt-2 flex min-w-0 flex-col gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={status === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(tab.value)}
            className={status === tab.value ? "pointer-events-none" : ""}
          >
            {tab.label}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="ml-auto gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          Export CSV
        </Button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="min-w-0 space-y-2 md:col-span-2">
          <Label className="text-sm text-muted-foreground">Search</Label>
          <Input
            className="min-w-0"
            placeholder="Search by buyer, email, asset, or document name"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2">
          <Label className="text-sm text-muted-foreground">Product</Label>
          <Select value={product} onValueChange={onProductChange}>
            <SelectTrigger className="h-10 w-full min-w-0 sm:h-9">
              <SelectValue placeholder="All products" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
