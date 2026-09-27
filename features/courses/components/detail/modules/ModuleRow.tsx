"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CourseModuleRef } from "../../../schemas/course.schema";

export function ModuleRow({
  module: mod,
  courseId,
  onRename,
  onDelete,
}: {
  module: CourseModuleRef;
  courseId: string;
  onRename: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mod.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card p-3.5",
        isDragging && "opacity-70 shadow-lg"
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold">
        {mod.position}
      </div>

      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{mod.title}</p>

      <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={onRename} aria-label="Rename module">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-red-600 hover:text-red-600"
        onClick={onDelete}
        aria-label="Delete module"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link href={`/academy/courses/${courseId}/modules/${mod.id}`}>Edit content</Link>
      </Button>
    </div>
  );
}
