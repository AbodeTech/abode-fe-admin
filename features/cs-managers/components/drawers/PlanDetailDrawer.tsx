"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  PhoneCall,
  PhoneOff,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import type {
  CustomerOnboardingOutcome,
  LogOnboardingCallInput,
  PlanRow,
} from "@/lib/gql/graphql";
import {
  onboardingCallSchema,
  type OnboardingCallFormValues,
} from "../../schemas/onboarding-call.schema";
import {
  useCustomerOnboardingAttempts,
  useLogOnboardingCall,
  useMarkDeedDelivered,
} from "../../hooks/use-plan-actions";
import {
  AllocationPill,
  DoaPill,
  OnboardingPill,
  PaymentPill,
  formatShortDate,
  planCustomerInitials,
  planCustomerName,
} from "../status-pills";

interface Props {
  plan: PlanRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OUTCOMES: {
  value: OnboardingCallFormValues["outcome"];
  label: string;
  description: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  {
    value: "done",
    label: "Done",
    description: "Spoke and gathered the intel — this ticks the onboarded target.",
    icon: CheckCircle2,
    tone: "text-[#00695C]",
  },
  {
    value: "spoke",
    label: "Spoke",
    description: "Connected, but the onboarding isn't finished yet.",
    icon: PhoneCall,
    tone: "text-blue-600",
  },
  {
    value: "no_answer",
    label: "No answer",
    description: "Customer didn't pick up. Logs the attempt only.",
    icon: PhoneOff,
    tone: "text-amber-600",
  },
  {
    value: "rescheduled",
    label: "Rescheduled",
    description: "Customer asked to talk at another time.",
    icon: CalendarClock,
    tone: "text-purple-600",
  },
];

const OUTCOME_LABELS: Record<string, string> = {
  done: "Done",
  spoke: "Spoke",
  no_answer: "No answer",
  rescheduled: "Rescheduled",
};

const DEFAULTS: OnboardingCallFormValues = {
  outcome: undefined as unknown as OnboardingCallFormValues["outcome"],
  landChoiceReason: "",
  notes: "",
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${formatShortDate(iso)} · ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export function PlanDetailDrawer({ plan, open, onOpenChange }: Props) {
  const form = useForm<OnboardingCallFormValues>({
    resolver: zodResolver(onboardingCallSchema),
    defaultValues: DEFAULTS,
    mode: "onSubmit",
  });

  const planId = open ? plan?.planId ?? null : null;
  const { data: attempts = [], isLoading: attemptsLoading } =
    useCustomerOnboardingAttempts(planId);
  const logCall = useLogOnboardingCall();
  const markDeed = useMarkDeedDelivered();

  // Fresh form on every (re)open, and whenever the drawer switches plan.
  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, plan?.planId, form]);

  const outcome = form.watch("outcome");

  if (!plan) return null;

  const customerName = planCustomerName(plan.customer);
  const onboarded = attempts.some((a) => a.outcome === "done");
  const deedSent = plan.doa === "sent";
  const deedEligible = plan.doa === "not_sent";

  const onSubmit = async (values: OnboardingCallFormValues) => {
    const input: LogOnboardingCallInput = {
      paymentPlanId: plan.planId,
      outcome: values.outcome as CustomerOnboardingOutcome,
      landChoiceReason: values.landChoiceReason?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };

    try {
      await logCall.mutateAsync(input);
      toast.success(
        values.outcome === "done"
          ? `${customerName} onboarded on this plan`
          : `Call logged · ${OUTCOME_LABELS[values.outcome]}`
      );
      form.reset(DEFAULTS);
    } catch (err) {
      toast.error((err as Error)?.message || "Couldn't log this call. Try again.");
    }
  };

  const onMarkDeed = async () => {
    try {
      await markDeed.mutateAsync(plan.planId);
      toast.success(`Deed of Assignment marked delivered for ${customerName}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        (err as Error)?.message || "Couldn't mark the deed delivered. Try again."
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0"
      >
        <SheetHeader className="border-b border-gray-200 px-6 py-5 pr-12 space-y-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-xs font-semibold shrink-0">
              {planCustomerInitials(plan.customer)}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base text-gray-900 leading-tight flex items-center gap-1.5">
                <span className="truncate">{customerName}</span>
                {plan.priorPlansCount > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0.5 shrink-0"
                    title={`Repeat buyer · ${plan.priorPlansCount} prior plan${
                      plan.priorPlansCount === 1 ? "" : "s"
                    }`}
                  >
                    <Repeat className="h-2.5 w-2.5" />+{plan.priorPlansCount}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 truncate">
                {plan.customer.email}
              </SheetDescription>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {plan.asset}
              </p>
              <span className="text-[11px] text-gray-500 shrink-0">
                {plan.product === "flex" ? "Flex" : "Full-ownership"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Opened {formatShortDate(plan.purchaseDate)}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <PaymentPill status={plan.paymentStatus} label={plan.paymentLabel} />
              <OnboardingPill status={plan.onboarding} />
              <AllocationPill status={plan.allocation} label={plan.allocationLabel} />
              <DoaPill status={plan.doa} label={plan.doaLabel} />
            </div>
          </div>

          <Link
            href={`/users/${plan.customer.id}`}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00695C] w-fit"
          >
            View full customer profile
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* ------------------------------------------------ Deed of Assignment */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-semibold text-gray-900">
                Deed of Assignment
              </h3>
            </div>

            {deedSent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                {plan.doaLabel ?? "Delivered"}. Marking a deed delivered can&apos;t be
                undone from the admin.
              </div>
            ) : deedEligible ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2.5">
                <p className="text-xs text-amber-900">
                  This plan is eligible and the deed hasn&apos;t gone out yet. Send it
                  to the customer first, then record it here.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs" disabled={markDeed.isPending}>
                      {markDeed.isPending && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      Mark deed delivered
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark the deed delivered?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This records that {customerName}&apos;s Deed of Assignment for{" "}
                        {plan.asset} has been sent, and counts towards this
                        period&apos;s deeds target. There is no way to undo it from
                        the admin.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onMarkDeed}>
                        Yes, mark delivered
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex gap-2">
                <Lock className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600">
                  Not eligible yet.{" "}
                  {plan.product === "flex"
                    ? "A flex plan qualifies once the land payment is complete."
                    : "A full-ownership plan qualifies once both the land payment and the development levy are complete."}
                </p>
              </div>
            )}
          </section>

          {/* ------------------------------------------------- Onboarding calls */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Onboarding calls
                </h3>
              </div>
              <span
                className={cn(
                  "text-[11px] rounded-full px-2 py-0.5 font-medium",
                  onboarded
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                )}
              >
                {onboarded ? "Onboarded" : "Not onboarded"}
              </span>
            </div>

            {attemptsLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading call history…
              </div>
            ) : attempts.length === 0 ? (
              <p className="text-xs text-gray-500 rounded-lg border border-dashed border-gray-200 p-3">
                No calls logged on this plan yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {attempts.map((a) => (
                  <li
                    key={a._id}
                    className="rounded-lg border border-gray-200 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[11px] rounded-full px-2 py-0.5 font-medium",
                          a.outcome === "done"
                            ? "bg-emerald-50 text-emerald-700"
                            : a.outcome === "no_answer"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {OUTCOME_LABELS[a.outcome] ?? a.outcome}
                      </span>
                      <span className="text-[11px] text-gray-500 tabular-nums">
                        {formatDateTime(a.called_at)}
                      </span>
                    </div>
                    {a.land_choice_reason && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Why this land
                        </p>
                        <p className="text-xs text-gray-700">{a.land_choice_reason}</p>
                      </div>
                    )}
                    {a.notes && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">
                          Notes
                        </p>
                        <p className="text-xs text-gray-700">{a.notes}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {/* --------------------------------------------------- log a call */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="rounded-lg border border-gray-200 p-3 space-y-4"
              >
                <p className="text-xs font-medium text-gray-900">Log a call</p>

                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs text-gray-600">
                        What happened?
                      </FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-2 gap-2">
                          {OUTCOMES.map((o) => {
                            const Icon = o.icon;
                            const active = field.value === o.value;
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => field.onChange(o.value)}
                                className={cn(
                                  "text-left rounded-lg border p-2.5 transition-colors",
                                  active
                                    ? "border-[#00695C] bg-[#E0F2F1]/50"
                                    : "border-gray-200 hover:border-gray-300"
                                )}
                              >
                                <span className="flex items-center gap-1.5">
                                  <Icon className={cn("h-3.5 w-3.5", o.tone)} />
                                  <span className="text-xs font-medium text-gray-900">
                                    {o.label}
                                  </span>
                                </span>
                                <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">
                                  {o.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="landChoiceReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-600">
                        Why the customer chose this land
                        {outcome === "done" && (
                          <span className="text-[#AD1F2A]"> *</span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          className="text-xs"
                          placeholder="The intel this call exists to gather — proximity, price, referral, resale plans…"
                        />
                      </FormControl>
                      {outcome !== "done" && (
                        <FormDescription className="text-[11px]">
                          Optional unless you mark the call done.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-600">
                        Notes
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={2}
                          className="text-xs"
                          placeholder="Anything else worth keeping on the record."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={logCall.isPending}
                  >
                    {logCall.isPending && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    Log call
                  </Button>
                </div>
              </form>
            </Form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
