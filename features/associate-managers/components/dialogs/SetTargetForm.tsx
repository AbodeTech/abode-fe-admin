"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ManagerTarget } from "../../mock-data";

interface Props {
  existing?: ManagerTarget | null;
  onSave: (values: {
    periodKind: "month" | "custom";
    periodStart: string;
    periodEnd: string;
    associateProsRecruited: number;
    sellingAssociatePros: number;
    performanceScore: number;
  }) => void;
  onCancel: () => void;
}

type Mode = "month" | "custom";

// Build a list of the next 12 month options starting from the current month.
const buildMonthOptions = () => {
  const opts: { value: string; label: string; start: string; end: string }[] = [];
  const today = new Date("2026-05-13T00:00:00Z");
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + i, 1));
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    opts.push({
      value,
      label,
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }
  return opts;
};

const MONTH_OPTIONS = buildMonthOptions();

const isoOf = (d: Date) => d.toISOString().slice(0, 10);

export function SetTargetForm({ existing, onSave, onCancel }: Props) {
  const [mode, setMode] = useState<Mode>(existing?.periodKind ?? "month");

  // Month mode state
  const initialMonthValue =
    existing?.periodKind === "month"
      ? `${existing.periodStart.slice(0, 7)}`
      : MONTH_OPTIONS[0].value;
  const [monthValue, setMonthValue] = useState(initialMonthValue);

  // Custom range state
  const [customStart, setCustomStart] = useState<Date | undefined>(
    existing?.periodKind === "custom" ? new Date(`${existing.periodStart}T00:00:00Z`) : undefined
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    existing?.periodKind === "custom" ? new Date(`${existing.periodEnd}T00:00:00Z`) : undefined
  );
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  // Target values
  const [recruited, setRecruited] = useState<string>(
    existing ? String(existing.associateProsRecruited) : ""
  );
  const [selling, setSelling] = useState<string>(
    existing ? String(existing.sellingAssociatePros) : ""
  );
  const [score, setScore] = useState<string>(
    existing ? String(existing.performanceScore) : ""
  );

  const periodValid =
    mode === "month"
      ? !!monthValue
      : !!customStart && !!customEnd && customStart <= customEnd;

  const valuesValid = recruited !== "" && selling !== "" && score !== "";

  const canSave = periodValid && valuesValid;

  const handleSave = () => {
    if (!canSave) return;

    let periodStart: string;
    let periodEnd: string;

    if (mode === "month") {
      const opt = MONTH_OPTIONS.find((o) => o.value === monthValue)!;
      periodStart = opt.start;
      periodEnd = opt.end;
    } else {
      periodStart = isoOf(customStart!);
      periodEnd = isoOf(customEnd!);
    }

    onSave({
      periodKind: mode,
      periodStart,
      periodEnd,
      associateProsRecruited: Number(recruited),
      sellingAssociatePros: Number(selling),
      performanceScore: Number(score),
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4 space-y-4">
      <p className="text-sm font-medium text-gray-900">
        {existing ? "Edit target" : "Set target for new period"}
      </p>

      {/* Period mode */}
      <div className="space-y-2">
        <Label>Period</Label>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "month"
                ? "bg-[#00695C] text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Calendar month
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "custom"
                ? "bg-[#00695C] text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Custom range
          </button>
        </div>

        {mode === "month" ? (
          <Select value={monthValue} onValueChange={setMonthValue}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Pick a month" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Start</Label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start bg-white font-normal",
                      !customStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {customStart ? format(customStart, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStart}
                    onSelect={(d) => {
                      setCustomStart(d);
                      setStartOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">End</Label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start bg-white font-normal",
                      !customEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {customEnd ? format(customEnd, "d MMM yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEnd}
                    onSelect={(d) => {
                      setCustomEnd(d);
                      setEndOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      {/* KPI inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="recruited">Ass. Pros Recruited</Label>
          <Input
            id="recruited"
            type="number"
            min={0}
            value={recruited}
            onChange={(e) => setRecruited(e.target.value)}
            placeholder="e.g. 15"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="selling">Selling Ass. Pros</Label>
          <Input
            id="selling"
            type="number"
            min={0}
            value={selling}
            onChange={(e) => setSelling(e.target.value)}
            placeholder="e.g. 12"
            className="bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="score">Performance Score</Label>
          <Input
            id="score"
            type="number"
            min={0}
            step="0.1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 8.0"
            className="bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSave} onClick={handleSave}>
          {existing ? "Save changes" : "Save target"}
        </Button>
      </div>
    </div>
  );
}
