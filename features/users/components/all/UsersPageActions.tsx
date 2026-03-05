"use client";

import { RegisterUserModal } from "../modals/RegisterUserModal";
import { UsersExportModal } from "./UsersExportModal";

export function UsersPageActions() {
  return (
    <div className="flex items-center gap-2">
      <RegisterUserModal />
      <UsersExportModal />
    </div>
  );
}
