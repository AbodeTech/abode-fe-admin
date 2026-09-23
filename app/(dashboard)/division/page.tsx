"use client";

import { useState } from "react";
import { Layers, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { DivisionLadderEditor, DivisionMembers } from "@/features/division";

type Tab = "members" | "ladder";

/**
 * Division — the ladder associates climb by placing land in a season, and who
 * is in each one.
 *
 * Members first, same reasoning as Portfolio Standing: on most days this page
 * answers "who is selling", and the ladder itself changes rarely.
 */
export default function DivisionPage() {
  const [tab, setTab] = useState<Tab>("members");

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-gray-900">Division</h1>
        <p className="text-sm text-gray-600">
          Associates climb this ladder by the land they place in a season — plot size × units
          across the sales they referred since 1 January. It shows as a badge on their
          dashboard. Seasons reset every year and past ones are kept as they finished.
        </p>
      </header>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabButton active={tab === "members"} onClick={() => setTab("members")} icon={<Users />}>
          Who is where
        </TabButton>
        <TabButton active={tab === "ladder"} onClick={() => setTab("ladder")} icon={<Layers />}>
          Divisions
        </TabButton>
      </div>

      {tab === "members" ? <DivisionMembers /> : <DivisionLadderEditor />}
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
