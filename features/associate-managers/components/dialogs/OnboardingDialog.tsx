"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CalendarClock,
  CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
  LogOnboardingAttemptInput,
  OnboardingOutcome,
  OnboardingSupport,
  OnboardingTimeOfDay,
  OnboardingYesNo,
  OnboardingYesNoUncertain,
} from "@/lib/gql/graphql";
import {
  onboardingSchema,
  SUPPORT_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  type OnboardingFormValues,
} from "../../schemas/onboarding.schema";
import { useOnboardingAttempts, type OnboardingAttemptData } from "../../hooks/use-onboarding-attempts";
import { useLogOnboardingAttempt } from "../../hooks/use-log-onboarding-attempt";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pro: { id: string; name: string; email: string; phone: string | null } | null;
}

const OUTCOMES: {
  value: "picked" | "not_available" | "rescheduled";
  label: string;
  description: string;
  icon: React.ElementType;
  tone: string;
}[] = [
  {
    value: "picked",
    label: "Picked",
    description: "Pro picked up — fill the onboarding form below.",
    icon: PhoneCall,
    tone: "text-[#00695C]",
  },
  {
    value: "not_available",
    label: "Not Available",
    description: "Pro didn't pick up. Log the attempt.",
    icon: PhoneOff,
    tone: "text-amber-600",
  },
  {
    value: "rescheduled",
    label: "Rescheduled",
    description: "Pro picked but asked to talk later.",
    icon: CalendarClock,
    tone: "text-blue-600",
  },
];

const DEFAULTS: OnboardingFormValues = {
  outcome: undefined as unknown as OnboardingFormValues["outcome"],
  motivation: "",
  experience: undefined,
  experienceLength: "",
  prospects: "",
  incomeGoal: "",
  support: undefined,
  supportOther: "",
  readDocs: undefined,
  gotGuide: undefined,
  rescheduleDate: undefined,
  rescheduleTimeOfDay: undefined,
  rescheduleNote: "",
};

const supportLabel = (v?: string | null) =>
  SUPPORT_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "—";
const timeOfDayLabel = (v?: string | null) =>
  TIME_OF_DAY_OPTIONS.find((o) => o.value === v)?.label ?? v ?? "—";
const readDocsLabel = (v?: string | null) =>
  v === "yes" ? "Yes" : v === "no" ? "No" : v === "uncertain" ? "Uncertain" : "—";
const yesNoLabel = (v?: string | null) =>
  v === "yes" ? "Yes" : v === "no" ? "No" : "—";

const managerName = (m: OnboardingAttemptData["manager"]) => {
  if (!m) return "—";
  const full = `${m.lastName ?? ""} ${m.firstName ?? ""}`.trim();
  return full || m.userName || m.email || "—";
};

export function OnboardingDialog({ open, onOpenChange, pro }: Props) {
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: DEFAULTS,
    mode: "onSubmit",
  });

  const { data: attempts = [], isLoading: historyLoading } = useOnboardingAttempts(
    open ? pro?.id : null
  );
  const logAttempt = useLogOnboardingAttempt();

  // Reset whenever the dialog (re)opens.
  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const outcome = form.watch("outcome");
  const experience = form.watch("experience");
  const support = form.watch("support");

  if (!pro) return null;

  const pickedAttempt = attempts.find((a) => a.outcome === "picked");
  const isAlreadyOnboarded = Boolean(pickedAttempt);
  const nextAttemptNumber = attempts.length + 1;

  const onSubmit = async (values: OnboardingFormValues) => {
    const input: LogOnboardingAttemptInput = {
      proId: pro.id,
      outcome: values.outcome as OnboardingOutcome,
    };

    if (values.outcome === "picked") {
      input.motivation = values.motivation?.trim() || undefined;
      input.experience = (values.experience as OnboardingYesNo | undefined) ?? undefined;
      input.experienceLength = values.experienceLength?.trim() || undefined;
      input.prospects = values.prospects?.trim() || undefined;
      input.incomeGoal = values.incomeGoal?.trim() || undefined;
      input.support = (values.support as OnboardingSupport | undefined) ?? undefined;
      input.supportOther = values.supportOther?.trim() || undefined;
      input.readDocs =
        (values.readDocs as OnboardingYesNoUncertain | undefined) ?? undefined;
      input.gotGuide = (values.gotGuide as OnboardingYesNo | undefined) ?? undefined;
    } else if (values.outcome === "rescheduled") {
      input.rescheduleDate = values.rescheduleDate;
      input.rescheduleTimeOfDay =
        (values.rescheduleTimeOfDay as OnboardingTimeOfDay | undefined) ?? undefined;
      input.rescheduleNote = values.rescheduleNote?.trim() || undefined;
    }

    try {
      await logAttempt.mutateAsync(input);
      if (values.outcome === "picked") toast.success(`${pro.name} onboarded`);
      else if (values.outcome === "not_available")
        toast.success(`Attempt ${nextAttemptNumber} logged for ${pro.name}`);
      else if (values.outcome === "rescheduled" && values.rescheduleDate)
        toast.success(`Rescheduled · ${format(values.rescheduleDate, "EEE d MMM")}`);
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to save onboarding attempt");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-[#00695C]" />
            {isAlreadyOnboarded ? "Onboarding record" : "Onboard Associate Pro"}
          </DialogTitle>
          <DialogDescription>
            {isAlreadyOnboarded
              ? `${pro.name}'s onboarding is complete.`
              : `Record the outcome of ${pro.name}'s onboarding call.`}
          </DialogDescription>
        </DialogHeader>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mb-2" />
            Loading onboarding history…
          </div>
        ) : isAlreadyOnboarded && pickedAttempt ? (
          <OnboardedView
            pro={pro}
            picked={pickedAttempt}
            allAttempts={attempts}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="overflow-y-auto flex-1 space-y-5 py-1">
                {/* Pro context */}
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

                {/* Prior attempts (if any) */}
                {attempts.length > 0 && <HistoryPanel attempts={attempts} />}

                {/* Outcome */}
                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Outcome</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-2"
                        >
                          {OUTCOMES.map((o) => {
                            const Icon = o.icon;
                            const isActive = field.value === o.value;
                            return (
                              <label
                                key={o.value}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  isActive
                                    ? "border-[#00695C] bg-[#E0F2F1]/30"
                                    : "border-gray-200 hover:bg-gray-50"
                                )}
                              >
                                <RadioGroupItem
                                  value={o.value}
                                  className="mt-0.5"
                                />
                                <Icon
                                  className={cn("h-4 w-4 mt-0.5 shrink-0", o.tone)}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {o.label}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {o.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Not Available — the attempt number is derived from history */}
                {outcome === "not_available" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900">
                    Logging this as <span className="font-semibold">Attempt {nextAttemptNumber}</span>.
                  </div>
                )}

                {/* Picked — full form */}
                {outcome === "picked" && (
                  <div className="space-y-5 pt-1">
                    <FormField
                      control={form.control}
                      name="motivation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            What motivated you to join Abode, and what are you
                            hoping to achieve?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Their reason for joining + their goal..."
                              className="bg-white min-h-17.5"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>
                            Any previous experience in real estate or property
                            sales?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                if (v === "no")
                                  form.setValue("experienceLength", "");
                              }}
                              className="flex gap-2"
                            >
                              {(["yes", "no"] as const).map((v) => (
                                <label
                                  key={v}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                                    field.value === v
                                      ? "border-[#00695C] bg-[#E0F2F1]/30"
                                      : "border-gray-200 hover:bg-gray-50"
                                  )}
                                >
                                  <RadioGroupItem value={v} />
                                  {v === "yes" ? "Yes" : "No"}
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {experience === "yes" && (
                      <FormField
                        control={form.control}
                        name="experienceLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              For how long?
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. 2 years"
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="prospects"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Any prospects, clients, or contacts already interested
                            in buying property?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Names, leads, anything they already have..."
                              className="bg-white min-h-15"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="incomeGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Income goal from real estate over the next 6 months
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. ₦5,000,000"
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="support"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How can I support you?</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                if (v !== "others")
                                  form.setValue("supportOther", "");
                              }}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Pick the main area of support..." />
                              </SelectTrigger>
                              <SelectContent>
                                {SUPPORT_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {support === "others" && (
                      <FormField
                        control={form.control}
                        name="supportOther"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-gray-500">
                              Specify
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="What other support is needed..."
                                className="bg-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="readDocs"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>
                            Has seen and read through all the onboarding documents
                            (Commission perk, productivity reward, FAQ, etc.)?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-wrap gap-2"
                            >
                              {(["yes", "no", "uncertain"] as const).map((v) => (
                                <label
                                  key={v}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                                    field.value === v
                                      ? "border-[#00695C] bg-[#E0F2F1]/30"
                                      : "border-gray-200 hover:bg-gray-50"
                                  )}
                                >
                                  <RadioGroupItem value={v} />
                                  {v === "yes"
                                    ? "Yes"
                                    : v === "no"
                                      ? "No"
                                      : "Uncertain"}
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gotGuide"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>
                            Got a copy of the 30 Days Sales Guide?
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex gap-2"
                            >
                              {(["yes", "no"] as const).map((v) => (
                                <label
                                  key={v}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                                    field.value === v
                                      ? "border-[#00695C] bg-[#E0F2F1]/30"
                                      : "border-gray-200 hover:bg-gray-50"
                                  )}
                                >
                                  <RadioGroupItem value={v} />
                                  {v === "yes" ? "Yes" : "No"}
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Rescheduled — capture when to call back and any context. */}
                {outcome === "rescheduled" && (
                  <div className="space-y-5 pt-1">
                    <FormField
                      control={form.control}
                      name="rescheduleDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reschedule date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start bg-white font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="h-4 w-4 mr-2" />
                                  {field.value
                                    ? format(field.value, "EEE d MMM yyyy")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(d) =>
                                    d < new Date(new Date().toDateString())
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rescheduleTimeOfDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time of day (optional)</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Anytime is fine — or pick a preference" />
                              </SelectTrigger>
                              <SelectContent>
                                {TIME_OF_DAY_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rescheduleNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Why now isn't a good time, anything to remember for the next call..."
                              className="bg-white min-h-15"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={logAttempt.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={logAttempt.isPending}>
                  {logAttempt.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save onboarding"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HistoryPanel({ attempts }: { attempts: OnboardingAttemptData[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-gray-500">
        History · {attempts.length}
      </p>
      <div className="space-y-2">
        {attempts.map((a) => (
          <AttemptCard key={a._id} attempt={a} />
        ))}
      </div>
    </div>
  );
}

function AttemptCard({ attempt }: { attempt: OnboardingAttemptData }) {
  const when = attempt.createdAt
    ? formatDistanceToNow(new Date(attempt.createdAt), { addSuffix: true })
    : "—";
  const mgr = managerName(attempt.manager);

  if (attempt.outcome === "rescheduled") {
    const date = attempt.rescheduleDate
      ? format(new Date(attempt.rescheduleDate), "EEE d MMM yyyy")
      : "—";
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Rescheduled to {date}
              {attempt.rescheduleTimeOfDay
                ? ` (${timeOfDayLabel(attempt.rescheduleTimeOfDay)})`
                : ""}
            </span>
          </div>
          {attempt.isOverdue && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
              <AlertCircle className="h-3 w-3" />
              Overdue
            </span>
          )}
        </div>
        {attempt.rescheduleNote && (
          <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">
            “{attempt.rescheduleNote}”
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1.5">
          by {mgr} · {when}
        </p>
      </div>
    );
  }

  if (attempt.outcome === "not_available") {
    return (
      <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-3">
        <div className="flex items-center gap-2">
          <PhoneOff className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-gray-900">
            Attempt {attempt.attemptNumber ?? "—"} · couldn&apos;t reach
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          by {mgr} · {when}
        </p>
      </div>
    );
  }

  // picked
  return (
    <div className="rounded-lg border border-[#B8E0D8] bg-[#E0F2F1]/30 p-3">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-[#00695C]" />
        <span className="text-sm font-medium text-gray-900">Onboarded</span>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">
        by {mgr} · {when}
      </p>
    </div>
  );
}

function OnboardedView({
  pro,
  picked,
  allAttempts,
  onClose,
}: {
  pro: { name: string; email: string; phone: string | null };
  picked: OnboardingAttemptData;
  allAttempts: OnboardingAttemptData[];
  onClose: () => void;
}) {
  const onboardedOn = picked.createdAt
    ? format(new Date(picked.createdAt), "EEE d MMM yyyy")
    : "—";
  const otherAttempts = allAttempts.filter((a) => a._id !== picked._id);

  return (
    <>
      <div className="overflow-y-auto flex-1 space-y-5 py-1">
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

        <div className="rounded-lg border border-[#B8E0D8] bg-[#E0F2F1]/40 p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#00695C]" />
            <span className="text-sm font-semibold text-[#00695C]">
              Onboarded on {onboardedOn}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            by {managerName(picked.manager)}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Onboarding answers
          </p>
          <AnswerRow label="Motivation" value={picked.motivation || "—"} />
          <AnswerRow
            label="Prior experience"
            value={
              picked.experience === "yes"
                ? `Yes${picked.experienceLength ? ` · ${picked.experienceLength}` : ""}`
                : yesNoLabel(picked.experience)
            }
          />
          <AnswerRow label="Prospects" value={picked.prospects || "—"} />
          <AnswerRow label="Income goal (6m)" value={picked.incomeGoal || "—"} />
          <AnswerRow
            label="Support needed"
            value={
              picked.support === "others"
                ? `Others${picked.supportOther ? ` · ${picked.supportOther}` : ""}`
                : supportLabel(picked.support)
            }
          />
          <AnswerRow label="Read onboarding docs" value={readDocsLabel(picked.readDocs)} />
          <AnswerRow label="Got 30-day sales guide" value={yesNoLabel(picked.gotGuide)} />
        </div>

        {otherAttempts.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Prior attempts · {otherAttempts.length}
            </p>
            <div className="space-y-2">
              {otherAttempts.map((a) => (
                <AttemptCard key={a._id} attempt={a} />
              ))}
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="pt-4">
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  );
}

function AnswerRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 items-start text-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500 col-span-1 mt-0.5">
        {label}
      </p>
      <div className="col-span-2 text-gray-900 whitespace-pre-wrap">{value}</div>
    </div>
  );
}