"use client";

import "./dashboard.css";
import Sidebar from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import Container from "@/components/layout/Container";
import { Menu } from "lucide-react";
import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";

// Mocking NextStep for now as we focus on UI structure
const NextStepProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isMobileNavOpen, toggleMobileNav, closeMobileNav } = useUIStore();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) closeMobileNav();
    };
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, [closeMobileNav]);

  return (
    <NextStepProvider>
      {/* Outer App Container - Gray Background */}
      <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">
        {isMobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-55 bg-black/40 md:hidden"
            onClick={closeMobileNav}
          />
        )}

        {/* Sidebar: off-canvas on small screens so main content can use full width */}
        <div className="w-0 shrink-0 overflow-visible md:w-auto md:shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Wrapper - Padded to create the 'floating card' effect */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col py-2 overflow-hidden">

          {/* The White Card - Contains Header and Page Content */}
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-[12px] bg-[#fafafa] shadow-[0_4px_20px_rgba(0,0,0,0.07)] mx-1 sm:mx-2 md:mx-0">

            <div className="flex shrink-0 items-center gap-3 rounded-t-[12px] border-b border-[#E6E6E6] px-3 py-3 md:hidden">
              <button
                type="button"
                onClick={toggleMobileNav}
                className="rounded-md p-2 hover:bg-gray-100"
                aria-expanded={isMobileNavOpen}
                aria-controls="dashboard-sidebar"
              >
                <Menu className="h-6 w-6 text-[#222222]" />
              </button>
              <span className="truncate font-semibold text-[#222222]">Dashboard</span>
            </div>

            {/* Header - Sticky at top of card (desktop) */}
            <Header />

            <Container className="hidden md:block">
              <div className="w-full h-px bg-[#F0F0F0]" />
            </Container>

            {/* Scrollable Page Content — inner column fills height so centered loaders align in the viewport */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex min-h-full min-w-0 flex-1 flex-col">{children}</div>
            </div>

          </div>
        </main>
      </div>
    </NextStepProvider>
  );
}
