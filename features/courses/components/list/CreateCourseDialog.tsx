"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { COURSE_AUDIENCES, COURSE_AUDIENCE_LABELS, type Course, type CourseAudience } from "../../schemas/course.schema";

/** Design preview — appends to the in-memory list held by the courses page; nothing is persisted past a refresh. */
export function CreateCourseDialog({ onCreate }: { onCreate: (course: Course) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<CourseAudience>("realtor");
  const [summary, setSummary] = useState("");

  const resetForm = () => {
    setTitle("");
    setAudience("realtor");
    setSummary("");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!summary.trim()) {
      toast.error("Summary is required");
      return;
    }

    const course: Course = {
      id: `preview-${Date.now()}`,
      title: title.trim(),
      slug: title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      summary: summary.trim(),
      audience,
      estate_id: null,
      estate_name: null,
      cover_url: null,
      status: "draft",
      published_at: null,
      require_in_order: false,
      grants_credential: false,
      credential_validity_months: null,
      credential_renewal: null,
      is_first_sale_path: false,
      modules_count: 0,
      learners_count: 0,
      completed_count: 0,
      estimated_minutes: 0,
    };

    onCreate(course);
    toast.success(`${course.title} created as a draft`);
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New course
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New course</DialogTitle>
            <DialogDescription>
              Starts as a draft — nothing here is visible to associates until you publish it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Title</Label>
              <Input
                id="course-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Selling Empire Park"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-audience">Audience</Label>
              <Select value={audience} onValueChange={(value) => setAudience(value as CourseAudience)}>
                <SelectTrigger id="course-audience" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_AUDIENCES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {COURSE_AUDIENCE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-summary">Summary</Label>
              <Textarea
                id="course-summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What this course covers and who it's for"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create course</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
