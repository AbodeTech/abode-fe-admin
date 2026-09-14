"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { isModulePublishable, type CourseModule } from "../../../dummy-modules";

function ModuleTags({ tags, durationMinutes }: { tags: CourseModule["tags"]; durationMinutes: number }) {
  return (
    <>
      {tags.map((tag) => (
        <Badge key={tag} variant={tag === "Text" ? "secondary" : "outline"}>
          {tag}
        </Badge>
      ))}
      <span className="text-xs whitespace-nowrap text-muted-foreground">{durationMinutes} min</span>
    </>
  );
}

export function ModuleRow({
  module: mod,
  courseId,
  highlighted,
}: {
  module: CourseModule;
  courseId: string;
  highlighted?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const publishable = isModulePublishable(mod);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-3.5 sm:items-center",
        highlighted && "border-foreground",
        isDragging && "opacity-70 shadow-lg"
      )}
    >
      <button
        type="button"
        className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground sm:mt-0"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold sm:mt-0",
          highlighted && "border-foreground bg-foreground text-background"
        )}
      >
        {mod.position}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-semibold wrap-break-word">{mod.title}</p>
          {!publishable ? (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
              Can&apos;t publish yet
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground sm:truncate">{mod.description}</p>
        {/* Tags/duration move here on narrow screens instead of being hidden. */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
          <ModuleTags tags={mod.tags} durationMinutes={mod.durationMinutes} />
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        <ModuleTags tags={mod.tags} durationMinutes={mod.durationMinutes} />
      </div>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={`/academy/courses/${courseId}/modules/${mod.id}`}>Edit</Link>
      </Button>
    </div>
  );
}
