"use client";

import { CheckCircle2, ClipboardCheck, Mail, XCircle } from "lucide-react";
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
import {
  ONBOARDING_MATERIALS,
  getOnboardingRecord,
  type AssociatePro,
} from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pro: AssociatePro | null;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const labelForMaterial = (value: string) =>
  ONBOARDING_MATERIALS.find((m) => m.value === value)?.label ?? value;

export function OnboardingDetailsDialog({ open, onOpenChange, pro }: Props) {
  if (!pro) return null;
  const record = getOnboardingRecord(pro.id);
  const isBackfilled = record && record.materialsSent.length === 0 && !record.welcomeCallDone;

  const handleResendPack = () => {
    toast.success(`Pack resent to ${pro.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#00695C]" />
            Onboarding details
          </DialogTitle>
          <DialogDescription>
            What was recorded for {pro.name}&apos;s onboarding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
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

          {!record ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No onboarding record on file for this Pro.
            </div>
          ) : (
            <>
              <DetailRow label="Onboarded on" value={formatDate(record.onboardedAt)} />

              {!isBackfilled && (
                <>
                  <DetailRow
                    label="Welcome call"
                    value={
                      record.welcomeCallDone ? (
                        <span className="inline-flex items-center gap-1 text-[#00695C]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                          {record.welcomeCallDate
                            ? ` on ${formatDate(record.welcomeCallDate)}`
                            : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <XCircle className="h-3.5 w-3.5" />
                          Not done
                        </span>
                      )
                    }
                  />

                  <DetailRow
                    label="Materials sent"
                    value={
                      record.materialsSent.length === 0 ? (
                        <span className="text-gray-500">None recorded</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {record.materialsSent.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center rounded-full bg-[#E0F2F1] text-[#00695C] px-2 py-0.5 text-xs font-medium"
                            >
                              {labelForMaterial(m)}
                            </span>
                          ))}
                        </div>
                      )
                    }
                  />

                  <DetailRow
                    label="Account walkthrough"
                    value={
                      record.walkthroughDone ? (
                        <span className="inline-flex items-center gap-1 text-[#00695C]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <XCircle className="h-3.5 w-3.5" />
                          Not done
                        </span>
                      )
                    }
                  />
                </>
              )}

              {record.notes && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-row sm:justify-between gap-2">
          <Button variant="outline" onClick={handleResendPack}>
            <Mail className="h-4 w-4 mr-2" />
            Resend onboarding pack
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start text-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500 col-span-1 mt-0.5">{label}</p>
      <div className="col-span-2 text-gray-900">{value}</div>
    </div>
  );
}
