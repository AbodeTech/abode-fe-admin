"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useExportUsersByFilter, type ExportUsersParams } from "../../hooks/use-export-users";
import { getErrorMessage } from "../../utils/error-message";

type ExportCategory =
  | "all"
  | "without-refs"
  | "with-refs"
  | "status-users"
  | "status-associates"
  | "status-associates-pro"
  | "without-assets"
  | "with-assets";

const CATEGORY_OPTIONS: Array<{ value: ExportCategory; label: string }> = [
  { value: "all", label: "All Users" },
  { value: "without-refs", label: "Users without Refs" },
  { value: "with-refs", label: "Users with Refs" },
  { value: "status-users", label: "Status Users" },
  { value: "status-associates", label: "Status Associates" },
  { value: "status-associates-pro", label: "Status Associates Pro" },
  { value: "without-assets", label: "Users without Assets" },
  { value: "with-assets", label: "Users with Assets" },
];

const FILTER_MAP: Record<ExportCategory, ExportUsersParams> = {
  all: {},
  "without-refs": { hasReferral: false },
  "with-refs": { hasReferral: true },
  "status-users": { tier: "user" },
  "status-associates": { tier: "associate" },
  "status-associates-pro": { tier: "associate-pro" },
  "without-assets": { hasAsset: false },
  "with-assets": { hasAsset: true },
};

export function UsersExportModal() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExportCategory>("all");

  const user = useAuthStore((state) => state.user);
  const canGenerateReport =
    Boolean(user?.role?.is_super_admin) ||
    (user?.permissions ?? []).includes("generate_reports");

  const { mutateAsync: exportUsers, isPending: isExporting } = useExportUsersByFilter();

  const handleDownload = async () => {
    try {
      await exportUsers(FILTER_MAP[selectedCategory]);
      toast.success("Users downloaded successfully");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to download users"));
    }
  };

  if (!canGenerateReport) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Download Users</DialogTitle>
          <DialogDescription>
            Streams the admin CSV from GET /admin/users?export=csv for the selected filters.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as ExportCategory)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2 rounded-md border p-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
