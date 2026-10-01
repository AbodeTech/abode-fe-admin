"use client";

import { useState } from "react";
import { Layers, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { StandingLadderEditor, StandingMembers } from "@/features/standing";

type Tab = "members" | "ladder";

/**
 * Portfolio standing — the ladder buyers climb by holding land, and who is on
 * each rung.
 *
 * Members first: on most days this page answers "who are my biggest
 * landholders", and the ladder itself changes rarely.
 */
export default function StandingPage() {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900">Portfolio Standing</h1>
        <p className="text-sm text-gray-600">
          Buyers climb this ladder by the total land they hold — plot size × units across every
          live plan. It shows on their portfolio page.
        </p>
      </header>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton active={tab === "members"} onClick={() => setTab("members")} icon={<Users />}>
          Who stands where
        </TabButton>
        <TabButton active={tab === "ladder"} onClick={() => setTab("ladder")} icon={<Layers />}>
          Tiers
        </TabButton>
      </div>

      {tab === "members" ? <StandingMembers /> : <StandingLadderEditor />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors",
        active
          ? "border-[#00695C] text-[#00695C] font-medium"
          : "border-transparent text-gray-600 hover:text-gray-900"
      )}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {children}
    </button>
  );
}
