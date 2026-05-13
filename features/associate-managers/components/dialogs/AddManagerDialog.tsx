"use client";

import { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_ELIGIBLE_ADMINS, MOCK_UNASSIGNED_PROS } from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddManagerDialog({ open, onOpenChange }: Props) {
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedPros, setSelectedPros] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filteredPros = MOCK_UNASSIGNED_PROS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const togglePro = (id: string) => {
    setSelectedPros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#00695C]" />
            Add Associate Manager
          </DialogTitle>
          <DialogDescription>
            Promote an existing admin to Associate Manager and assign Associate Pros to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin">Select Admin</Label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger id="admin" className="bg-white">
                <SelectValue placeholder="Choose an existing admin..." />
              </SelectTrigger>
              <SelectContent>
                {MOCK_ELIGIBLE_ADMINS.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex flex-col">
                      <span>{a.name}</span>
                      <span className="text-xs text-gray-500">{a.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assign Associate Pros</Label>
              <span className="text-xs text-gray-500">
                {selectedPros.size} selected
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search unassigned Pros..."
                className="pl-8 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="h-56 rounded-md border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {filteredPros.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">No unassigned Pros match your search.</p>
                ) : (
                  filteredPros.map((pro) => (
                    <label
                      key={pro.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPros.has(pro.id)}
                        onCheckedChange={() => togglePro(pro.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{pro.name}</p>
                        <p className="text-xs text-gray-500">{pro.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!selectedAdmin}>Add Manager</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
