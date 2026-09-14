"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, FileText, GripVertical, Play, Quote as QuoteIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DUMMY_COURSES } from "../../../dummy-data";
import { getModulesForCourse, isModulePublishable, type ContentBlock } from "../../../dummy-modules";

const WOODGATE_PRIME_ID = "66cc0a0000000000000001";

/** Illustrative — Abode's real published figures for Woodgate Prime, per the design's own note. */
const WOODGATE_LIVE_FIGURES = [
  { key: "{{monthly}}", value: "₦19,000" },
  { key: "{{total}}", value: "₦684,000" },
  { key: "{{allocation_at}}", value: "₦205,200" },
  { key: "{{payments}}", value: "36" },
];

function notWired() {
  toast("Block editing isn't wired up yet — this is a design preview.");
}

function BlockChrome({
  label,
  extra,
  children,
}: {
  label: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        {extra}
        <span className="flex-1" />
        <button type="button" className="cursor-grab text-muted-foreground hover:text-foreground" onClick={notWired}>
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === "heading") {
    return (
      <BlockChrome label="Heading">
        <h3 className="text-lg font-semibold tracking-tight">{block.text}</h3>
      </BlockChrome>
    );
  }

  if (block.type === "text") {
    return (
      <BlockChrome label="Text">
        <div className="mb-2.5 flex flex-wrap gap-1 rounded-md bg-muted p-1">
          {["B", "I", "H", "“", "≔", "🔗"].map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={notWired}
              className="flex h-6 w-6 items-center justify-center rounded border bg-background text-xs font-semibold"
            >
              {icon}
            </button>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{block.text}</p>
      </BlockChrome>
    );
  }

  if (block.type === "callout") {
    return (
      <BlockChrome label="Callout">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3.5">
          <p className="mb-1 text-sm font-semibold">{block.title}</p>
          <p className="text-sm leading-relaxed text-foreground/90">{block.body}</p>
        </div>
      </BlockChrome>
    );
  }

  if (block.type === "quote") {
    return (
      <BlockChrome label="Quote">
        <div className="flex gap-2.5 border-l-2 border-foreground/30 pl-3.5">
          <QuoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm leading-relaxed italic text-foreground/90">{block.text}</p>
            {block.attribution ? (
              <p className="mt-1.5 text-xs text-muted-foreground">— {block.attribution}</p>
            ) : null}
          </div>
        </div>
      </BlockChrome>
    );
  }

  if (block.type === "image") {
    return (
      <BlockChrome label="Image">
        <div className="flex h-32 w-full items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
          {block.url.split("/").pop()}
        </div>
        {block.caption ? <p className="mt-1.5 text-xs text-muted-foreground">{block.caption}</p> : null}
      </BlockChrome>
    );
  }

  if (block.type === "file") {
    return (
      <BlockChrome label="File">
        <div className="flex items-center gap-3 rounded-md border p-2.5">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.filename}</p>
            <p className="text-xs text-muted-foreground">{block.sizeLabel}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={notWired}>
            Replace
          </Button>
        </div>
      </BlockChrome>
    );
  }

  // video
  if (block.status === "ready") {
    return (
      <BlockChrome label="Video" extra={<Badge variant="default">Ready</Badge>}>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="relative flex h-40 w-full shrink-0 items-center justify-center rounded-md bg-neutral-900 sm:h-24 sm:w-40">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
              <Play className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
            </div>
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {block.durationLabel}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.filename}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {block.sizeLabel} · {block.uploadedLabel}
              <br />
              Streams at 360p / 720p / 1080p
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={notWired}>
                Replace
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={notWired}>
                Add captions
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={notWired}>
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-xs">Caption</Label>
          <Input defaultValue={block.caption} onChange={notWired} />
        </div>
      </BlockChrome>
    );
  }

  if (block.status === "processing") {
    return (
      <BlockChrome label="Video" extra={<Badge variant="secondary">Processing</Badge>}>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div
            className="h-40 w-full shrink-0 rounded-md sm:h-24 sm:w-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, var(--muted) 0, var(--muted) 9px, transparent 9px, transparent 18px)",
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.filename}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {block.sizeLabel} · {block.uploadedLabel}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${block.progressPct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {block.progressPct}% · {block.etaLabel}. You can keep editing — the module will not publish until
              this finishes.
            </p>
          </div>
        </div>
      </BlockChrome>
    );
  }

  if (block.status === "failed") {
    return (
      <BlockChrome label="Video" extra={<Badge variant="destructive">Failed</Badge>}>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-md border border-dashed border-red-300 bg-red-50 sm:h-24 sm:w-40">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.filename}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {block.sizeLabel} · {block.uploadedLabel}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-red-600">{block.errorMessage}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={notWired}>
                Try again
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={notWired}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </BlockChrome>
    );
  }

  if (block.status === "external") {
    return (
      <BlockChrome label="Video" extra={<Badge variant="outline">{block.provider === "youtube" ? "YouTube" : "Vimeo"}</Badge>}>
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-md bg-neutral-900 sm:h-24 sm:w-40">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
              <Play className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{block.url}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Embedded — no transcoding runs for external links.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={notWired}>
                Replace link
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={notWired}>
                Remove
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Label className="text-xs">Caption</Label>
          <Input defaultValue={block.caption} onChange={notWired} />
        </div>
      </BlockChrome>
    );
  }

  return (
    <BlockChrome label="Video · empty">
      <div className="rounded-md border border-dashed p-6 text-center">
        <p className="text-sm font-semibold">Drop a video here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          MP4, MOV or WebM · up to 2 GB · we transcode to 360p, 720p and 1080p
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button type="button" size="sm" onClick={notWired}>
            Browse files
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={notWired}>
            Paste a YouTube or Vimeo link
          </Button>
        </div>
      </div>
    </BlockChrome>
  );
}

function mediaStats(blocks: ContentBlock[]) {
  const readyVideos = blocks.filter(
    (b): b is Extract<ContentBlock, { type: "video"; status: "ready" }> => b.type === "video" && b.status === "ready"
  );
  const hasProcessing = blocks.some((b) => b.type === "video" && b.status === "processing");
  const totalSeconds = readyVideos.reduce((total, v) => total + v.durationSeconds, 0);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  const durationLabel = readyVideos.length ? `${mm}:${String(ss).padStart(2, "0")}${hasProcessing ? " + pending" : ""}` : "—";
  const images = blocks.filter((b) => b.type === "image").length;

  return { videoClips: readyVideos.length, durationLabel, images };
}

export function ModuleEditor() {
  const params = useParams<{ id: string; moduleId: string }>();
  const course = DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];
  const modules = getModulesForCourse(course.id, course.modules_count);
  const initial = modules.find((m) => m.id === params.moduleId) ?? modules[0];
  const moduleIndex = modules.findIndex((m) => m.id === initial.id);

  const [title, setTitle] = useState(initial.title);
  const [countsTowardCompletion, setCountsTowardCompletion] = useState(initial.countsTowardCompletion);
  const [durationIsOverride, setDurationIsOverride] = useState(initial.durationIsOverride);
  const [overrideMinutes, setOverrideMinutes] = useState(initial.durationMinutes);
  const [dirty, setDirty] = useState(false);

  const media = mediaStats(initial.blocks);
  const showLiveFigures = course.id === WOODGATE_PRIME_ID;
  const publishable = isModulePublishable(initial);

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold wrap-break-word">{title}</h2>
            {dirty ? <Badge variant="secondary">Unsaved</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Module {moduleIndex + 1} of {modules.length} · about {durationIsOverride ? overrideMinutes : initial.durationMinutes}{" "}
            minutes
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast("Preview isn't wired up yet")}>
            Preview as associate
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setDirty(false);
              toast.success("Module saved");
            }}
          >
            Save module
          </Button>
        </div>
      </div>

      {!publishable ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            This module can&apos;t publish yet — a video below is still processing or failed to process. You can
            keep editing everything else in the meantime.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 space-y-3">
          {initial.blocks.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No content blocks yet.
            </div>
          ) : (
            initial.blocks.map((block) => <BlockRenderer key={block.id} block={block} />)
          )}

          <div className="flex flex-wrap gap-1.5 pt-1">
            {["Text", "Heading", "Image", "Video", "Callout", "File", "Quote"].map((label) => (
              <Button key={label} type="button" variant="outline" size="sm" onClick={notWired}>
                + {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Module</h3>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setDirty(true);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Reading time</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    onClick={() => {
                      setDurationIsOverride((prev) => !prev);
                      setDirty(true);
                    }}
                  >
                    {durationIsOverride ? "Use auto" : "Override"}
                  </button>
                </div>
                {durationIsOverride ? (
                  <Input
                    type="number"
                    min={1}
                    value={overrideMinutes}
                    onChange={(e) => {
                      setOverrideMinutes(e.target.valueAsNumber || 0);
                      setDirty(true);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>{initial.durationMinutes} min</span>
                    <Badge variant="secondary">Auto</Badge>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Words on the page plus video duration. Override if you disagree.
                </p>
              </div>
              <div className="flex items-center gap-2 border-t pt-3.5">
                <Checkbox
                  id="counts-toward-completion"
                  checked={countsTowardCompletion}
                  onCheckedChange={(checked) => {
                    setCountsTowardCompletion(Boolean(checked));
                    setDirty(true);
                  }}
                />
                <Label htmlFor="counts-toward-completion" className="text-sm font-semibold">
                  Counts toward completion
                </Label>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">
                Off makes it optional background reading that does not block finishing the course.
              </p>
            </div>
          </section>

          <section className="rounded-lg border">
            <div className="border-b px-4 py-3">
              <h3 className="font-medium">Media in this module</h3>
            </div>
            <div className="space-y-1 p-4 text-sm">
              <div className="flex items-center justify-between border-b py-2.5">
                <span className="text-muted-foreground">Video</span>
                <span className="font-medium tabular-nums">{media.videoClips} clips</span>
              </div>
              <div className="flex items-center justify-between border-b py-2.5">
                <span className="text-muted-foreground">Total duration</span>
                <span className="font-medium tabular-nums">{media.durationLabel}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-muted-foreground">Images</span>
                <span className="font-medium tabular-nums">{media.images}</span>
              </div>
            </div>
          </section>

          {course.estate_id ? (
            <section className="rounded-lg border">
              <div className="border-b px-4 py-3">
                <h3 className="font-medium">Live figures</h3>
              </div>
              <div className="p-4">
                <p className="mb-2.5 text-sm leading-relaxed text-muted-foreground">
                  This course is linked to {course.estate_name}. Drop these into the text and they update
                  themselves when the estate changes — so a price move never leaves the training wrong.
                </p>
                {showLiveFigures ? (
                  <div className="space-y-1 text-sm">
                    {WOODGATE_LIVE_FIGURES.map((figure) => (
                      <div key={figure.key} className="flex items-center justify-between border-t py-2 first:border-t-0">
                        <span className="text-muted-foreground">{figure.key}</span>
                        <span className="font-medium tabular-nums">{figure.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Not available in this preview.</p>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
