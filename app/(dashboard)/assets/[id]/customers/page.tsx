"use client";

import { SampleDataBanner } from "@/features/assets";

export default function AssetCustomersPage() {
  return (
    <div className="space-y-4">
      {/*
        ⛔ ticket 17c — no subscribers endpoint exists. Deliberately NOT
        mocked: fabricating aggregate figures is one thing, but inventing named
        customers with balances owed is the kind of thing someone acts on.
      */}
      <SampleDataBanner>
        <strong className="font-medium text-foreground">Not available yet.</strong> There&apos;s no
        endpoint for an asset&apos;s subscribers, so this list can&apos;t be shown. Unlike the
        Performance tab it isn&apos;t mocked — inventing customer names and balances would be worse
        than showing nothing.
      </SampleDataBanner>
    </div>
  );
}
