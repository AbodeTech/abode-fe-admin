"use client";

import "./dashboard.css";
import Sidebar from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import Container from "@/components/layout/Container";

// Mocking NextStep for now as we focus on UI structure
const NextStepProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NextStepProvider>
      {/* Outer App Container - Gray Background */}
      <div className="flex h-screen bg-[#f5f5f5] overflow-hidden">

        {/* Sidebar - Fixed width, part of the gray background area */}
        <Sidebar />

        {/* Main Content Wrapper - Padded to create the 'floating card' effect */}
        <main className="flex-1 flex flex-col h-full py-2 overflow-hidden">

          {/* The White Card - Contains Header and Page Content */}
          <div className="flex-1 flex flex-col bg-[#fafafa] rounded-[12px] min-h-[calc(100vh-1rem)] shadow-[0_4px_20px_rgba(0,0,0,0.07)] relative">

            {/* Header - Sticky at top of card */}
            <Header />

            <Container className="hidden md:block">
              <div className="w-full h-px bg-[#F0F0F0]" />
            </Container>

            {/* Scrollable Page Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>

          </div>
        </main>
      </div>
    </NextStepProvider>
  );
}
