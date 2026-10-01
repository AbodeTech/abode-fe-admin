"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useCourseDetail } from "../../../hooks/use-course-detail";
import { useCreateModule, useDeleteModule, useModules, useReorderModules, useUpdateModule } from "../../../hooks/use-modules";
import type { CourseModuleRef } from "../../../schemas/course.schema";
import { getErrorMessage } from "../../../utils/error-message";
import { ModuleRow } from "./ModuleRow";

function TitleDialog({
  open,
  onOpenChange,
  title,
  initialValue,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  isSaving: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setValue(initialValue);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!value.trim()) {
              toast.error("Title is required");
              return;
            }
            onSubmit(value.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="module-title">Title</Label>
            <Input id="module-title" className="mt-1.5" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CourseModules() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const { data: course } = useCourseDetail(courseId);
  const { data: modules, isLoading, error } = useModules(courseId);

  const createModule = useCreateModule(courseId);
  const updateModule = useUpdateModule(courseId);
  const deleteModule = useDeleteModule(courseId);
  const reorderModules = useReorderModules(courseId);

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<CourseModuleRef | null>(null);
  const [deleting, setDeleting] = useState<CourseModuleRef | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !modules) return;

    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    reorderModules.mutate(
      reordered.map((m) => m.id),
      {
        onSuccess: () => toast.success("Modules reordered"),
        onError: (err) => toast.error(getErrorMessage(err, "Couldn't reorder modules.")),
      }
    );
  };

  if (isLoading) return <PageContentLoader label="Loading modules…" />;

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Couldn&apos;t load modules</h3>
        <p>{getErrorMessage(error, "An unexpected error occurred.")}</p>
      </div>
    );
  }

  const rows = modules ?? [];

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold wrap-break-word">{course?.title}</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} module{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add a module
        </Button>
      </div>

      <div className="space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={rows.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {rows.map((mod) => (
              <ModuleRow
                key={mod.id}
                module={mod}
                courseId={courseId}
                onRename={() => setRenaming(mod)}
                onDelete={() => setDeleting(mod)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="font-medium">No modules yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Add one to start building this course.</p>
          </div>
        ) : null}
      </div>

      <TitleDialog
        open={creating}
        onOpenChange={setCreating}
        title="Add a module"
        initialValue=""
        isSaving={createModule.isPending}
        onSubmit={(title) =>
          createModule.mutate(title, {
            onSuccess: () => {
              toast.success("Module added");
              setCreating(false);
            },
            onError: (err) => toast.error(getErrorMessage(err, "Couldn't add the module.")),
          })
        }
      />

      <TitleDialog
        // Radix's onOpenChange only fires from its own internal interactions
        // (overlay click, Escape) — not when `open` is flipped true by us
        // externally, so `initialValue` alone never re-seeded the field.
        // Keying on the module id forces a fresh instance per rename.
        key={renaming?.id ?? "renaming"}
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title="Rename module"
        initialValue={renaming?.title ?? ""}
        isSaving={updateModule.isPending}
        onSubmit={(title) => {
          if (!renaming) return;
          updateModule.mutate(
            { id: renaming.id, title },
            {
              onSuccess: () => {
                toast.success("Module renamed");
                setRenaming(null);
              },
              onError: (err) => toast.error(getErrorMessage(err, "Couldn't rename the module.")),
            }
          );
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.title}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the module and its content blocks. This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteModule.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteModule.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!deleting) return;
                deleteModule.mutate(deleting.id, {
                  onSuccess: () => {
                    toast.success("Module deleted");
                    setDeleting(null);
                  },
                  onError: (err) => toast.error(getErrorMessage(err, "Couldn't delete the module.")),
                });
              }}
            >
              {deleteModule.isPending ? "Deleting…" : "Delete module"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
