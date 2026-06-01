"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  ClipboardCheck,
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
import { cn } from "@/lib/utils";
import {
  onboardingSchema,
  SUPPORT_OPTIONS,
  type OnboardingFormValues,
} from "../../schemas/onboarding.schema";

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

const ATTEMPTS = [
  { value: "1", label: "1st attempt" },
  { value: "2", label: "2nd attempt" },
  { value: "3", label: "3rd attempt" },
] as const;

const DEFAULTS: OnboardingFormValues = {
  outcome: undefined as unknown as OnboardingFormValues["outcome"],
  attempt: undefined,
  motivation: "",
  experience: undefined,
  experienceLength: "",
  prospects: "",
  incomeGoal: "",
  support: undefined,
  supportOther: "",
  readDocs: undefined,
  gotGuide: undefined,
};

export function OnboardingDialog({ open, onOpenChange, pro }: Props) {
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: DEFAULTS,
    mode: "onSubmit",
  });

  // Reset whenever the dialog (re)opens.
  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const outcome = form.watch("outcome");
  const experience = form.watch("experience");
  const support = form.watch("support");

  if (!pro) return null;

  const onSubmit = (values: OnboardingFormValues) => {
    // Mock save — BE doesn't expose an onboarding endpoint yet.
    if (values.outcome === "picked") toast.success(`${pro.name} onboarded`);
    else if (values.outcome === "not_available")
      toast.success(`Attempt ${values.attempt} logged for ${pro.name}`);
    else toast.success(`${pro.name} marked as rescheduled`);
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
            Record the outcome of {pro.name}&apos;s onboarding call.
          </DialogDescription>
        </DialogHeader>

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

              {/* Not Available — attempt number */}
              {outcome === "not_available" && (
                <FormField
                  control={form.control}
                  name="attempt"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Attempt</FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap gap-2"
                        >
                          {ATTEMPTS.map((a) => (
                            <label
                              key={a.value}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm",
                                field.value === a.value
                                  ? "border-amber-400 bg-amber-50 text-amber-800"
                                  : "border-gray-200 hover:bg-gray-50"
                              )}
                            >
                              <RadioGroupItem value={a.value} />
                              {a.label}
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

              {/* Rescheduled — no extra fields for now */}
              {outcome === "rescheduled" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                  Rescheduled outcome will be logged. A reschedule date field
                  can be added when business decides whether to track it.
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save onboarding</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
