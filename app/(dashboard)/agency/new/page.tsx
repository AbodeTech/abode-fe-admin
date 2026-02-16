"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgencyOnboardingForm } from "@/features/agency";

export default function NewAgencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
          <Link href="/agency/lists">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agencies
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Onboard New Agency</h1>
        <p className="text-muted-foreground">Create a new agency account and commission profile.</p>
      </div>

      <AgencyOnboardingForm />
    </div>
  );
}
