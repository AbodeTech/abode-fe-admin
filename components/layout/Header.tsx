"use client";

import Container from "./Container";
import { useState } from "react";
import TopSnackbar from "./TopSnackbar";
import Notifications from "./Notifications";
// import { MerchantOverviewData } from "@/types/User"; // Removing type import as requested to focus on design
import SubscriptionBadge from "./SubscriptionBadge";
import { useAuthStore } from "@/store/auth-store";
import { Menu } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

// Design-focused TopBar (Header)
export function Header() {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const { user } = useAuthStore();

  const isLoading = false; // Mock loading state

  const { toggleSidebar, isSidebarCollapsed } = useUIStore();

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E6E6] bg-[#FDFDFD] rounded-t-[12px] md:z-50">
      {snackbarOpen ? (
        <TopSnackbar cancel={() => setSnackbarOpen(false)} />
      ) : (
        <div className="hidden w-full md:flex items-center h-20">
          <Container className="flex items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                onClick={toggleSidebar}
                className="shrink-0 p-2 hover:bg-gray-100 rounded-md"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="h-6 w-6 text-[#222222]" />
              </button>

              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
                  <span className="text-3xl -mt-1 opacity-50">👋🏽</span>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate font-bold text-[#222222] text-xl lg:text-2xl">
                    Hello, {user?.firstName || "User"}
                  </h1>
                  <span className="shrink-0 text-3xl -mt-1">👋🏽</span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {/* Right side cleared as requested */}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
