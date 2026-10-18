"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertTriangle, FileText, GripVertical, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useModules } from "../../../hooks/use-modules";
import {
  BLOCK_TYPES,
  useBlocks,
  useCreateBlock,
  useDeleteBlock,
  useReorderBlocks,
  useUpdateBlock,
  type BlockType,
} from "../../../hooks/use-blocks";
import { useCreateExternalMedia, useDeleteMedia, useMediaStatus, useUploadMedia, type UploadProgress } from "../../../hooks/use-media";
import { useCreateQuizSettings, useModuleQuizzes } from "../../../hooks/use-quiz";
import { courseKeys } from "../../../hooks/query-keys";
import type { ContentBlockRef } from "../../../schemas/course.schema";
import { getErrorMessage } from "../../../utils/error-message";

/**
 * Text blocks store raw HTML (`payload.html`) — that's the BE's contract,
 * not something an admin should have to type. These keep the textarea in
 * plain text: `toHtml` escapes and wraps each blank-line-separated paragraph
 * before saving, `fromHtml` reverses it for editing (via a throwaway DOM
 * node — safe here since we only ever read `.textContent`, never re-insert
 * it unsanitized).
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function htmlToPlainText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return Array.from(container.querySelectorAll("p"))
    .map((p) => p.textContent ?? "")
    .join("\n\n")
    .trim() || (container.textContent ?? "").trim();
}

const BLOCK_LABELS: Record<BlockType, string> = {
  text: "Text",
  image: "Image",
  video: "Video",
  file: "File",
  quiz: "Quiz",
};

/** A YouTube/Vimeo watch URL isn't a video file — `<video src>` can't play it, only an iframe embed can. */
function toEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

/* -------------------- media (image/video/file) block body -------------------- */

function MediaBlockBody({ mediaAssetId, kind }: { mediaAssetId: string; kind: "image" | "video" | "file" }) {
  const { data: asset } = useMediaStatus(mediaAssetId, { poll: true });
  const [loadFailed, setLoadFailed] = useState(false);

  if (!asset) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (asset.status === "failed") {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
        <p className="text-sm text-red-700">{asset.error ?? "This upload failed."}</p>
      </div>
    );
  }

  if (asset.status === "uploading" || asset.status === "processing") {
    return (
      <div className="flex items-center gap-2.5 rounded-md border p-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {asset.status === "processing" ? "Processing…" : "Uploading…"}
        </p>
      </div>
    );
  }

  const source = asset.external_url ?? asset.renditions.source ?? null;

  if (!source) {
    return <p className="text-sm text-muted-foreground">Ready — no file URL was returned.</p>;
  }

  if (loadFailed) {
    return (
      <div className="flex items-center gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0">
          <p className="text-sm text-amber-800">
            Uploaded, but the browser couldn&apos;t load it — likely a storage permissions issue, not a block problem.
          </p>
          <a href={source} target="_blank" rel="noreferrer" className="text-xs underline">
            Open the file directly
          </a>
        </div>
      </div>
    );
  }

  if (kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={source}
        alt=""
        className="h-40 w-full rounded-md border object-cover"
        onError={() => setLoadFailed(true)}
      />
    );
  }

  if (kind === "video") {
    const embedUrl = asset.external_url ? toEmbedUrl(asset.external_url) : null;
    return (
      <div className="space-y-1">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="h-40 w-full rounded-md border sm:h-52"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            controls
            src={source}
            className="h-40 w-full rounded-md border bg-neutral-900 object-contain sm:h-52"
            onError={() => setLoadFailed(true)}
          />
        )}
        {asset.duration_s ? (
          <p className="text-xs text-muted-foreground">
            {Math.floor(asset.duration_s / 60)}:{String(Math.round(asset.duration_s % 60)).padStart(2, "0")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-2.5">
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <a href={source} target="_blank" rel="noreferrer" className="truncate text-sm font-medium underline">
        {source.split("/").pop()}
      </a>
    </div>
  );
}

/** `FinalizeUploadDto.duration_s` is "video duration the browser measured" — the BE never derives it itself. */
function measureVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? Math.round(video.duration) : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}

/* -------------------- new media block picker -------------------- */

/** Mirrors `MediaService`'s `ALLOWED` regex exactly — the BE 415s anything outside this per `kind`. */
const ALLOWED_CONTENT_TYPES: Record<"image" | "video" | "file", RegExp> = {
  video: /^video\/(mp4|quicktime|x-m4v|webm|x-matroska)$/,
  image: /^image\/(jpeg|png|webp|gif|avif)$/,
  file: /^(application\/pdf|application\/msword|application\/vnd\.|text\/plain)/,
};

const ACCEPT_ATTR: Record<"image" | "video" | "file", string> = {
  image: "image/jpeg,image/png,image/webp,image/gif,image/avif",
  video: "video/mp4,video/quicktime,video/webm,video/x-matroska,.mov,.mp4,.webm,.mkv",
  file: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf,application/msword,text/plain",
};

function NewMediaBlock({
  kind,
  onCreated,
  onCancel,
}: {
  kind: "image" | "video" | "file";
  onCreated: (mediaAssetId: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const upload = useUploadMedia();
  const createExternal = useCreateExternalMedia();

  const accept = ACCEPT_ATTR[kind];

  const handleFile = async (file: File) => {
    if (!ALLOWED_CONTENT_TYPES[kind].test(file.type)) {
      toast.error(
        kind === "file"
          ? `"${file.type || "that file type"}" isn't accepted here — PDF, Word, or plain text only. Use the Image or Video block for those.`
          : `"${file.type || "that file type"}" isn't a supported ${kind}.`
      );
      return;
    }
    setProgress({ loaded: 0, total: file.size, pct: 0 });
    const durationSeconds = kind === "video" ? await measureVideoDuration(file) : undefined;
    upload.mutate(
      { kind, file, durationSeconds, onProgress: setProgress },
      {
        onSuccess: (asset) => {
          toast.success(kind === "video" ? "Uploaded — processing" : "Uploaded");
          onCreated(asset.id);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err, "Upload failed."));
          setProgress(null);
        },
      }
    );
  };

  return (
    <div className="rounded-md border border-dashed p-4">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {upload.isPending && progress ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading… {progress.pct ?? 0}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${progress.pct ?? 0}%` }} />
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm font-semibold">Drop a {kind} here</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button type="button" size="sm" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            {kind === "video" ? (
              <div className="flex items-center gap-1.5">
                <Input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="YouTube or Vimeo URL"
                  className="h-8 w-56"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!externalUrl.trim() || createExternal.isPending}
                  onClick={() =>
                    createExternal.mutate(externalUrl.trim(), {
                      onSuccess: (asset) => {
                        toast.success("Video link added");
                        onCreated(asset.id);
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Couldn't add that link.")),
                    })
                  }
                >
                  Add link
                </Button>
              </div>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------- block row -------------------- */

function BlockChrome({
  label,
  onDelete,
  children,
  dragHandleProps,
}: {
  label: string;
  onDelete: () => void;
  children: React.ReactNode;
  // dnd-kit's attributes/listeners types don't expose a clean pass-through shape for a wrapper component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: { attributes: any; listeners: any };
}) {
  return (
    <div className="rounded-lg border bg-card p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className="flex-1" />
        {dragHandleProps ? (
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            {...dragHandleProps.attributes}
            {...dragHandleProps.listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button type="button" onClick={onDelete} className="text-muted-foreground hover:text-red-600" aria-label="Delete block">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {children}
    </div>
  );
}

function BlockRow({
  block,
  onUpdatePayload,
  onDelete,
}: {
  block: ContentBlockRef;
  onUpdatePayload: (payload: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [editingText, setEditingText] = useState(false);
  const [text, setText] = useState("");

  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : undefined}>
      <BlockChrome label={BLOCK_LABELS[block.type]} onDelete={onDelete} dragHandleProps={{ attributes, listeners }}>
        {block.type === "text" ? (
          editingText ? (
            <div className="space-y-2">
              <Textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Plain text — leave a blank line between paragraphs."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!text.trim()}
                  onClick={() => {
                    onUpdatePayload({ html: plainTextToHtml(text) });
                    setEditingText(false);
                  }}
                >
                  Save
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingText(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => {
                setText(htmlToPlainText(String(block.payload.html ?? "")));
                setEditingText(true);
              }}
            >
              {block.payload.html ? (
                <div
                  className="text-sm leading-relaxed text-foreground/90 [&_p]:mb-2 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: String(block.payload.html) }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Click to write…</p>
              )}
            </button>
          )
        ) : block.type === "quiz" ? (
          <p className="text-sm text-muted-foreground">
            Quiz block — edit questions from the course&apos;s Quiz tab.
          </p>
        ) : (
          <MediaBlockBody mediaAssetId={String(block.payload.media_asset_id)} kind={block.type as "image" | "video" | "file"} />
        )}
      </BlockChrome>
    </div>
  );
}

/* -------------------- module editor -------------------- */

export function ModuleEditor() {
  const params = useParams<{ id: string; moduleId: string }>();
  const courseId = params.id;
  const moduleId = params.moduleId;

  const { data: modules, isLoading: loadingModules } = useModules(courseId);
  const { data: blocks, isLoading: loadingBlocks, error } = useBlocks(moduleId);
  const { data: quizzes } = useModuleQuizzes(moduleId);

  const createBlock = useCreateBlock(moduleId);
  const updateBlock = useUpdateBlock(moduleId);
  const deleteBlock = useDeleteBlock(moduleId);
  const reorderBlocks = useReorderBlocks(moduleId);
  const createQuizSettings = useCreateQuizSettings(moduleId);
  const deleteMedia = useDeleteMedia();
  const queryClient = useQueryClient();

  const [addingKind, setAddingKind] = useState<BlockType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (loadingModules || loadingBlocks) return <PageContentLoader label="Loading module…" />;

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Couldn&apos;t load this module</h3>
        <p>{getErrorMessage(error, "It may have been deleted.")}</p>
      </div>
    );
  }

  const mod = modules?.find((m) => m.id === moduleId);
  const rows = blocks ?? [];
  const moduleIndex = modules?.findIndex((m) => m.id === moduleId) ?? -1;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((b) => b.id === active.id);
    const newIndex = rows.findIndex((b) => b.id === over.id);
    reorderBlocks.mutate(
      arrayMove(rows, oldIndex, newIndex).map((b) => b.id),
      {
        onSuccess: () => toast.success("Blocks reordered"),
        onError: (err) => toast.error(getErrorMessage(err, "Couldn't reorder blocks.")),
      }
    );
  };

  const handleAddQuizBlock = async () => {
    try {
      let quizSettingsId = quizzes?.[0]?.id;
      if (!quizSettingsId) {
        const created = await createQuizSettings.mutateAsync({ module_id: moduleId });
        quizSettingsId = created.id;
      }
      createBlock.mutate(
        { type: "quiz", payload: { quiz_settings_id: quizSettingsId } },
        {
          onSuccess: () => {
            toast.success("Quiz block added");
            queryClient.invalidateQueries({ queryKey: courseKeys.courseQuiz(courseId) });
          },
          onError: (err) => toast.error(getErrorMessage(err, "Couldn't add the quiz block.")),
        }
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't create a quiz for this module."));
    }
    setAddingKind(null);
  };

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold wrap-break-word">{mod?.title ?? "Module"}</h2>
        <p className="text-sm text-muted-foreground">
          {moduleIndex >= 0 ? `Module ${moduleIndex + 1} of ${modules?.length}` : null}
        </p>
      </div>

      <div className="min-w-0 space-y-3">
        {rows.length === 0 && addingKind === null ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No content blocks yet.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rows.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {rows.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  onUpdatePayload={(payload) =>
                    updateBlock.mutate(
                      { id: block.id, payload },
                      { onError: (err) => toast.error(getErrorMessage(err, "Couldn't save the block.")) }
                    )
                  }
                  onDelete={() =>
                    deleteBlock.mutate(block.id, {
                      onSuccess: () => {
                        toast.success("Block deleted");
                        // Deleting a block never deletes the media it references — clean it
                        // up here so an image/video/file upload doesn't linger in storage.
                        if (block.type === "video" || block.type === "image" || block.type === "file") {
                          const mediaAssetId = block.payload.media_asset_id;
                          if (typeof mediaAssetId === "string") {
                            deleteMedia.mutate(mediaAssetId, {
                              onError: (err) => toast.error(getErrorMessage(err, "Block deleted, but couldn't remove its media file.")),
                            });
                          }
                        }
                      },
                      onError: (err) => toast.error(getErrorMessage(err, "Couldn't delete the block.")),
                    })
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {addingKind === "text" ? (
          <div className="rounded-lg border p-3.5">
            <TextBlockCreator
              onCancel={() => setAddingKind(null)}
              onCreate={(text) => {
                createBlock.mutate(
                  { type: "text", payload: { html: plainTextToHtml(text) } },
                  {
                    onSuccess: () => setAddingKind(null),
                    onError: (err) => toast.error(getErrorMessage(err, "Couldn't add the block.")),
                  }
                );
              }}
            />
          </div>
        ) : null}

        {addingKind === "image" || addingKind === "video" || addingKind === "file" ? (
          <NewMediaBlock
            kind={addingKind}
            onCancel={() => setAddingKind(null)}
            onCreated={(mediaAssetId) => {
              createBlock.mutate(
                { type: addingKind, payload: { media_asset_id: mediaAssetId } },
                {
                  onSuccess: () => setAddingKind(null),
                  onError: (err) => toast.error(getErrorMessage(err, "Couldn't add the block — the media may still be processing.")),
                }
              );
            }}
          />
        ) : null}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {BLOCK_TYPES.map((type) =>
            type === "quiz" ? (
              <Button
                key={type}
                type="button"
                variant="outline"
                size="sm"
                disabled={rows.some((b) => b.type === "quiz")}
                title={rows.some((b) => b.type === "quiz") ? "This module already has a quiz block" : undefined}
                onClick={handleAddQuizBlock}
              >
                + Quiz
              </Button>
            ) : (
              <Button key={type} type="button" variant="outline" size="sm" onClick={() => setAddingKind(type)}>
                + {BLOCK_LABELS[type]}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function TextBlockCreator({ onCreate, onCancel }: { onCreate: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-2">
      <Label className="text-xs">Text</Label>
      <Textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Plain text — leave a blank line between paragraphs."
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!text.trim()} onClick={() => onCreate(text)}>
          Add
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
