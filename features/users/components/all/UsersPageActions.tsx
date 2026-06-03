"use client";

import { RegisterUserModal } from "../modals/RegisterUserModal";
import { UsersExportModal } from "./UsersExportModal";

export function UsersPageActions() {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
      <RegisterUserModal />
      <UsersExportModal />
    </div>
  );
}
