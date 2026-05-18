"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_MATERIALS,
  type AssociatePro,
} from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pro: AssociatePro | null;
}

const TODAY = new Date("2026-05-13T00:00:00Z");

export function OnboardingDialog({ open, onOpenChange, pro }: Props) {
  const [onboardedAt, setOnboardedAt] = useState<Date>(TODAY);
  const [onboardedAtOpen, setOnboardedAtOpen] = useState(false);

  const [welcomeCallDone, setWelcomeCallDone] = useState(false);
  const [welcomeCallDate, setWelcomeCallDate] = useState<Date | undefined>();
  const [welcomeCallDateOpen, setWelcomeCallDateOpen] = useState(false);

  const [materials, setMaterials] = useState<Set<string>>(new Set());
  const [walkthroughDone, setWalkthroughDone] = useState(false);
  const [notes, setNotes] = useState("");

  // Reset form when (re)opened
  useEffect(() => {
    if (open) {
      setOnboardedAt(TODAY);
      setWelcomeCallDone(false);
      setWelcomeCallDate(undefined);
      setMaterials(new Set());
      setWalkthroughDone(false);
      setNotes("");
    }
  }, [open]);

  if (!pro) return null;

  const toggleMaterial = (value: string) => {
    setMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSave = () => {
    // Design-only: no mutation.
    toast.success(`${pro.name} onboarded`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#00695C]" />
            Onboard Associate Pro
          </DialogTitle>
          <DialogDescription>
            Record what was done as part of {pro.name}&apos;s onboarding.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-5 py-1">
          {/* Pro context card */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Associate Pro
            </p>
            <p className="text-sm font-medium text-gray-900">{pro.name}</p>
            <p className="text-xs text-gray-500">
              {pro.email}
              {pro.phone ? ` · ${pro.phone}` : ""}
            </p>
          </div>

          {/* Onboarding date */}
          <div className="space-y-1.5">
            <Label htmlFor="onboarded-at">Onboarding date</Label>
            <Popover open={onboardedAtOpen} onOpenChange={setOnboardedAtOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="onboarded-at"
                  variant="outline"
                  className="w-full justify-start bg-white font-normal"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(onboardedAt, "d MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={onboardedAt}
                  onSelect={(d) => {
                    if (d) setOnboardedAt(d);
                    setOnboardedAtOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Welcome call */}
          <div className="space-y-2">
            <Label>Welcome call</Label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <Checkbox
                checked={welcomeCallDone}
                onCheckedChange={(c) => {
                  const next = c === true;
                  setWelcomeCallDone(next);
                  if (!next) setWelcomeCallDate(undefined);
                }}
              />
              <span className="text-sm font-medium text-gray-900">Welcome call done</span>
            </label>

            {welcomeCallDone && (
              <div className="ml-1 space-y-1">
                <Label className="text-xs text-gray-500">Call date</Label>
                <Popover open={welcomeCallDateOpen} onOpenChange={setWelcomeCallDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start bg-white font-normal",
                        !welcomeCallDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {welcomeCallDate ? format(welcomeCallDate, "d MMM yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={welcomeCallDate}
                      onSelect={(d) => {
                        setWelcomeCallDate(d);
                        setWelcomeCallDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Materials sent */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materials sent</Label>
              <span className="text-xs text-gray-500">{materials.size} selected</span>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
              {ONBOARDING_MATERIALS.map((m) => (
                <label
                  key={m.value}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={materials.has(m.value)}
                    onCheckedChange={() => toggleMaterial(m.value)}
                  />
                  <span className="text-sm text-gray-900">{m.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Walkthrough */}
          <div className="space-y-2">
            <Label>Account walkthrough</Label>
            <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-white cursor-pointer">
              <Checkbox
                checked={walkthroughDone}
                onCheckedChange={(c) => setWalkthroughDone(c === true)}
              />
              <span className="text-sm font-medium text-gray-900">Walkthrough completed</span>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Anything worth recording from the onboarding..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save onboarding</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
