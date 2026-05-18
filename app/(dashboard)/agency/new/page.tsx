"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgencyOnboardingForm } from "@/features/agency";

export default function NewAgencyPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <Button variant="ghost" asChild className="mb-1 h-auto min-h-9 w-full justify-start px-0 py-2 hover:bg-transparent sm:w-fit">
          <Link href="/agency/lists">
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            Back to Agencies
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Onboard New Agency</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Create a new agency account and commission profile.
        </p>
      </div>

      <AgencyOnboardingForm />
    </div>
  );
}
