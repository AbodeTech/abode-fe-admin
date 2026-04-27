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
import {
  useExportUsersByFilter,
  useExportUsersWithAsset,
} from "../../hooks/use-export-users";
import { exportToCsv } from "../../utils/export-csv";
import { getErrorMessage } from "../../utils/error-message";

type ExportCategory =
  | "all"
  | "defaulters"
  | "without-refs"
  | "with-refs"
  | "without-tin"
  | "with-tin"
  | "status-users"
  | "status-associates"
  | "status-associates-pro"
  | "without-assets"
  | "with-assets"
  | "flex"
  | "full-ownership";

const CATEGORY_OPTIONS: Array<{ value: ExportCategory; label: string }> = [
  { value: "all", label: "All Users" },
  { value: "defaulters", label: "Defaulters" },
  { value: "without-refs", label: "Users without Refs" },
  { value: "with-refs", label: "Users with Refs" },
  { value: "without-tin", label: "Users without TIN" },
  { value: "with-tin", label: "Users with TIN" },
  { value: "status-users", label: "Status Users" },
  { value: "status-associates", label: "Status Associates" },
  { value: "status-associates-pro", label: "Status Associates Pro" },
  { value: "without-assets", label: "Users without Assets" },
  { value: "with-assets", label: "Users with Assets" },
  { value: "flex", label: "Flex Users" },
  { value: "full-ownership", label: "Full Ownership Users" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const formatAmount = (value?: number | null) => `₦${Number(value ?? 0).toLocaleString()}`;

export function UsersExportModal() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExportCategory>("all");

  const user = useAuthStore((state) => state.user);
  const canGenerateReport =
    user?.role === "admin" || (user?.permissions ?? []).includes("generate_reports");

  const { mutateAsync: exportUsersByFilter, isPending: exportingFiltered } = useExportUsersByFilter();
  const { mutateAsync: exportUsersWithAsset, isPending: exportingWithAsset } = useExportUsersWithAsset();
  const isExporting = exportingFiltered || exportingWithAsset;

  const handleDownload = async () => {
    try {
      if (selectedCategory === "with-assets" || selectedCategory === "flex" || selectedCategory === "full-ownership") {
        const response = await exportUsersWithAsset({
          assetType:
            selectedCategory === "with-assets"
              ? undefined
              : selectedCategory,
        });
        const rows = (response.usersWithAsset?.data ?? []).filter(
          (userRow): userRow is NonNullable<typeof userRow> => userRow !== null
        );

        const flattenedRows = rows.flatMap((userRow) =>
          (userRow.customer_assets ?? [])
            .filter((asset): asset is NonNullable<typeof asset> => asset !== null)
            .map((asset) => ({
              firstName: userRow.firstName || "",
              lastName: userRow.lastName || "",
              email: userRow.email || "",
              phoneNumber: userRow.phone ? `'${userRow.phone}` : "",
              occupation: userRow.occupation || "",
              gender: userRow.gender || "",
              dateOfBirth: formatDate(userRow.dateOfBirth),
              referrer: userRow.referral?.name || "",
              asset_name: asset.asset_name || "",
              asset_type: asset.asset_type || "",
              size: asset.size ?? 0,
              units_subscribed: asset.no_of_units ?? 0,
              land_price: formatAmount(asset.land_price),
              document_price: formatAmount(asset.document_price),
              land_amount_paid: formatAmount(asset.land_amount_paid),
              document_amount_paid: formatAmount(asset.document_amount_paid),
              balance: formatAmount(asset.balance),
              start_date: formatDate(asset.start_date),
              months_subscription: asset.month_subscription ?? 0,
              months_remaining: asset.months_remaining ?? 0,
              next_date_of_payment: formatDate(asset.next_date_of_payment),
            }))
        );

        if (!flattenedRows.length) {
          toast.info("No users with assets to export");
          return;
        }

        exportToCsv(
          flattenedRows,
          Object.keys(flattenedRows[0]).map((key) => ({
            header: key,
            accessor: (row) => row[key as keyof typeof row],
          })),
          "users-with-asset.csv"
        );
      } else {
        const filterMap: Record<
          Exclude<ExportCategory, "with-assets" | "flex" | "full-ownership">,
          { referralStatus?: string; hasAsset?: boolean; hasReferral?: boolean; hasTin?: boolean }
        > = {
          all: {},
          defaulters: { referralStatus: "null" },
          "without-refs": { hasReferral: false },
          "with-refs": { hasReferral: true },
          "without-tin": { hasTin: false },
          "with-tin": { hasTin: true },
          "status-users": { referralStatus: "user" },
          "status-associates": { referralStatus: "associate" },
          "status-associates-pro": { referralStatus: "associate-pro" },
          "without-assets": { hasAsset: false },
        };

        const response = await exportUsersByFilter(filterMap[selectedCategory]);
        const rows = (response.getAllUsersWithFilters?.data ?? []).filter(
          (row): row is NonNullable<typeof row> => row !== null
        );
        const exportRows = rows.map((row) => ({
          firstName: row.firstName || "",
          lastName: row.lastName || "",
          email: row.email || "",
          tin: row.tin || "",
          gender: row.gender || "",
          occupation: row.occupation || "",
          phoneNumber: row.phoneNumber ? `'${row.phoneNumber}` : "",
          address: row.address || "",
          country: row.country || "",
          referrer: row.referral?.firstName && row.referral?.lastName
            ? `${row.referral.firstName} ${row.referral.lastName}`
            : "",
          referrerEmail: row.referral?.email || "",
          last_login: formatDate(row.last_login),
          createdAt: formatDate(row.createdAt),
        }));

        if (!exportRows.length) {
          toast.info("No users found for selected category");
          return;
        }

        exportToCsv(
          exportRows,
          Object.keys(exportRows[0]).map((key) => ({
            header: key,
            accessor: (row) => row[key as keyof typeof row],
          })),
          "users.csv"
        );
      }

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
            Select the category of users you want to download.
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
