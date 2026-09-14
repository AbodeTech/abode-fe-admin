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

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { DUMMY_COURSES } from "../../../dummy-data";
import { getModulesForCourse, moduleStats } from "../../../dummy-modules";
import { ModuleRow } from "./ModuleRow";

/**
 * Design preview — reorder, add, and the "Require in order" toggle all
 * update local state only. See dummy-modules.ts's header.
 */
export function CourseModules() {
  const params = useParams<{ id: string }>();
  const course = DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];

  const [modules, setModules] = useState(() => getModulesForCourse(course.id, course.modules_count));
  const [requireInOrder, setRequireInOrder] = useState(course.require_in_order);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((items) => {
      const oldIndex = items.findIndex((m) => m.id === active.id);
      const newIndex = items.findIndex((m) => m.id === over.id);
      return arrayMove(items, oldIndex, newIndex).map((m, index) => ({ ...m, position: index + 1 }));
    });
  };

  const handleAddModule = () => {
    setModules((prev) => [
      ...prev,
      {
        id: `mod-new-${Date.now()}`,
        courseId: course.id,
        position: prev.length + 1,
        title: "Untitled module",
        description: "Add a description",
        kind: "lesson",
        tags: ["Text"],
        durationMinutes: 0,
        durationIsOverride: false,
        countsTowardCompletion: true,
        blocks: [],
      },
    ]);
  };

  const stats = moduleStats(modules);

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold wrap-break-word">{course.title}</h2>
          <p className="text-sm text-muted-foreground">
            {modules.length} module{modules.length === 1 ? "" : "s"} · {stats.totalMinutes} minutes end to end
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => toast.success("Modules saved")}>
          Save
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              {modules.map((mod) => (
                <ModuleRow key={mod.id} module={mod} courseId={course.id} />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={handleAddModule}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Add a module
          </button>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">This course</h3>
            </div>
            <div className="space-y-1 p-4 text-sm">
              <div className="flex items-center justify-between border-b py-2.5">
                <span className="text-muted-foreground">Lessons</span>
                <span className="font-medium tabular-nums">{stats.lessons}</span>
              </div>
              <div className="flex items-center justify-between border-b py-2.5">
                <span className="text-muted-foreground">Quizzes</span>
                <span className="font-medium tabular-nums">{stats.quizzes}</span>
              </div>
              <div className="flex items-center justify-between border-b py-2.5">
                <span className="text-muted-foreground">Video</span>
                <span className="font-medium tabular-nums">
                  {stats.videoClips} clip{stats.videoClips === 1 ? "" : "s"}
                  {stats.videoClips > 0 ? ` · ${stats.videoMinutes} min` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Total time</span>
                <span className="font-medium tabular-nums">{stats.totalMinutes} min</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Ordering</h3>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="require-in-order"
                  checked={requireInOrder}
                  onCheckedChange={(checked) => setRequireInOrder(Boolean(checked))}
                />
                <Label htmlFor="require-in-order" className="text-sm font-semibold">
                  Require in order
                </Label>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {requireInOrder ? "On" : "Off"}. {requireInOrder
                  ? "Each module is gated behind the one before it — which also gates the first sale behind reading in sequence."
                  : "An associate can open any module at any time. Turning it on gates each module behind the one before it — which also gates the first sale behind reading in sequence."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
