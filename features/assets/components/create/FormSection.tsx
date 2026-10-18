"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { useAssetFormStore } from "../../store/asset-form-store";

/**
 * A collapsible block of the create form.
 *
 * Open/closed lives in the form store rather than local state — with an asset,
 * two offers, several sizes and several plans each, this would otherwise be a
 * dozen `useState` calls threaded through four levels of component.
 *
 * Content stays mounted when collapsed. React Hook Form tracks unmounted
 * fields inconsistently, and a validation error hiding inside a closed section
 * is worse than the small render cost.
 */
export function FormSection({
  id,
  title,
  description,
  badge,
  actions,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const open = useAssetFormStore((state) => state.openSections[id] ?? defaultOpen);
  const toggleSection = useAssetFormStore((state) => state.toggleSection);

  return (
    <section className="rounded-lg border">
      <div className="flex min-w-0 items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              !open && "-rotate-90"
            )}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{title}</span>
              {badge}
            </span>
            {description ? (
              <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
            ) : null}
          </span>
        </button>

        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className={cn("border-t p-4", !open && "hidden")}>{children}</div>
    </section>
  );
}
