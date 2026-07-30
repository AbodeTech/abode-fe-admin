"use client";

import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useLogout } from "@/features/auth";

interface LogOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogOutModal = ({ isOpen, onClose }: LogOutModalProps) => {
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => {
    // The hook revokes the session server-side (best effort), then clears the
    // cookies, store and query cache in onSettled — so a network failure still
    // signs the admin out locally.
    logout.mutate(undefined, {
      onSettled: () => {
        onClose();
        router.push("/signin");
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={logout.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogout} disabled={logout.isPending}>
            {logout.isPending ? "Logging out…" : "Logout"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogOutModal;
