"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { logoutAction } from "@/actions/auth";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

interface LogOutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogOutModal = ({ isOpen, onClose }: LogOutModalProps) => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    // 1. Server-side logout (clear cookies)
    await logoutAction();

    // 2. Client-side logout (clear store)
    logout();

    // 3. Close modal and redirect
    onClose();
    router.push("/signin");
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogOutModal;
