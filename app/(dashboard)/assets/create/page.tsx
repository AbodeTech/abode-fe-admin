"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreateAssetForm } from "@/features/assets";

export default function CreateAssetPage() {
  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-4xl space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="min-w-0 space-y-2">
        <Link
          href="/assets"
          className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to assets
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">New asset</h1>
          <p className="text-muted-foreground">
            Start with the estate&apos;s physical size and its initial product pools. Roads, services,
            sizes, and prices can all be completed afterward on the asset&apos;s Offers tab.
          </p>
        </div>
      </div>

      <CreateAssetForm />
    </div>
  );
}
