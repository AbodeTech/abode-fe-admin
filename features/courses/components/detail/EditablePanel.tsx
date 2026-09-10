"use client";

import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useCourseFormStore } from "../../store/course-form-store";

/** A panel that swaps between a read view and a form. See features/assets's EditablePanel for the rationale. */
export function EditablePanel({
  id,
  title,
  description,
  isSaving,
  onSave,
  children,
  form,
}: {
  id: string;
  title: string;
  description?: string;
  isSaving?: boolean;
  onSave: () => void;
  /** The read view. */
  children: React.ReactNode;
  /** The edit view. */
  form: React.ReactNode;
}) {
  const editing = useCourseFormStore((state) => state.editingSections[id] ?? false);
  const startEditing = useCourseFormStore((state) => state.startEditing);
  const stopEditing = useCourseFormStore((state) => state.stopEditing);

  return (
    <section className="rounded-lg border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-medium">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {editing ? (
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => stopEditing(id)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  Saving <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => startEditing(id)}
            className="shrink-0"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      <div className="p-4">{editing ? form : children}</div>
    </section>
  );
}
