"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageContentLoader } from "@/components/shared/page-content-loader";
import { ApiClientError } from "@/lib/api-client";

import { useCampaignDetail } from "../hooks/use-campaign-detail";
import { useCreateCampaign } from "../hooks/use-create-campaign";
import { useUpdateCampaign } from "../hooks/use-update-campaign";
import {
  CREATE_CAMPAIGN_DEFAULTS,
  CreateCampaignSchema,
  STEP_FIELDS,
  type CreateCampaignDto,
} from "../schemas/create-campaign.schema";
import { Header, PageShell, WizardFooter, WizardHeader } from "./CampaignLayout";
import { applyCampaignWriteError } from "../utils/campaign-write-error";
import { BasicsStep } from "./steps/BasicsStep";
import { EligibilityStep } from "./steps/EligibilityStep";
import { RewardStep } from "./steps/RewardStep";
import { ReviewStep } from "./steps/ReviewStep";
import { TargetStep } from "./steps/TargetStep";
import { TriggerStep } from "./steps/TriggerStep";

const stepOrder = ["basics", "trigger", "reward", "eligibility", "target", "review"] as const;
type Step = (typeof stepOrder)[number];

function toDatetimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CampaignCreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft") ?? undefined;
  const { data: draft, isLoading: loadingDraft } = useCampaignDetail(draftId);
  const [step, setStep] = useState<Step>("basics");
  const form = useForm<CreateCampaignDto>({
    resolver: zodResolver(CreateCampaignSchema),
    defaultValues: CREATE_CAMPAIGN_DEFAULTS,
  });
  const { mutateAsync: createCampaign, isPending: creating } = useCreateCampaign();
  const { mutateAsync: updateCampaign, isPending: updating } = useUpdateCampaign(draftId ?? "");
  const stepIndex = stepOrder.indexOf(step);
  const isPending = creating || updating;

  useEffect(() => {
    if (!draft || draft.status !== "draft") return;
    form.reset({
      name: draft.name,
      description: draft.description ?? "",
      start_date: toDatetimeLocal(draft.start_date),
      end_date: toDatetimeLocal(draft.end_date),
      trigger_event: "asset_purchase",
      trigger_unit: "sqm",
      trigger_mode: "divisor",
      trigger_threshold: draft.trigger_threshold,
      rewards_per_threshold: draft.rewards_per_threshold,
      reward_type: draft.reward_type,
      recipient_buyer: draft.recipient_buyer,
      recipient_referrer: draft.recipient_referrer,
      ticket_id_prefix: draft.ticket_id_prefix ?? "",
      buyer_eligible_statuses: draft.buyer_eligible_statuses,
      referrer_eligible_statuses: draft.referrer_eligible_statuses,
      eligible_asset_types: (draft.eligible_asset_types ?? []).filter(
        (value): value is CreateCampaignDto["eligible_asset_types"][number] =>
          value === "flex" || value === "full-ownership" || value === "commercial"
      ),
      total_sqm_target: draft.total_sqm_target ?? null,
      checkpoints: (draft.checkpoints ?? []).map((checkpoint) => ({
        ...checkpoint,
        prize_media_url: checkpoint.prize_media_url ?? "",
      })),
      leaderboard_masking_enabled: draft.leaderboard_masking_enabled ?? true,
    });
  }, [draft, form]);

  const advance = async () => {
    const fieldsForStep = STEP_FIELDS[step];
    const isValid = fieldsForStep.length ? await form.trigger(fieldsForStep) : true;
    if (isValid && stepIndex < stepOrder.length - 1) {
      setStep(stepOrder[stepIndex + 1]);
    }
  };

  const submit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      setStep("basics");
      return;
    }
    const values = form.getValues();
    try {
      const campaign = draftId ? await updateCampaign(values) : await createCampaign(values);
      toast.success(draftId ? "Draft updated" : "Campaign created as draft");
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      const kind = applyCampaignWriteError(error, form);
      if (kind === "checkpoint") {
        setStep("reward");
        return;
      }
      if (kind === "locked") {
        toast.error(
          error instanceof ApiClientError
            ? error.message
            : "That field is locked after the campaign is published."
        );
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not save campaign");
    }
  };

  if (draftId && loadingDraft) {
    return (
      <PageShell narrow>
        <PageContentLoader label="Loading draft…" />
      </PageShell>
    );
  }

  return (
    <PageShell narrow>
      <div className="space-y-2">
        <Link
          href={draftId ? `/campaigns/${draftId}` : "/campaigns"}
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <Header
          title={draftId ? "Edit draft campaign" : "New campaign"}
          subtitle="Saved as a draft. Publishing happens from the campaign dashboard."
        />
      </div>

      <WizardHeader steps={stepOrder} currentIndex={stepIndex} />

      <FormProvider {...form}>
        {step === "basics" && <BasicsStep />}
        {step === "trigger" && <TriggerStep />}
        {step === "reward" && <RewardStep />}
        {step === "eligibility" && <EligibilityStep />}
        {step === "target" && <TargetStep />}
        {step === "review" && <ReviewStep />}
      </FormProvider>

      <WizardFooter>
        {stepIndex > 0 && (
          <Button variant="ghost" type="button" onClick={() => setStep(stepOrder[stepIndex - 1])}>
            Back
          </Button>
        )}
        {stepIndex < stepOrder.length - 1 && (
          <Button type="button" onClick={advance}>
            Next
          </Button>
        )}
        {step === "review" && (
          <Button type="button" onClick={submit} disabled={isPending}>
            {draftId ? "Save draft" : "Create as Draft"}
          </Button>
        )}
      </WizardFooter>
    </PageShell>
  );
}
