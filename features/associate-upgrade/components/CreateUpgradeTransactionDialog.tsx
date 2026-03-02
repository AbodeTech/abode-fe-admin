"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpgradeUserSearch } from "../hooks/use-upgrade-user-search";
import { useCreateUpgradeTransaction } from "../hooks/use-create-upgrade-transaction";

type UpgradeSearchUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function CreateUpgradeTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UpgradeSearchUser | null>(null);
  const [amount, setAmount] = useState("");
  const [payCommission, setPayCommission] = useState<"yes" | "no">("no");
  const [commissionAmount, setCommissionAmount] = useState("0");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: users, isLoading: searchingUsers } = useUpgradeUserSearch({
    searchQuery: debouncedQuery,
    enabled: open,
  });

  const { mutateAsync: createTransaction, isPending } = useCreateUpgradeTransaction();

  const searchableUsers = useMemo(
    () => (users ?? []).filter((user): user is UpgradeSearchUser => Boolean(user?._id)),
    [users]
  );

  const resetForm = () => {
    setQuery("");
    setDebouncedQuery("");
    setSelectedUser(null);
    setAmount("");
    setPayCommission("no");
    setCommissionAmount("0");
    setFiles([]);
  };

  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async () => {
    if (!selectedUser?.email) {
      toast.error("Select a user first");
      return;
    }

    if (!amount) {
      toast.error("Amount is required");
      return;
    }

    if (!files[0]) {
      toast.error("Please upload payment evidence");
      return;
    }

    try {
      await createTransaction({
        email: selectedUser.email,
        amount,
        payCommission: payCommission === "yes",
        commissionAmount: payCommission === "yes" ? commissionAmount : "0",
        evidence: files[0],
      });
      toast.success("Transaction created successfully");
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create transaction";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Create Upgrade Transaction</DialogTitle>
          <DialogDescription>Enter details to create a manual associate upgrade transaction.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 relative">
            <Label>Search User</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                <div>
                  <p className="font-medium text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                  Change
                </button>
              </div>
            ) : (
              <>
                <Search className="absolute left-3 top-[38px] h-4 w-4 text-gray-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type name or email..."
                  className="pl-9 h-10"
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-[38px] h-4 w-4 animate-spin text-gray-400" />
                )}

                {debouncedQuery.length >= 2 && searchableUsers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchableUsers.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-gray-100 border-b last:border-0"
                        onClick={() => setSelectedUser(user)}
                      >
                        <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              type="number"
            />
          </div>

          <div className="space-y-2">
            <Label>Pay Commission?</Label>
            <Select value={payCommission} onValueChange={(value) => setPayCommission(value === "yes" ? "yes" : "no")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {payCommission === "yes" && (
            <div className="space-y-2">
              <Label>Commission Amount</Label>
              <Input
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                placeholder="Enter commission amount"
                type="number"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Payment Evidence</Label>
            <FileUpload
              onFilesChange={setFiles}
              maxFiles={1}
              maxSize={5 * 1024 * 1024}
              accept={{
                "image/jpeg": [".jpeg", ".jpg"],
                "image/png": [".png"],
                "application/pdf": [".pdf"],
              }}
              label="Upload receipt"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Transaction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
