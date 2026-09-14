"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

import type { CourseSummary } from "../../schemas/course.schema";

type Chip = {
  key: string;
  label: string;
  count: (summary: CourseSummary) => number;
  params: { status?: string; audience?: string };
};

const CHIPS: Chip[] = [
  { key: "all", label: "All", count: (s) => s.total, params: {} },
  { key: "published", label: "Published", count: (s) => s.published, params: { status: "published" } },
  { key: "draft", label: "Draft", count: (s) => s.draft, params: { status: "draft" } },
  { key: "realtor", label: "Realtor", count: (s) => s.realtor, params: { audience: "realtor" } },
  { key: "buyer", label: "Buyer", count: (s) => s.buyer, params: { audience: "buyer" } },
];

/** Quick presets over status/audience — counts reflect the whole catalogue, not the current filter. */
export function CourseFilterChips({ summary }: { summary: CourseSummary }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeStatus = searchParams.get("status") ?? "";
  const activeAudience = searchParams.get("audience") ?? "";

  const apply = (chip: Chip) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("audience");
    if (chip.params.status) params.set("status", chip.params.status);
    if (chip.params.audience) params.set("audience", chip.params.audience);
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {CHIPS.map((chip) => {
        const isActive =
          (chip.params.status ?? "") === activeStatus && (chip.params.audience ?? "") === activeAudience;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => apply(chip)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {chip.label}
            <span className={cn("ml-1.5 tabular-nums", isActive ? "opacity-70" : "text-muted-foreground")}>
              {chip.count(summary)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
